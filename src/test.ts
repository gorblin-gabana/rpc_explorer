// // check-routes.mjs
// // Usage: node check-routes.mjs <BASE_URL>   (default: http://localhost:8080)

// import { argv, exit } from 'node:process';
// import { setTimeout as sleep } from 'node:timers/promises';

// const base = argv[2] ?? 'http://localhost:8080';
// console.log(`\n🔎  Checking GOR-API at ${base}\n`);

// // ──────────────────────────
// // SAMPLE IDs (edit to match)
// // ──────────────────────────
// const SAMPLE = {
//   slot:            0,                                                   // will auto-refresh
//   signature:       '3h9R5D6EuQzk1yMmsgrXQJC8i9bdW1PgSEycALgAz7J8wR4CqcPeYy7o8mTdT1wY1yskPX9AE3NDLGKwyV8a5Pav', // any tx sig
//   pubkey:          '11111111111111111111111111111111',
//   mint:            'Mint1',                                             // any SPL mint
//   owner:           '11111111111111111111111111111111',
//   stake:           'Stake11111111111111111111111111111111111111',
//   program:         'BPFLoaderUpgradeab1e11111111111111111111111',
// };

// // ──────────────────────────
// // Helper
// // ──────────────────────────
// const ok =  '\u001b[32m✔\u001b[0m';
// const bad = '\u001b[31m✖\u001b[0m';

// async function APICall(method:any, path:any, body:any) {
//   try {
//     const url   = `${base}${path}`;
//     const opt   = body ? { method, headers:{'content-type':'application/json'}, body:JSON.stringify(body)} : {};
//     const start = Date.now();
//     const res   = await fetch(url, opt);
//     const json  = await res.json().catch(()=>'[non-JSON]');
//     const ms    = Date.now()-start;
//     console.log(`${res.ok?ok:bad} ${method} ${path.padEnd(32)} → ${res.status} ${ms} ms`);
//     if(!res.ok) console.dir(json,{depth:2});
//     return json;
//   } catch (e) {
//     console.log(`${bad} ${method} ${path} → ${e.message}`);
//   }
// }

// // ──────────────────────────
// // Probe – in logical order
// // ──────────────────────────
// (async () => {
//   await APICall('GET','/health');
//   await APICall('GET','/slot');
//   const bl = await APICall('GET','/block/latest');
//   if (bl?.slot) SAMPLE.slot = bl.slot;
//   await APICall('GET','/validators');
//   await APICall('GET','/fees/latest');

//   await APICall('GET',`/block/${SAMPLE.slot}`);
//   await APICall('GET',`/tx/${SAMPLE.signature}`);
//   await APICall('GET',`/tx/${SAMPLE.signature}/status`);

//   await APICall('GET',`/balance/${SAMPLE.pubkey}`);
//   await APICall('GET',`/account/${SAMPLE.pubkey}/info`);

//   await APICall('GET','/tokens/mints');
//   await APICall('GET',`/tokens/${SAMPLE.owner}/accounts`);
//   await APICall('GET',`/token/${SAMPLE.mint}/supply`);
//   await APICall('GET',`/token/${SAMPLE.mint}/holders?limit=5`);

//   await APICall('GET',`/program/${SAMPLE.program}/accounts?datasize=0&slice=0:0`);
//   await APICall('GET',`/program/${SAMPLE.program}/info`);

//   await APICall('GET','/epoch');
//   await APICall('GET','/supply');
//   await APICall('GET',`/history/${SAMPLE.owner}?limit=5`);
//   await APICall('GET',`/rewards/${SAMPLE.owner}?epoch=latest`);
//   await APICall('GET',`/stake/${SAMPLE.stake}`);

//   // POST routes (use harmless bodies)
//   await APICall('POST','/simulate',{ tx:'AAAA' });
//   await APICall('POST','/tx/send' ,{ tx:'AAAA' });
//   await APICall('POST','/airdrop' ,{ pubkey:SAMPLE.pubkey, lamports:1_000_000 });

//   console.log('\n✅  Route check finished\n');
//   await sleep(50);   // allow stdout to flush before Node exits on Windows
//   exit(0);
// })();
