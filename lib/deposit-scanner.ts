import { randomUUID } from "node:crypto";
import { formatUnits, parseAbi } from "viem";
import { createEthereumClient } from "@/lib/ethereum-client";
import { getDepositNetworkConfig } from "@/lib/deposit-config";
import { createAdminClient } from "@/lib/supabase/admin";

const transferEvent = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
])[0];
const scanWindow = BigInt(1000);

export function safeDepositErrorMessage(error: unknown) {
  let message = error instanceof Error ? error.message : String(error);
  for (const name of [
    "ETHEREUM_RPC_URL",
    "BSC_RPC_URL",
    "TRON_RPC_URL",
    "TRONGRID_API_KEY",
    "SUPABASE_SECRET_KEY",
    "DEPOSIT_RECONCILE_SECRET",
  ]) {
    const secret = process.env[name];
    if (secret) message = message.replaceAll(secret, "[REDACTED]");
  }
  return message;
}

export async function scanEthereumDeposits() {
  const config = getDepositNetworkConfig("ERC20");
  const client = createEthereumClient();
  const supabase = createAdminClient();
  const chainId = await client.getChainId();
  if (chainId !== 1) {
    throw new Error(`Ethereum deposit scanner received chain ID ${chainId}; expected 1.`);
  }

  const latestBlock = await client.getBlockNumber();
  const initialBlock = Number(latestBlock);
  if (!Number.isSafeInteger(initialBlock)) throw new Error("Ethereum block number exceeds the safe integer range.");

  const lockId = randomUUID();
  const { data: cursor, error: claimError } = await supabase.rpc("claim_deposit_scanner", {
    p_network: "ERC20",
    p_initial_block: initialBlock,
    p_lock_id: lockId,
    p_lease_seconds: 240,
  });
  if (claimError) throw claimError;
  if (cursor === null) return { busy: true, scannedThrough: null, credited: 0, skippedForReview: 0 };

  const lastScanned = BigInt(cursor);
  const confirmations = BigInt(config.confirmations);
  const confirmedThrough = latestBlock >= confirmations - BigInt(1)
    ? latestBlock - confirmations + BigInt(1)
    : BigInt(0);

  if (confirmedThrough <= lastScanned) {
    const { error } = await supabase.rpc("complete_deposit_scanner", {
      p_network: "ERC20",
      p_lock_id: lockId,
      p_last_scanned_block: Number(lastScanned),
    });
    if (error) throw error;
    return { busy: false, scannedThrough: Number(lastScanned), credited: 0, skippedForReview: 0 };
  }

  try {
    const { data: wallets, error: walletsError } = await supabase.rpc("list_deposit_wallets");
    if (walletsError) throw walletsError;
    const linkedWallets = new Map(wallets.map(({ address, user_id }) => [address.toLowerCase(), user_id]));

    const fromBlock = lastScanned + BigInt(1);
    const toBlock = fromBlock + scanWindow - BigInt(1) < confirmedThrough
      ? fromBlock + scanWindow - BigInt(1)
      : confirmedThrough;
    const logs = await client.getLogs({
      address: config.tokenAddress as `0x${string}`,
      event: transferEvent,
      args: { to: config.address as `0x${string}` },
      fromBlock,
      toBlock,
    });

    const byTransaction = new Map<string, typeof logs>();
    for (const log of logs) {
      const group = byTransaction.get(log.transactionHash) ?? [];
      group.push(log);
      byTransaction.set(log.transactionHash, group);
    }

    let credited = 0;
    let skippedForReview = 0;
    for (const [txHash, transactionLogs] of byTransaction) {
      if (transactionLogs.length !== 1) {
        skippedForReview += 1;
        console.error("Automatic deposit skipped a transaction with multiple matching transfers; manual review required.", {
          txHash,
          transferCount: transactionLogs.length,
        });
        continue;
      }

      const log = transactionLogs[0];
      const fromAddress = log.args.from;
      const toAddress = log.args.to;
      const amount = log.args.value;
      if (!fromAddress || !toAddress || amount === undefined || log.blockNumber === null) {
        throw new Error("Ethereum transfer log is missing required indexed fields.");
      }
      if (toAddress.toLowerCase() !== config.address.toLowerCase()) {
        throw new Error("Ethereum transfer log recipient did not match the configured deposit address.");
      }

      const userId = linkedWallets.get(fromAddress.toLowerCase());
      if (!userId) continue;

      const actualConfirmations = Number(latestBlock - log.blockNumber + BigInt(1));
      if (!Number.isSafeInteger(actualConfirmations) || actualConfirmations < config.confirmations) {
        throw new Error("Deposit scanner selected a transfer below the configured confirmation threshold.");
      }

      const { data, error } = await supabase.rpc("process_deposit_claim", {
        p_user_id: userId,
        p_network: "ERC20",
        p_tx_hash: txHash,
        p_amount: formatUnits(amount, config.decimals),
        p_status: "COMPLETED",
        p_from_address: fromAddress,
        p_to_address: config.address,
        p_actual_confirmations: actualConfirmations,
        p_required_confirmations: config.confirmations,
        p_admin_note: null,
      });
      if (error) {
        if (
          error.message.includes("transaction_hash_already_claimed") ||
          error.message.includes("transaction_amount_mismatch") ||
          error.message.includes("transaction_not_claimable")
        ) {
          skippedForReview += 1;
          console.error("Automatic deposit was skipped because its existing ledger record needs manual review.", {
            txHash,
            reason: error.message,
          });
          continue;
        }
        throw error;
      }
      if (data.credited) credited += 1;
    }

    const { data: completed, error: completeError } = await supabase.rpc("complete_deposit_scanner", {
      p_network: "ERC20",
      p_lock_id: lockId,
      p_last_scanned_block: Number(toBlock),
    });
    if (completeError) throw completeError;
    if (!completed) throw new Error("Deposit scanner lost its database lease before advancing the block cursor.");

    return { busy: false, scannedThrough: Number(toBlock), credited, skippedForReview };
  } catch (error) {
    const { error: releaseError } = await supabase.rpc("release_deposit_scanner", {
      p_network: "ERC20",
      p_lock_id: lockId,
    });
    if (releaseError) {
      console.error("Could not release Ethereum deposit scanner lease:", safeDepositErrorMessage(releaseError));
    }
    throw error;
  }
}
