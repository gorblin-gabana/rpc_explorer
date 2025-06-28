CREATE TABLE "token_holders_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"mint_address" text NOT NULL,
	"limit" integer NOT NULL,
	"holders" jsonb NOT NULL,
	"total" text NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"cache_key" text NOT NULL
);
--> statement-breakpoint
DROP INDEX "token_holders_limit_idx";--> statement-breakpoint
DROP INDEX "token_holders_cache_key_idx";--> statement-breakpoint
ALTER TABLE "token_holders" ALTER COLUMN "owner_address" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "token_holders" ALTER COLUMN "amount" DROP DEFAULT;--> statement-breakpoint
CREATE INDEX "token_holders_cache_mint_address_idx" ON "token_holders_cache" USING btree ("mint_address");--> statement-breakpoint
CREATE INDEX "token_holders_cache_limit_idx" ON "token_holders_cache" USING btree ("limit");--> statement-breakpoint
CREATE INDEX "token_holders_cache_last_updated_idx" ON "token_holders_cache" USING btree ("last_updated");--> statement-breakpoint
CREATE INDEX "token_holders_cache_cache_key_idx" ON "token_holders_cache" USING btree ("cache_key");--> statement-breakpoint
CREATE INDEX "token_holders_owner_address_idx" ON "token_holders" USING btree ("owner_address");--> statement-breakpoint
ALTER TABLE "token_holders" DROP COLUMN "limit";--> statement-breakpoint
ALTER TABLE "token_holders" DROP COLUMN "holders";--> statement-breakpoint
ALTER TABLE "token_holders" DROP COLUMN "total";--> statement-breakpoint
ALTER TABLE "token_holders" DROP COLUMN "cache_key";