const assert = require("node:assert/strict");
const { once } = require("node:events");
const { randomUUID } = require("node:crypto");
const { test } = require("node:test");

process.env.NODE_ENV = "test";

const app = require("../src/app");
const { pool } = require("../src/db");

test("POST /api/tickets stores a ticket in PostgreSQL", async () => {
  const ticketInput = {
    name: "Integration Test",
    email: `opsdesk-${randomUUID()}@example.test`,
    subject: "Integration test ticket",
    description: "This ticket verifies the complete HTTP-to-PostgreSQL path."
  };
  const server = app.listen(0, "127.0.0.1");

  try {
    await once(server, "listening");
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/tickets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(ticketInput)
    });
    const responseBody = await response.json();
    const ticket = responseBody.data;

    assert.equal(response.status, 201);
    assert.deepEqual(
      {
        name: ticket.name,
        email: ticket.email,
        subject: ticket.subject,
        description: ticket.description
      },
      ticketInput
    );
    assert.equal(typeof ticket.id, "string");
    assert.ok(ticket.id.length > 0);
    assert.equal(ticket.status, "open");
    assert.equal(typeof ticket.created_at, "string");
    assert.ok(Number.isFinite(Date.parse(ticket.created_at)));

    const result = await pool.query(
      `SELECT id::text, name, email, subject, description, status, created_at
       FROM tickets
       WHERE id = $1`,
      [ticket.id]
    );

    assert.equal(result.rowCount, 1);
    assert.deepEqual(
      {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email,
        subject: result.rows[0].subject,
        description: result.rows[0].description,
        status: result.rows[0].status
      },
      {
        id: ticket.id,
        name: ticketInput.name,
        email: ticketInput.email,
        subject: ticketInput.subject,
        description: ticketInput.description,
        status: ticket.status
      }
    );
    assert.ok(result.rows[0].created_at instanceof Date);
  } finally {
    try {
      await pool.query("DELETE FROM tickets WHERE email = $1", [ticketInput.email]);
    } finally {
      try {
        if (server.listening) {
          await new Promise((resolve, reject) => {
            server.close((error) => {
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            });
          });
        }
      } finally {
        await pool.end();
      }
    }
  }
});
