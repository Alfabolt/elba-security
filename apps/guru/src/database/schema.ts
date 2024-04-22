import { uuid, text, timestamp, pgTable } from 'drizzle-orm/pg-core';
import { type InferSelectModel } from 'drizzle-orm';

export const Organisation = pgTable('organisations', {
  id: uuid('id').primaryKey(),
  region: text('region').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  email: text('email').notNull(),
  token: text('token').notNull(),
});

export type SelectOrganisation = InferSelectModel<typeof Organisation>;
