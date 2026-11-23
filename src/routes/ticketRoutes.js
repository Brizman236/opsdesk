const express = require("express");
const ticketController = require("../controllers/ticketController");

const router = express.Router();

// Route declarations only connect the HTTP method and path to their controller.
router.post("/", ticketController.createTicket);

module.exports = router;
