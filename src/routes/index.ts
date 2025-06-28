import { Router, Request, Response, NextFunction } from "express";
import healthRoutes from "./health.routes";
import balanceRoutes from "./balance.routes";
import blockRoutes from "./block.routes";
import tokenRoutes from "./tokens.routes";
import accountRoutes from "./account.routes";
import programRoutes from "./program.routes";
import slotRoutes from "./slot.routes";
import validatorsRoutes from "./validators.routes";
import feesRoutes from "./fees.routes";
import transactionRoutes from "./transaction.routes";
import transactionStatusRoutes from "./transactionStatus.routes";
import tokenSupplyRoutes from "./tokenSupply.routes";
import tokenHoldersRoutes from "./tokenHolders.routes";
import analyticsRoutes from "./analytics.routes";
import { RequestHandler } from "express-serve-static-core";

/**
 * @swagger
 * tags:
 *   - name: Health
 *     description: Health check endpoints
 *   - name: Balances
 *     description: Account balance endpoints
 *   - name: Blocks
 *     description: Block information endpoints
 *   - name: Tokens
 *     description: Token-related endpoints
 *   - name: Accounts
 *     description: Account information endpoints
 *   - name: Programs
 *     description: Program account endpoints
 *   - name: Slots
 *     description: Slot information endpoints
 *   - name: Validators
 *     description: Validator information endpoints
 *   - name: Fees
 *     description: Fee calculation endpoints
 *   - name: Transactions
 *     description: Transaction-related endpoints
 *   - name: Token Supply
 *     description: Token supply information endpoints
 *   - name: Token Holders
 *     description: Token holder information endpoints
 *   - name: Analytics
 *     description: Blockchain analytics and metrics endpoints
 */

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
router.use("/health", healthRoutes);

// Balance routes
router.use("/balance", balanceRoutes);

// Block routes
router.use("/block", blockRoutes);

// Token routes
router.use("/tokens", tokenRoutes);

// Account routes
router.use("/account", accountRoutes);

// Program routes
router.use("/program", programRoutes);

// Slot routes
router.use("/slot", slotRoutes);

// Validators routes
router.use("/validators", validatorsRoutes);

// Fees routes
router.use("/fees", feesRoutes);

// Block by slot routes

// Transaction routes
router.use("/tx", transactionRoutes);

// Transaction status routes
router.use("/tx", transactionStatusRoutes);

// Token supply routes
router.use("/token", tokenSupplyRoutes);

// Token holders routes
router.use("/token", tokenHoldersRoutes);

// Analytics routes
router.use("/analytics", analyticsRoutes);

// 404 handler
router.use((_req: Request, res: Response) => {
  res.status(404).json({ status: "error", message: "Not found" });
});

// Global error handler
router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Global error handler:", err);
  res.status(500).json({
    status: "error",
    message: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

export default router;
