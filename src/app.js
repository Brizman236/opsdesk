
const express = require("express");

const app = express();

app.disable("x-powered-by");

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "opsdesk-api"
  });
});

module.exports = app;
