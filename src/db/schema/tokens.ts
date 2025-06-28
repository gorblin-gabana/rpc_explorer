import {
  pgTable,
  text,
  jsonb,
  timestamp,
  index,
  numeric,
} from "drizzle-orm/pg-core";

export const tokens = pgTable(
  "tokens",
  {
    mintAddress: text("mint_address").primaryKey(),
    supply: numeric("supply"),
    decimals: numeric("decimals"),
    metadata: jsonb("metadata"),
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  },
  (table) => ({
    mintAddressIdx: index("tokens_mint_address_idx").on(table.mintAddress),
  })
);

export type Token = typeof tokens.$inferSelect;
export type NewToken = typeof tokens.$inferInsert;
