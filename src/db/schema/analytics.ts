import {
  pgTable,
  text,
  jsonb,
  timestamp,
  index,
  bigint,
  integer,
  decimal,
  primaryKey,
} from "drizzle-orm/pg-core";

// Daily analytics aggregations for better performance
export const dailyAnalytics = pgTable(
  "daily_analytics",
  {
    date: text("date").primaryKey(), // YYYY-MM-DD format
    totalTransactions: bigint("total_transactions", { mode: "number" })
      .notNull()
      .default(0),
    successfulTransactions: bigint("successful_transactions", {
      mode: "number",
    })
      .notNull()
      .default(0),
    failedTransactions: bigint("failed_transactions", { mode: "number" })
      .notNull()
      .default(0),
    activeWallets: bigint("active_wallets", { mode: "number" })
      .notNull()
      .default(0),
    newWallets: bigint("new_wallets", { mode: "number" }).notNull().default(0),
    tokenVolume: decimal("token_volume", { precision: 20, scale: 0 })
      .notNull()
      .default("0"),
    averageTPS: decimal("average_tps", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    topPrograms: jsonb("top_programs").notNull().default("[]"), // Array of {programId, txCount}
    networkHealth: jsonb("network_health").notNull().default("{}"), // {successRate, avgBlockTime, etc}
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  },
  (table) => ({
    dateIdx: index("daily_analytics_date_idx").on(table.date),
    lastUpdatedIdx: index("daily_analytics_last_updated_idx").on(
      table.lastUpdated
    ),
  })
);

// Hourly analytics for more granular data
export const hourlyAnalytics = pgTable(
  "hourly_analytics",
  {
    datetime: text("datetime").primaryKey(), // YYYY-MM-DD HH:00:00 format
    totalTransactions: bigint("total_transactions", { mode: "number" })
      .notNull()
      .default(0),
    successfulTransactions: bigint("successful_transactions", {
      mode: "number",
    })
      .notNull()
      .default(0),
    failedTransactions: bigint("failed_transactions", { mode: "number" })
      .notNull()
      .default(0),
    activeWallets: bigint("active_wallets", { mode: "number" })
      .notNull()
      .default(0),
    averageTPS: decimal("average_tps", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  },
  (table) => ({
    datetimeIdx: index("hourly_analytics_datetime_idx").on(table.datetime),
    lastUpdatedIdx: index("hourly_analytics_last_updated_idx").on(
      table.lastUpdated
    ),
  })
);

// Token analytics for tracking token-specific metrics
export const tokenAnalytics = pgTable(
  "token_analytics",
  {
    mintAddress: text("mint_address").notNull(),
    date: text("date").notNull(), // YYYY-MM-DD format
    volume: decimal("volume", { precision: 20, scale: 0 })
      .notNull()
      .default("0"),
    transactions: bigint("transactions", { mode: "number" })
      .notNull()
      .default(0),
    uniqueHolders: bigint("unique_holders", { mode: "number" })
      .notNull()
      .default(0),
    supply: decimal("supply", { precision: 20, scale: 0 })
      .notNull()
      .default("0"),
    decimals: integer("decimals").notNull().default(0),
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.mintAddress, table.date] }),
    mintIdx: index("token_analytics_mint_idx").on(table.mintAddress),
    dateIdx: index("token_analytics_date_idx").on(table.date),
    volumeIdx: index("token_analytics_volume_idx").on(table.volume),
  })
);

// Program analytics for tracking program activity
export const programAnalytics = pgTable(
  "program_analytics",
  {
    programId: text("program_id").notNull(),
    date: text("date").notNull(), // YYYY-MM-DD format
    transactions: bigint("transactions", { mode: "number" })
      .notNull()
      .default(0),
    successfulTransactions: bigint("successful_transactions", {
      mode: "number",
    })
      .notNull()
      .default(0),
    failedTransactions: bigint("failed_transactions", { mode: "number" })
      .notNull()
      .default(0),
    uniqueUsers: bigint("unique_users", { mode: "number" })
      .notNull()
      .default(0),
    gasUsed: bigint("gas_used", { mode: "number" }).notNull().default(0),
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.programId, table.date] }),
    programIdx: index("program_analytics_program_idx").on(table.programId),
    dateIdx: index("program_analytics_date_idx").on(table.date),
    transactionsIdx: index("program_analytics_transactions_idx").on(
      table.transactions
    ),
  })
);

// Network metrics for tracking overall network health
export const networkMetrics = pgTable(
  "network_metrics",
  {
    timestamp: timestamp("timestamp").primaryKey(),
    slot: bigint("slot", { mode: "number" }).notNull(),
    epoch: bigint("epoch", { mode: "number" }).notNull(),
    tps: decimal("tps", { precision: 10, scale: 2 }).notNull().default("0"),
    blockTime: decimal("block_time", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    totalSupply: bigint("total_supply", { mode: "number" })
      .notNull()
      .default(0),
    circulatingSupply: bigint("circulating_supply", { mode: "number" })
      .notNull()
      .default(0),
    validatorCount: integer("validator_count").notNull().default(0),
    stakeAmount: bigint("stake_amount", { mode: "number" })
      .notNull()
      .default(0),
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  },
  (table) => ({
    timestampIdx: index("network_metrics_timestamp_idx").on(table.timestamp),
    slotIdx: index("network_metrics_slot_idx").on(table.slot),
    epochIdx: index("network_metrics_epoch_idx").on(table.epoch),
  })
);

// DEX analytics for tracking DEX activity (if applicable)
export const dexAnalytics = pgTable(
  "dex_analytics",
  {
    dexProgram: text("dex_program").notNull(),
    tokenA: text("token_a").notNull(),
    tokenB: text("token_b").notNull(),
    date: text("date").notNull(), // YYYY-MM-DD format
    volume: decimal("volume", { precision: 20, scale: 0 })
      .notNull()
      .default("0"),
    trades: bigint("trades", { mode: "number" }).notNull().default(0),
    uniqueTraders: bigint("unique_traders", { mode: "number" })
      .notNull()
      .default(0),
    avgTradeSize: decimal("avg_trade_size", { precision: 20, scale: 2 })
      .notNull()
      .default("0"),
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.dexProgram, table.tokenA, table.tokenB, table.date],
    }),
    dexIdx: index("dex_analytics_dex_idx").on(table.dexProgram),
    dateIdx: index("dex_analytics_date_idx").on(table.date),
    volumeIdx: index("dex_analytics_volume_idx").on(table.volume),
    tokenAIdx: index("dex_analytics_token_a_idx").on(table.tokenA),
    tokenBIdx: index("dex_analytics_token_b_idx").on(table.tokenB),
  })
);

export type DailyAnalytics = typeof dailyAnalytics.$inferSelect;
export type NewDailyAnalytics = typeof dailyAnalytics.$inferInsert;

export type HourlyAnalytics = typeof hourlyAnalytics.$inferSelect;
export type NewHourlyAnalytics = typeof hourlyAnalytics.$inferInsert;

export type TokenAnalytics = typeof tokenAnalytics.$inferSelect;
export type NewTokenAnalytics = typeof tokenAnalytics.$inferInsert;

export type ProgramAnalytics = typeof programAnalytics.$inferSelect;
export type NewProgramAnalytics = typeof programAnalytics.$inferInsert;

export type NetworkMetrics = typeof networkMetrics.$inferSelect;
export type NewNetworkMetrics = typeof networkMetrics.$inferInsert;

export type DexAnalytics = typeof dexAnalytics.$inferSelect;
export type NewDexAnalytics = typeof dexAnalytics.$inferInsert;
