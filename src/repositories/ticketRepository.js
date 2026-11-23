const { db } = require("../db");
const { tickets } = require("../db/schema");

// Keep Drizzle persistence details out of the service and HTTP layers.
async function create(ticketInput) {
  const [ticket] = await db.insert(tickets).values(ticketInput).returning();
  return ticket;
}

module.exports = { create };
