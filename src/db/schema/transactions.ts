import { pgTable, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';

export const transactions = pgTable('transactions', {
  signature: text('signature').primaryKey(),
  data: jsonb('data').notNull(),
  slot: text('slot').notNull(),
  blockTime: timestamp('block_time'),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
}, (table) => ({
  signatureIdx: index('transactions_signature_idx').on(table.signature),
  slotIdx: index('transactions_slot_idx').on(table.slot),
}));

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
