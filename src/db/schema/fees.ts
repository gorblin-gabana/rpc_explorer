import { pgTable, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';

export const fees = pgTable('fees', {
  id: text('id').primaryKey(),
  slot: text('slot').notNull(),
  data: jsonb('data').notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
}, (table) => ({
  slotIdx: index('fees_slot_idx').on(table.slot),
  lastUpdatedIdx: index('fees_last_updated_idx').on(table.lastUpdated),
}));

export type Fee = typeof fees.$inferSelect;
export type NewFee = typeof fees.$inferInsert;
