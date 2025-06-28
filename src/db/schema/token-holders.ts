import {
  pgTable,
  text,
  integer,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export interface TokenHolder {
  address: string;
  amount: string;
  decimals: number;
  owner: string;
  isFrozen: boolean;
}

// Simple token holders table for basic operations
export const tokenHolders = pgTable(
  "token_holders",
  {
    id: text("id").primaryKey(),
    mintAddress: text("mint_address").notNull(),
    ownerAddress: text("owner_address").notNull(),
    amount: text("amount").notNull(),
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  },
  (table) => ({
    mintAddressIdx: index("token_holders_mint_address_idx").on(
      table.mintAddress
    ),
    ownerAddressIdx: index("token_holders_owner_address_idx").on(
      table.ownerAddress
    ),
    lastUpdatedIdx: index("token_holders_last_updated_idx").on(
      table.lastUpdated
    ),
  })
);

// Complex token holders cache for API responses
export const tokenHoldersCache = pgTable(
  "token_holders_cache",
  {
    id: text("id").primaryKey(),
    mintAddress: text("mint_address").notNull(),
    limit: integer("limit").notNull(),
    holders: jsonb("holders").notNull().$type<TokenHolder[]>(),
    total: text("total").notNull(),
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
    cacheKey: text("cache_key").notNull(),
  },
  (table) => ({
    mintAddressIdx: index("token_holders_cache_mint_address_idx").on(
      table.mintAddress
    ),
    limitIdx: index("token_holders_cache_limit_idx").on(table.limit),
    lastUpdatedIdx: index("token_holders_cache_last_updated_idx").on(
      table.lastUpdated
    ),
    cacheKeyIdx: index("token_holders_cache_cache_key_idx").on(table.cacheKey),
  })
);

export type TokenHoldersEntry = typeof tokenHolders.$inferSelect;
export type NewTokenHoldersEntry = typeof tokenHolders.$inferInsert;
export type TokenHoldersCacheEntry = typeof tokenHoldersCache.$inferSelect;
export type NewTokenHoldersCacheEntry = typeof tokenHoldersCache.$inferInsert;
