import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const { safeDepositErrorMessage, scanEthereumDeposits } = await import("../lib/deposit-scanner");
const intervalMs = 60_000;
let running = false;

async function scan() {
  if (running) return;
  running = true;
  try {
    const result = await scanEthereumDeposits();
    console.log("Ethereum deposit scan finished:", result);
  } catch (error) {
    console.error("Ethereum deposit scan failed:", safeDepositErrorMessage(error));
  } finally {
    running = false;
  }
}

console.log("Ethereum auto-deposit watcher started; scanning once per minute.");
await scan();
setInterval(() => void scan(), intervalMs);
