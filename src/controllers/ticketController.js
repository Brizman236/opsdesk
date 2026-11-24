const ticketService = require("../services/ticketService");
const { ValidationError } = require("../middlewares/errorHandler");

const ticketFields = {
  name: { min: 2, max: 100 },
  email: { min: 3, max: 254 },
  subject: { min: 5, max: 150 },
  description: { min: 10, max: 5000 }
};

const emailPattern = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+$/i;

function characterLength(value) {
  // Match PostgreSQL char_length for Unicode code points rather than UTF-16 code units.
  return Array.from(value).length;
}

function validateTicketPayload(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("The request body must be a JSON object.", [
      { field: "body", message: "Must be a JSON object." }
    ]);
  }

  const errors = [];
  const allowedFields = Object.keys(ticketFields);
  if (Object.keys(body).some((field) => !allowedFields.includes(field))) {
    errors.push({ field: "body", message: "Unknown properties are not allowed." });
  }

  const ticket = {};
  for (const [field, { min, max }] of Object.entries(ticketFields)) {
    const value = body[field];
    if (typeof value !== "string") {
      errors.push({ field, message: "This field is required and must be a string." });
      continue;
    }

    const normalized = value.trim();
    const length = characterLength(normalized);
    if (length === 0) {
      errors.push({ field, message: "Must not be empty or contain only whitespace." });
      continue;
    }
    if (length < min || length > max) {
      errors.push({ field, message: `Must contain between ${min} and ${max} characters.` });
      continue;
    }
    if (field === "email" && !emailPattern.test(normalized)) {
      errors.push({ field, message: "Must be a valid email address." });
      continue;
    }

    ticket[field] = normalized;
  }

  if (errors.length > 0) {
    throw new ValidationError("The request body does not match the ticket contract.", errors);
  }

  return ticket;
}

async function createTicket(req, res) {
  const ticketInput = validateTicketPayload(req.body);
  const ticket = await ticketService.createTicket(ticketInput);

  res.status(201).json({
    data: {
      id: ticket.id,
      name: ticket.name,
      email: ticket.email,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      created_at: ticket.createdAt
    }
  });
}

module.exports = { createTicket };
