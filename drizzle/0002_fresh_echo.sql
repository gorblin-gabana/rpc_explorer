CREATE TABLE "daily_analytics" (
	"date" text PRIMARY KEY NOT NULL,
	"total_transactions" bigint DEFAULT 0 NOT NULL,
	"successful_transactions" bigint DEFAULT 0 NOT NULL,
	"failed_transactions" bigint DEFAULT 0 NOT NULL,
	"active_wallets" bigint DEFAULT 0 NOT NULL,
	"new_wallets" bigint DEFAULT 0 NOT NULL,
	"token_volume" numeric(20, 0) DEFAULT '0' NOT NULL,
	"average_tps" numeric(10, 2) DEFAULT '0' NOT NULL,
	"top_programs" jsonb DEFAULT '[]' NOT NULL,
	"network_health" jsonb DEFAULT '{}' NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dex_analytics" (
	"dex_program" text NOT NULL,
	"token_a" text NOT NULL,
	"token_b" text NOT NULL,
	"date" text NOT NULL,
	"volume" numeric(20, 0) DEFAULT '0' NOT NULL,
	"trades" bigint DEFAULT 0 NOT NULL,
	"unique_traders" bigint DEFAULT 0 NOT NULL,
	"avg_trade_size" numeric(20, 2) DEFAULT '0' NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dex_analytics_dex_program_token_a_token_b_date_pk" PRIMARY KEY("dex_program","token_a","token_b","date")
);
--> statement-breakpoint
CREATE TABLE "hourly_analytics" (
	"datetime" text PRIMARY KEY NOT NULL,
	"total_transactions" bigint DEFAULT 0 NOT NULL,
	"successful_transactions" bigint DEFAULT 0 NOT NULL,
	"failed_transactions" bigint DEFAULT 0 NOT NULL,
	"active_wallets" bigint DEFAULT 0 NOT NULL,
	"average_tps" numeric(10, 2) DEFAULT '0' NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "network_metrics" (
	"timestamp" timestamp PRIMARY KEY NOT NULL,
	"slot" bigint NOT NULL,
	"epoch" bigint NOT NULL,
	"tps" numeric(10, 2) DEFAULT '0' NOT NULL,
	"block_time" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_supply" bigint DEFAULT 0 NOT NULL,
	"circulating_supply" bigint DEFAULT 0 NOT NULL,
	"validator_count" integer DEFAULT 0 NOT NULL,
	"stake_amount" bigint DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_analytics" (
	"program_id" text NOT NULL,
	"date" text NOT NULL,
	"transactions" bigint DEFAULT 0 NOT NULL,
	"successful_transactions" bigint DEFAULT 0 NOT NULL,
	"failed_transactions" bigint DEFAULT 0 NOT NULL,
	"unique_users" bigint DEFAULT 0 NOT NULL,
	"gas_used" bigint DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "program_analytics_program_id_date_pk" PRIMARY KEY("program_id","date")
);
--> statement-breakpoint
CREATE TABLE "token_analytics" (
	"mint_address" text NOT NULL,
	"date" text NOT NULL,
	"volume" numeric(20, 0) DEFAULT '0' NOT NULL,
	"transactions" bigint DEFAULT 0 NOT NULL,
	"unique_holders" bigint DEFAULT 0 NOT NULL,
	"supply" numeric(20, 0) DEFAULT '0' NOT NULL,
	"decimals" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "token_analytics_mint_address_date_pk" PRIMARY KEY("mint_address","date")
);
--> statement-breakpoint
CREATE INDEX "daily_analytics_date_idx" ON "daily_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "daily_analytics_last_updated_idx" ON "daily_analytics" USING btree ("last_updated");--> statement-breakpoint
CREATE INDEX "dex_analytics_dex_idx" ON "dex_analytics" USING btree ("dex_program");--> statement-breakpoint
CREATE INDEX "dex_analytics_date_idx" ON "dex_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "dex_analytics_volume_idx" ON "dex_analytics" USING btree ("volume");--> statement-breakpoint
CREATE INDEX "dex_analytics_token_a_idx" ON "dex_analytics" USING btree ("token_a");--> statement-breakpoint
CREATE INDEX "dex_analytics_token_b_idx" ON "dex_analytics" USING btree ("token_b");--> statement-breakpoint
CREATE INDEX "hourly_analytics_datetime_idx" ON "hourly_analytics" USING btree ("datetime");--> statement-breakpoint
CREATE INDEX "hourly_analytics_last_updated_idx" ON "hourly_analytics" USING btree ("last_updated");--> statement-breakpoint
CREATE INDEX "network_metrics_timestamp_idx" ON "network_metrics" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "network_metrics_slot_idx" ON "network_metrics" USING btree ("slot");--> statement-breakpoint
CREATE INDEX "network_metrics_epoch_idx" ON "network_metrics" USING btree ("epoch");--> statement-breakpoint
CREATE INDEX "program_analytics_program_idx" ON "program_analytics" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "program_analytics_date_idx" ON "program_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "program_analytics_transactions_idx" ON "program_analytics" USING btree ("transactions");--> statement-breakpoint
CREATE INDEX "token_analytics_mint_idx" ON "token_analytics" USING btree ("mint_address");--> statement-breakpoint
CREATE INDEX "token_analytics_date_idx" ON "token_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "token_analytics_volume_idx" ON "token_analytics" USING btree ("volume");