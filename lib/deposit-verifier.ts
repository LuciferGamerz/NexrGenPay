import {
  createPublicClient,
  decodeEventLog,
  defineChain,
  formatUnits,
  http,
  isHex,
  keccak256,
  parseAbi,
  parseUnits,
  toBytes,
  type Hash
} from "viem";
import { TronWeb } from "tronweb";
import { getDepositNetworkConfig } from "@/lib/deposit-config";
import type { DepositNetwork } from "@/lib/wallet-types";

const transferAbi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)"
]);
const transferTopic = keccak256(toBytes("Transfer(address,address,uint256)"));
const tronTransferTopic = "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export type DepositVerification =
  | { status: "PENDING"; confirmations: number; amount: string | null; fromAddress: string; toAddress: string }
  | { status: "VERIFIED"; confirmations: number; amount: string; fromAddress: string; toAddress: string }
  | { status: "INVALID"; message: string };

function amountToRaw(amount: string, decimals: number) {
  return parseUnits(amount, decimals);
}

function rawToAmount(amount: bigint, decimals: number) {
  const formatted = formatUnits(amount, decimals);
  return formatted.includes(".")
    ? formatted.replace(/0+$/, "").replace(/\.$/, "")
    : formatted;
}

function normalizeTronHex(address: string) {
  return address.toLowerCase().replace(/^41/, "");
}

async function verifyEvmDeposit(
  network: "BEP20" | "ERC20",
  txHash: string,
  claimedAmount?: string
): Promise<DepositVerification> {
  const config = getDepositNetworkConfig(network);
  if (!isHex(txHash) || txHash.length !== 66) {
    return { status: "INVALID", message: "Transaction hash must be a 32-byte EVM transaction hash." };
  }

  const chainId = network === "BEP20" ? 56 : 1;
  const chain = defineChain({
    id: chainId,
    name: network === "BEP20" ? "BNB Smart Chain" : "Ethereum",
    nativeCurrency: network === "BEP20"
      ? { name: "BNB", symbol: "BNB", decimals: 18 }
      : { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [config.rpcUrl] } }
  });
  const client = createPublicClient({ chain, transport: http(config.rpcUrl, { timeout: 15_000 }) });
  const rpcChainId = await client.getChainId();
  if (rpcChainId !== chainId) {
    throw new Error(`Configured RPC returned chain ID ${rpcChainId}; expected ${chainId}.`);
  }
  let receipt;
  try {
    receipt = await client.getTransactionReceipt({ hash: txHash as Hash });
  } catch (error) {
    if (error instanceof Error && error.name === "TransactionReceiptNotFoundError") {
      return { status: "PENDING", confirmations: 0, amount: null, fromAddress: "", toAddress: config.address };
    }
    throw error;
  }

  if (receipt.status !== "success") {
    return { status: "INVALID", message: "The transaction reverted on-chain." };
  }

  const tokenAddress = config.tokenAddress.toLowerCase();
  const depositAddress = config.address.toLowerCase();
  let received = BigInt(0);
  let fromAddress = "";
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== tokenAddress || log.topics[0]?.toLowerCase() !== transferTopic.toLowerCase()) continue;
    const decoded = decodeEventLog({ abi: transferAbi, data: log.data, topics: log.topics });
    if (decoded.args.to.toLowerCase() !== depositAddress) continue;
    received += decoded.args.value;
    fromAddress = decoded.args.from;
  }

  if (received === BigInt(0)) {
    return { status: "INVALID", message: "No transfer of the configured token to this deposit address was found." };
  }
  if (claimedAmount && received !== amountToRaw(claimedAmount, config.decimals)) {
    return { status: "INVALID", message: "The on-chain token amount does not match the amount entered." };
  }

  const amount = rawToAmount(received, config.decimals);
  const latestBlock = await client.getBlockNumber();
  const confirmations = Number(latestBlock - receipt.blockNumber + BigInt(1));
  if (confirmations < config.confirmations) {
    return { status: "PENDING", confirmations, amount, fromAddress, toAddress: config.address };
  }
  return { status: "VERIFIED", confirmations, amount, fromAddress, toAddress: config.address };
}

async function verifyTronDeposit(txHash: string, claimedAmount?: string): Promise<DepositVerification> {
  const config = getDepositNetworkConfig("TRC20");
  if (!/^[a-fA-F0-9]{64}$/.test(txHash)) {
    return { status: "INVALID", message: "TRON transaction hash must be 64 hexadecimal characters." };
  }

  const headers = process.env.TRONGRID_API_KEY
    ? { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY }
    : undefined;
  const tron = new TronWeb({ fullHost: config.rpcUrl, headers });
  const info = await tron.trx.getTransactionInfo(txHash);
  if (!info || !info.id) {
    return { status: "PENDING", confirmations: 0, amount: null, fromAddress: "", toAddress: config.address };
  }
  if (info.receipt?.result && info.receipt.result !== "SUCCESS") {
    return { status: "INVALID", message: "The TRON transaction did not execute successfully." };
  }

  const configuredToken = normalizeTronHex(tron.address.toHex(config.tokenAddress));
  const configuredRecipient = normalizeTronHex(tron.address.toHex(config.address));
  const matchingLogs = (info.log ?? []).filter((log) =>
    normalizeTronHex(log.address) === configuredToken &&
    log.topics[0]?.toLowerCase() === tronTransferTopic
  );

  let received = BigInt(0);
  for (const log of matchingLogs) {
    const recipientTopic = log.topics[2]?.toLowerCase();
    if (!recipientTopic || recipientTopic.slice(-40) !== configuredRecipient) continue;
    received += BigInt(`0x${log.data}`);
  }
  if (received === BigInt(0)) {
    return { status: "INVALID", message: "No transfer of the configured TRC-20 token to this deposit address was found." };
  }
  if (claimedAmount && received !== amountToRaw(claimedAmount, config.decimals)) {
    return { status: "INVALID", message: "The on-chain token amount does not match the amount entered." };
  }

  const amount = rawToAmount(received, config.decimals);
  const latestBlock = await tron.trx.getCurrentBlock();
  const latestBlockNumber = latestBlock.block_header.raw_data.number;
  const confirmations = Math.max(0, latestBlockNumber - info.blockNumber + 1);
  if (confirmations < config.confirmations) {
    return { status: "PENDING", confirmations, amount, fromAddress: "", toAddress: config.address };
  }

  const transaction = await tron.trx.getTransaction(txHash);
  const ownerHex = transaction.raw_data.contract[0]?.parameter.value.owner_address;
  const fromAddress = ownerHex ? tron.address.fromHex(ownerHex) : "";
  return { status: "VERIFIED", confirmations, amount, fromAddress, toAddress: config.address };
}

export async function verifyDeposit(
  network: DepositNetwork,
  txHash: string,
  claimedAmount?: string
): Promise<DepositVerification> {
  if (network === "TRC20") return verifyTronDeposit(txHash, claimedAmount);
  return verifyEvmDeposit(network, txHash, claimedAmount);
}
