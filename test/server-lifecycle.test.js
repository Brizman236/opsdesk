
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");
const { afterEach, test } = require("node:test");

const repositoryRoot = path.resolve(__dirname, "..");

const childScript = `
const Module = require("node:module");
const http = require("node:http");
const serverPath = require.resolve("./src/server.js");
const originalLoad = Module._load;
const nativeSetTimeout = global.setTimeout;

if (process.env.SHORT_SHUTDOWN_TIMEOUT === "1") {
  global.setTimeout = (callback, delay, ...args) =>
    nativeSetTimeout(callback, delay === 30_000 ? 25 : delay, ...args);
}

Module._load = function(request, parent, isMain) {
  if (parent && parent.filename === serverPath && request === "./app") {
    return {
      listen(port, callback) {
        const server = http.createServer((req, res) => {
          process.stdout.write("REQUEST_STARTED\\n");

          const requestTimer = setTimeout(() => {
            process.stdout.write("REQUEST_FINISHED\\n");
            res.end("completed");
          }, Number(process.env.REQUEST_DELAY_MS || 100));

          res.on("close", () => {
            clearTimeout(requestTimer);
          });
        });

        const originalCloseAllConnections =
          server.closeAllConnections.bind(server);

        server.closeAllConnections = () => {
          process.stdout.write("HTTP_FORCE_CLOSE\\\\n");
          return originalCloseAllConnections();
        };

        server.on("close", () => {
          process.stdout.write("HTTP_SERVER_CLOSED\\\\n");
        });

        return server.listen(port, () => {
          process.stdout.write("READY " + server.address().port + "\\\\n");
          callback();
        });
      }
    };
  }

  if (parent && parent.filename === serverPath && request === "./db") {
    return {
      pool: {
        end() {
          process.stdout.write("POOL_END_START\\\\n");

          return new Promise((resolve, reject) => {
            setTimeout(() => {
              if (process.env.POOL_END_FAIL === "1") {
                reject(new Error("simulated pool close failure"));
              } else {
                process.stdout.write("POOL_END_DONE\\\\n");
                resolve();
              }
            }, 10);
          });
        }
      }
    };
  }

  return originalLoad.call(this, request, parent, isMain);
};

require(serverPath);
process.on("beforeExit", () => {
  process.stdout.write("PROCESS_BEFORE_EXIT\\n");
});

setTimeout(() => {
  process.stdout.write(
    "ACTIVE_HANDLES " +
    JSON.stringify(process.getActiveResourcesInfo()) +
    "\\n"
  );
}, 1500);
`;

const children = new Set();

afterEach(async () => {
  const remainingChildren = [...children];

  for (const child of remainingChildren) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGKILL");
    }
  }

  await Promise.all(
    remainingChildren.map((child) =>
      waitForExit(child, 1_000).catch(() => {
        // Le processus a déjà été forcé à s'arrêter.
      })
    )
  );

  children.clear();
});

