const { sql } = require("drizzle-orm");
const {
  check,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} = require("drizzle-orm/pg-core");

// This JavaScript schema is the source Drizzle Kit reads when generating versioned SQL migrations.
const tickets = pgTable("tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 254 }).notNull(),
  subject: varchar("subject", { length: 150 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).default("open").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
}, (table) => [
  check(
    "tickets_name_length_check",
    sql`char_length(${table.name}) BETWEEN 2 AND 100 AND btrim(${table.name}) <> ''`
  ),
  check(
    "tickets_email_length_check",
    sql`char_length(${table.email}) BETWEEN 3 AND 254 AND btrim(${table.email}) <> ''`
  ),
  check(
    "tickets_subject_length_check",
    sql`char_length(${table.subject}) BETWEEN 5 AND 150 AND btrim(${table.subject}) <> ''`
  ),
  check(
    "tickets_description_length_check",
    sql`char_length(${table.description}) BETWEEN 10 AND 5000 AND btrim(${table.description}) <> ''`
  ),
  check(
    "tickets_status_check",
    sql`${table.status} IN ('open', 'in_progress', 'closed')`
  )
]);

module.exports = { tickets };
