import { pgTable, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';

export const programAccounts = pgTable('program_accounts', {
  id: text('id').primaryKey(), // Composite key of programId-cacheKey
  programId: text('program_id').notNull(),
  cacheKey: text('cache_key').notNull(),
  data: jsonb('data').notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
}, (table) => ({
  programIdIdx: index('program_accounts_program_id_idx').on(table.programId),
  cacheKeyIdx: index('program_accounts_cache_key_idx').on(table.cacheKey),
  lastUpdatedIdx: index('program_accounts_last_updated_idx').on(table.lastUpdated),
}));

export type ProgramAccount = typeof programAccounts.$inferSelect;
export type NewProgramAccount = typeof programAccounts.$inferInsert;
