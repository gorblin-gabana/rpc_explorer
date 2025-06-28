import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';

export const slots = pgTable('slots', {
  id: text('id').primaryKey(),
  slot: text('slot').notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
}, (table) => ({
  slotIdx: index('slots_slot_idx').on(table.slot),
  lastUpdatedIdx: index('slots_last_updated_idx').on(table.lastUpdated),
}));

export type Slot = typeof slots.$inferSelect;
export type NewSlot = typeof slots.$inferInsert;
