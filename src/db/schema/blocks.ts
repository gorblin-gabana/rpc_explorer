import { pgTable, text, jsonb, timestamp, index, numeric } from 'drizzle-orm/pg-core';

export const blocks = pgTable('blocks', {
  slot: text('slot').primaryKey(),
  parentSlot: text('parent_slot'),
  blockTime: timestamp('block_time'),
  blockHeight: numeric('block_height'),
  data: jsonb('data').notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
}, (table) => ({
  slotIdx: index('blocks_slot_idx').on(table.slot),
  blockTimeIdx: index('blocks_block_time_idx').on(table.blockTime),
}));

export type Block = typeof blocks.$inferSelect;
export type NewBlock = typeof blocks.$inferInsert;
