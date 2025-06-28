import { pgTable, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';

export const transactionStatuses = pgTable('transaction_statuses', {
  id: text('id').primaryKey(),
  signature: text('signature').notNull(),
  data: jsonb('data').notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
}, (table) => ({
  signatureIdx: index('transaction_statuses_signature_idx').on(table.signature),
  lastUpdatedIdx: index('transaction_statuses_last_updated_idx').on(table.lastUpdated),
}));

export type TransactionStatus = typeof transactionStatuses.$inferSelect;
export type NewTransactionStatus = typeof transactionStatuses.$inferInsert;
