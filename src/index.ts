import "dotenv/config";
import express from "express";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { config } from "./config";

const RPC_ENDPOINT = config.HTTPS_RPC;
const WS_ENDPOINT = config.WS_ENDPOINT;
const conn = new Connection(RPC_ENDPOINT, {
  commitment: 'confirmed',
  wsEndpoint: WS_ENDPOINT,
  disableRetryOnRateLimit: false,
});

export const app = express();
app.use(express.json());


function toPubkey(str: string) {
  try { return new PublicKey(str); }
  catch { throw new Error("Invalid public key"); }
}
console.log("Inside main")
// ──────────────────────────────────────────────────────────────
// 1. Node / chain health
// ──────────────────────────────────────────────────────────────
app.get("/health", async (_req, res) => {
  try {
    console.log("Inside the health ")
    // @ts-ignore
    const resp = await conn._rpcRequest("getHealth", []);
    res.json({ ok: resp.result === "ok", raw: resp });
  } catch (e: any) {
    res.status(502).json({ ok: false, error: e.message });
  }
});

// ──────────────────────────────────────────────────────────────
// 2. Latest block summary (slot + blockhash + time)
// ──────────────────────────────────────────────────────────────
app.get("/block/latest", async (_req, res) => {
  try {
    const bh = await conn.getLatestBlockhash("confirmed");
    const slot = await conn.getSlot("confirmed");
    const blockTime = await conn.getBlockTime(slot);
    res.json({ slot, hash: bh.blockhash, blockTime });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ──────────────────────────────────────────────────────────────
// 3. SOL balance
// ──────────────────────────────────────────────────────────────
app.get("/balance/:pubkey", async (req, res) => {
  try {
    const pubkey = new PublicKey(req.params.pubkey);
    const lamports = await conn.getBalance(pubkey, "confirmed");
    res.json({ lamports, sol: lamports / 1_000_000_000 });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// ──────────────────────────────────────────────────────────────
// 4. Token discovery – list every mint on the chain
// ──────────────────────────────────────────────────────────────
const TOKEN_PROGRAM = new PublicKey(
  "J35jQQ3KKuMwTioVFLnjXdrFrUEc99eTwT2rWZ2EsxcN"
);
const MINT_SIZE = 82; // change to 355 if the chain uses Token-2022

app.get("/tokens/mints", async (_req, res) => {
  try {
    const accts = await conn.getProgramAccounts(TOKEN_PROGRAM, {
      dataSlice: { offset: 0, length: 0 },       // pubkeys only
      filters: [{ dataSize: MINT_SIZE }]
    });
    res.json(accts.map(a => a.pubkey.toBase58()));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ──────────────────────────────────────────────────────────────
// 5. Token holdings of one owner (SPL only)
// ──────────────────────────────────────────────────────────────
app.get("/tokens/:owner/accounts", async (req, res) => {
  try {
    const owner = new PublicKey(req.params.owner);
    const list = await conn.getTokenAccountsByOwner(owner, {
      programId: TOKEN_PROGRAM
    });
    const parsed = list.value.map(({ pubkey, account }) => {
      // account.data = Buffer because we skipped jsonParsed for speed
      const amount = account.data.readBigUInt64LE(64); // amount at byte 64
      const decimals = account.data.readUInt8(44);     // decimals byte
      const mint = new PublicKey(account.data.slice(0, 32)).toBase58();
      return { ata: pubkey.toBase58(), mint, amount: amount.toString(), decimals };
    });
    res.json(parsed);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});


// GET /slot  ─ current slot number
app.get("/slot", async (_req, res) => {
    try { res.json({ slot: await conn.getSlot("confirmed") }); }
    catch (e:any) { res.status(500).json({ error: e.message }); }
  });
  
  // GET /validators  ─ list cluster nodes
  app.get("/validators", async (_req, res) => {
    try { res.json(await conn.getClusterNodes()); }
    catch (e:any) { res.status(500).json({ error: e.message }); }
  });
  
  // GET /fees/latest  ─ recent fee-rate
  app.get("/fees/latest", async (_req, res) => {
    try {
        // @ts-ignore
      const { context, value } = await conn.getFees("confirmed");
      res.json({ slot: context.slot, lamportsPerSignature: value?.feeCalculator?.lamportsPerSignature });
    } catch (e:any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/account/:pubkey/info", async (req, res) => {
    try {
      const pk = toPubkey(req.params.pubkey);
      const info = await conn.getAccountInfo(pk);
      res.json(info);            // { data:[base64,encoding], lamports, ... }
    } catch (e:any) { res.status(400).json({ error: e.message }); }
  });

// ──────────────────────────────────────────────────────────────

// GET /block/:slot
app.get("/block/:slot", async (req, res) => {
    try {
      const slot = Number(req.params.slot);
      const block = await conn.getBlock(slot, { maxSupportedTransactionVersion: 0 });
      res.json(block);
    } catch (e:any) { res.status(400).json({ error: e.message }); }
  });
  
  // GET /tx/:sig
  app.get("/tx/:sig", async (req, res) => {
    try {
      const tx = await conn.getTransaction(req.params.sig, { maxSupportedTransactionVersion: 0 });
      res.json(tx);
    } catch (e:any) { res.status(400).json({ error: e.message }); }
  });
  
  // GET /tx/:sig/status
  app.get("/tx/:sig/status", async (req, res) => {
    try {
      const { value } = await conn.getSignatureStatuses([req.params.sig]);
      res.json(value[0]);                        // null if not found
    } catch (e:any) { res.status(400).json({ error: e.message }); }
  });


app.get("/token/:mint/supply", async (req, res):Promise<any> => {
try {
    const mint = toPubkey(req.params.mint);
    const acc  = await conn.getAccountInfo(mint);
    if (!acc) return res.status(404).json({ error: "Mint not found" });
    // decode mint layout: supply @ 36, decimals @ 44
    const supply   = acc.data.readBigUInt64LE(36).toString();
    const decimals = acc.data.readUInt8(44);
    res.json({ supply, decimals });
} catch (e:any) { res.status(400).json({ error: e.message }); }
});

app.get("/token/:mint/holders", async (req, res) => {
    try {
      const mint  = toPubkey(req.params.mint);
      const limit = Number(req.query.limit ?? 100);
    //   @ts-ignore
      const list  = await conn.getTokenAccountsByMint(mint, { commitment:"confirmed" });
      const holders = list.value.slice(0, limit).map(({ account }:{account:any}) => {
        const data    = account.data;
        const owner   = new PublicKey(data.slice(32, 64)).toBase58();  // owner field
        const amount  = data.readBigUInt64LE(64).toString();
        return { owner, amount };
      });
      res.json(holders);
    } catch (e:any) { res.status(400).json({ error: e.message }); }
  });
  

  app.get("/program/:id/accounts", async (req, res) => {
    try {
      const pid = toPubkey(req.params.id);
      const dataSize = req.query.datasize ? Number(req.query.datasize) : undefined;
      const slice    = req.query.slice ? (req.query.slice as string).split(":").map(Number) : undefined;
      const cfg:any  = {};
      if (dataSize) cfg.filters = [{ dataSize }];
      if (slice)    cfg.dataSlice = { offset:slice[0], length:slice[1] };
      // ⚠ data may be huge – consider pagination or dataSlice
      const accts = await conn.getProgramAccounts(pid, cfg);
    //   @ts-ignore
      res.json(accts?.map(a => a.pubkey.toBase58()));
    } catch (e:any) { res.status(400).json({ error: e.message }); }
  });
  
  app.post("/simulate", async (req, res):Promise<any> => {
    try {
      if (!req.body?.tx) return res.status(400).json({ error: "tx missing" });
      const buf:any = Buffer.from(req.body.tx, "base64");
      const result = await conn.simulateTransaction(buf, { replaceRecentBlockhash: true });
      res.json(result);
    } catch (e:any) { res.status(400).json({ error: e.message }); }
  });
  
  
const PORT = config.PORT;
app.listen(PORT, () => console.log(`GOR-API listening on : ${PORT}`));
