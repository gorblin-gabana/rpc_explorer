import { pgTable, text, jsonb, timestamp, index, boolean } from 'drizzle-orm/pg-core';

export const validators = pgTable('validators', {
  pubkey: text('pubkey').primaryKey(),
  nodePubkey: text('node_pubkey'),
  activatedStake: text('activated_stake'),
  commission: text('commission'),
  epochVoteAccount: boolean('epoch_vote_account'),
  epochCredits: jsonb('epoch_credits'),
  data: jsonb('data'),
  lastVote: jsonb('last_vote'),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
}, (table) => ({
  pubkeyIdx: index('validators_pubkey_idx').on(table.pubkey),
  nodePubkeyIdx: index('validators_node_pubkey_idx').on(table.nodePubkey),
}));

export type Validator = typeof validators.$inferSelect;
export type NewValidator = typeof validators.$inferInsert;
