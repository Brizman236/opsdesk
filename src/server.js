
const app = require("./app");
const { pool } = require("./db");

const PORT = process.env.PORT || 3000;
const SHUTDOWN_TIMEOUT_MS = 30_000;
const FORCE_EXIT_DELAY_MS = 1_000;

let shutdownPromise;
let poolEndPromise;
let shutdownTimer;
let forceExitTimer;
let serverError;

const server = app.listen(PORT, () => {
  console.log(`OpsDesk API listening on port ${PORT}`);
});

function closeHttpServer() {
  function closeListeningServer() {
    return new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  if (server.listening) {
    return closeListeningServer();
  }
  if (serverError) {
    return Promise.reject(serverError);
  }

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      server.off("listening", onListening);
      server.off("error", onError);
    };
    const onListening = () => {
      cleanup();
      closeListeningServer().then(resolve, reject);
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };

    server.once("listening", onListening);
    server.once("error", onError);
  });
}

function closePool() {
  if (!poolEndPromise) {
    poolEndPromise = Promise.resolve()
      .then(() => pool.end())
      .catch((error) => {
        process.exitCode = 1;
        console.error("Failed to close PostgreSQL pool:", error);
      });
  }

  return poolEndPromise;
}

function forceCloseConnections() {
    try {
    server.closeAllConnections();
  } catch (error) {
    process.exitCode = 1;
    console.error("Failed to force-close HTTP connections:", error);
  }
}

function forceShutdownAfterTimeout() {
  console.error(`Graceful shutdown exceeded ${SHUTDOWN_TIMEOUT_MS} ms; forcing shutdown`);
  process.exitCode = 1;
  forceCloseConnections();
  void closePool();

  forceExitTimer = setTimeout(() => {
    console.error("Shutdown did not complete after forced connection closure");
    process.exit(1);
  }, FORCE_EXIT_DELAY_MS);
}

function shutdown(signal) {
  if (shutdownPromise) {
    return shutdownPromise;
  }

  console.log(`Received ${signal}; shutting down gracefully`);
  if (process.exitCode === undefined) {
    process.exitCode = 0;
  }

  shutdownTimer = setTimeout(forceShutdownAfterTimeout, SHUTDOWN_TIMEOUT_MS);
  shutdownPromise = (async () => {
    try {
      await closeHttpServer();
    } catch (error) {
      process.exitCode = 1;
      console.error("Failed to close HTTP server:", error);
      forceCloseConnections();
    }

    await closePool();
  })().catch((error) => {
    process.exitCode = 1;
    console.error("Unexpected error during shutdown:", error);
    forceCloseConnections();
    return closePool();
  }).finally(() => {
    clearTimeout(shutdownTimer);
    clearTimeout(forceExitTimer);
  });

  return shutdownPromise;
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

server.on("error", (error) => {
  serverError = error;
  process.exitCode = 1;
  console.error("HTTP server error:", error);
  void shutdown("HTTP server error");
});
