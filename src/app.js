
const express = require("express");
const ticketRoutes = require("./routes/ticketRoutes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.disable("x-powered-by");

// Parse every valid JSON value so non-object payloads receive a contract error (422), not a parse error (400).
app.use(express.json({ strict: false }));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "opsdesk-api"
  });
});

app.use("/api/tickets", ticketRoutes);

// Keep parser, controller, and persistence failures on one safe HTTP error path.
app.use(errorHandler);

module.exports = app;
