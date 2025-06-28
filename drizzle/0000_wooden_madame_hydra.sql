CREATE TABLE "accounts" (
	"address" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocks" (
	"slot" text PRIMARY KEY NOT NULL,
	"parent_slot" text,
	"block_time" timestamp,
	"block_height" numeric,
	"data" jsonb NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fees" (
	"id" text PRIMARY KEY NOT NULL,
	"slot" text NOT NULL,
	"data" jsonb NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"mint_address" text PRIMARY KEY NOT NULL,
	"supply" numeric,
	"decimals" numeric,
	"metadata" jsonb,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_holders" (
	"id" text PRIMARY KEY NOT NULL,
	"mint_address" text NOT NULL,
	"owner_address" text DEFAULT '' NOT NULL,
	"amount" text DEFAULT '0' NOT NULL,
	"limit" integer NOT NULL,
	"holders" jsonb NOT NULL,
	"total" text NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"cache_key" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"signature" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"slot" text NOT NULL,
	"block_time" timestamp,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "validators" (
	"pubkey" text PRIMARY KEY NOT NULL,
	"node_pubkey" text,
	"activated_stake" text,
	"commission" text,
	"epoch_vote_account" boolean,
	"epoch_credits" jsonb,
	"data" jsonb,
	"last_vote" jsonb,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"program_id" text NOT NULL,
	"cache_key" text NOT NULL,
	"data" jsonb NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slots" (
	"id" text PRIMARY KEY NOT NULL,
	"slot" text NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_statuses" (
	"id" text PRIMARY KEY NOT NULL,
	"signature" text NOT NULL,
	"data" jsonb NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "accounts_address_idx" ON "accounts" USING btree ("address");--> statement-breakpoint
CREATE INDEX "blocks_slot_idx" ON "blocks" USING btree ("slot");--> statement-breakpoint
CREATE INDEX "blocks_block_time_idx" ON "blocks" USING btree ("block_time");--> statement-breakpoint
CREATE INDEX "fees_slot_idx" ON "fees" USING btree ("slot");--> statement-breakpoint
CREATE INDEX "fees_last_updated_idx" ON "fees" USING btree ("last_updated");--> statement-breakpoint
CREATE INDEX "tokens_mint_address_idx" ON "tokens" USING btree ("mint_address");--> statement-breakpoint
CREATE INDEX "token_holders_mint_address_idx" ON "token_holders" USING btree ("mint_address");--> statement-breakpoint
CREATE INDEX "token_holders_limit_idx" ON "token_holders" USING btree ("limit");--> statement-breakpoint
CREATE INDEX "token_holders_last_updated_idx" ON "token_holders" USING btree ("last_updated");--> statement-breakpoint
CREATE INDEX "token_holders_cache_key_idx" ON "token_holders" USING btree ("cache_key");--> statement-breakpoint
CREATE INDEX "transactions_signature_idx" ON "transactions" USING btree ("signature");--> statement-breakpoint
CREATE INDEX "transactions_slot_idx" ON "transactions" USING btree ("slot");--> statement-breakpoint
CREATE INDEX "validators_pubkey_idx" ON "validators" USING btree ("pubkey");--> statement-breakpoint
CREATE INDEX "validators_node_pubkey_idx" ON "validators" USING btree ("node_pubkey");--> statement-breakpoint
CREATE INDEX "program_accounts_program_id_idx" ON "program_accounts" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "program_accounts_cache_key_idx" ON "program_accounts" USING btree ("cache_key");--> statement-breakpoint
CREATE INDEX "program_accounts_last_updated_idx" ON "program_accounts" USING btree ("last_updated");--> statement-breakpoint
CREATE INDEX "slots_slot_idx" ON "slots" USING btree ("slot");--> statement-breakpoint
CREATE INDEX "slots_last_updated_idx" ON "slots" USING btree ("last_updated");--> statement-breakpoint
CREATE INDEX "transaction_statuses_signature_idx" ON "transaction_statuses" USING btree ("signature");--> statement-breakpoint
CREATE INDEX "transaction_statuses_last_updated_idx" ON "transaction_statuses" USING btree ("last_updated");