import { pgTable, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';

export const accounts = pgTable('accounts', {
  address: text('address').primaryKey(),
  data: jsonb('data').notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
}, (table) => ({
  addressIdx: index('accounts_address_idx').on(table.address),
}));

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
