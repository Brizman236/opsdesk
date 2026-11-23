const ticketRepository = require("../repositories/ticketRepository");

async function createTicket(ticketInput) {
  // The service owns the creation use case; PostgreSQL supplies status and creation-time defaults.
  return ticketRepository.create(ticketInput);
}

module.exports = { createTicket };
