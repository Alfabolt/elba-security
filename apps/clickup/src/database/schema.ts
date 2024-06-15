import { uuid, text, timestamp, pgTable } from 'drizzle-orm/pg-core';
import { type InferSelectModel } from 'drizzle-orm';

export const Organisation = pgTable('organisation', {
  id: uuid('id').notNull().primaryKey(),
  accessToken: text('access_token').notNull(),
  teamIds: text('team_ids').array().notNull(),
  region: text('region').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type SelectOrganisation = InferSelectModel<typeof Organisation>;