function startServer(extraEnv = {}) {
  const child = spawn(process.execPath, ["-e", childScript], {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      PORT: "0",
      ...extraEnv
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  const output = { stdout: "", stderr: "" };

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");

  child.stdout.on("data", (chunk) => {
    output.stdout += chunk;
  });

  child.stderr.on("data", (chunk) => {
    output.stderr += chunk;
  });

  children.add(child);

  child.once("exit", () => {
    children.delete(child);
  });

  return { child, output };
}

function waitForOutput(child, output, expectedText, timeoutMs = 5_000) {
  if (output.stdout.includes(expectedText)) {
    return Promise.resolve();
  }

  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.reject(
      new Error(
        `Server exited before "${expectedText}" ` +
        `(code=${child.exitCode}, signal=${child.signalCode})`
      )
    );
  }

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      child.stdout.off("data", checkOutput);
      child.off("exit", checkExit);
    };

    const checkOutput = () => {
      if (output.stdout.includes(expectedText)) {
        cleanup();
        resolve();
      }
    };

    const checkExit = (code, signal) => {
      cleanup();
      reject(
        new Error(
          `Server exited before "${expectedText}" ` +
          `(code=${code}, signal=${signal})`
        )
      );
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for "${expectedText}"`));
    }, timeoutMs);

    child.stdout.on("data", checkOutput);
    child.once("exit", checkExit);

    checkOutput();
  });
}

function waitForExit(child, timeoutMs = 5_000, output) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve(child.exitCode);
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(
        new Error(
        `Server did not exit within ${timeoutMs} ms\n` +
        `STDOUT:\n${output?.stdout || "(empty)"}\n` +
        `STDERR:\n${output?.stderr || "(empty)"}`
        )
      );
    }, timeoutMs);

    child.once("exit", (code) => {
      clearTimeout(timer);
      resolve(code);
    });
  });
}

function request(port) {
  return new Promise((resolve, reject) => {
    http.get(
      {
        host: "127.0.0.1",
        port,
        path: "/slow",
        headers: { Connection: "close" }
      },
      (response) => {
        let body = "";

        response.setEncoding("utf8");

        response.on("data", (chunk) => {
          body += chunk;
        });

        response.on("end", () => {
          resolve({
            statusCode: response.statusCode,
            body
          });
        });
      }
    ).on("error", reject);
  });
}

function listeningPort(output) {
  const match = output.stdout.match(/READY (\d+)/);

  assert.ok(
    match,
    `Missing ready message: ${output.stdout} ${output.stderr}`
  );

  return Number(match[1]);
}

function occurrences(text, value) {
  return text.split(value).length - 1;
}

function eventPosition(output, event) {
  const position = output.indexOf(event);

  assert.notEqual(
    position,
    -1,
    `Expected event "${event}" was not found in output:\\n${output}`
  );

  return position;
}

function assertEventOrder(output, events) {
  const positions = events.map((event) => eventPosition(output, event));

  for (let index = 1; index < positions.length; index += 1) {
    assert.ok(
      positions[index - 1] < positions[index],
      `Expected "${events[index - 1]}" before "${events[index]}":\\n${output}`
    );
  }
}

test(
  "SIGTERM drains active requests before closing the pool and repeated signals close once",
  async () => {
    const { child, output } = startServer({
      REQUEST_DELAY_MS: "150"
    });

    await waitForOutput(child, output, "READY ");

    const responsePromise = request(listeningPort(output));

    await waitForOutput(child, output, "REQUEST_STARTED");

    child.kill("SIGTERM");

    await waitForOutput(child, output, "Received SIGTERM");

    const lateRequest = request(listeningPort(output)).catch(
      (error) => error
    );

    child.kill("SIGINT");

    const response = await responsePromise;
    const lateRequestResult = await lateRequest;

    assert.ok(lateRequestResult instanceof Error);

    assert.deepEqual(response, {
      statusCode: 200,
      body: "completed"
    });

    assert.equal(await waitForExit(child), 0, output.stderr);

    assertEventOrder(output.stdout, [
      "REQUEST_STARTED",
      "REQUEST_FINISHED",
      "HTTP_SERVER_CLOSED",
      "POOL_END_START",
      "POOL_END_DONE"
    ]);

    assert.equal(
      occurrences(output.stdout, "POOL_END_START"),
      1,
      output.stdout
    );

    assert.equal(
      occurrences(output.stdout, "POOL_END_DONE"),
      1,
      output.stdout
    );

    assert.match(output.stdout, /OpsDesk API listening/);
  }
);

test(
  "SIGINT reports pool close errors and exits unsuccessfully",
  async () => {
    const { child, output } = startServer({
      POOL_END_FAIL: "1"
    });

    await waitForOutput(child, output, "READY ");

    child.kill("SIGINT");

    assert.equal(await waitForExit(child), 1, output.stderr);

    assertEventOrder(output.stdout, [
      "HTTP_SERVER_CLOSED",
      "POOL_END_START"
    ]);

    assert.equal(
      occurrences(output.stdout, "POOL_END_START"),
      1,
      output.stdout
    );

    assert.match(
      output.stderr,
      /Failed to close PostgreSQL pool/
    );
  }
);

test(
  "shutdown timeout force-closes active HTTP connections and does not hang",
  async () => {
    const { child, output } = startServer({
      REQUEST_DELAY_MS: "5000",
      SHORT_SHUTDOWN_TIMEOUT: "1"
    });

    await waitForOutput(child, output, "READY ");

    const responsePromise = request(listeningPort(output)).catch(
      (error) => error
    );

    await waitForOutput(child, output, "REQUEST_STARTED");

    child.kill("SIGTERM");

    const [exitCode, responseResult] = await Promise.all([
      waitForExit(child, 3_000, output),
      responsePromise
    ]);

    assert.equal(exitCode, 1, output.stderr);
    assert.ok(responseResult instanceof Error);

    eventPosition(output.stdout, "HTTP_FORCE_CLOSE");

    assert.equal(
      occurrences(output.stdout, "REQUEST_FINISHED"),
      0,
      output.stdout
    );

    assertEventOrder(output.stdout, [
      "HTTP_FORCE_CLOSE",
      "POOL_END_START",
      "POOL_END_DONE"
    ]);

    assert.equal(
      occurrences(output.stdout, "HTTP_FORCE_CLOSE"),
      1,
      output.stdout
    );

    assert.equal(
      occurrences(output.stdout, "POOL_END_START"),
      1,
      output.stdout
    );

    assert.equal(
      occurrences(output.stdout, "POOL_END_DONE"),
      1,
      output.stdout
    );

    assert.match(output.stderr, /forcing shutdown/);
  }
);
