import { existsSync } from "node:fs";
import { join } from "node:path";
import { isAddress } from "viem";
import { TronWeb } from "tronweb";
import type { DepositNetwork } from "@/lib/wallet-types";

export type DepositNetworkConfig = {
  network: DepositNetwork;
  label: string;
  address: string;
  qrImage: string;
  tokenAddress: string;
  rpcUrl: string;
  confirmations: number;
  decimals: number;
};

const configuredNetworks: Record<DepositNetwork, Omit<DepositNetworkConfig, "network">> = {
  BEP20: {
    label: "BNB Smart Chain — BEP-20 (Binance-Peg BSC-USD)",
    address: process.env.DEPOSIT_BEP20_ADDRESS ?? "",
    qrImage: process.env.DEPOSIT_BEP20_QR ?? "",
    tokenAddress: process.env.USDT_BEP20_TOKEN_ADDRESS ?? "",
    rpcUrl: process.env.BSC_RPC_URL ?? "",
    confirmations: Number(process.env.DEPOSIT_CONFIRMATIONS_BEP20 ?? 15),
    decimals: 18
  },
  ERC20: {
    label: "Ethereum — ERC-20 USDT",
    address: process.env.DEPOSIT_ERC20_ADDRESS ?? "",
    qrImage: process.env.DEPOSIT_ERC20_QR ?? "",
    tokenAddress: process.env.USDT_ERC20_TOKEN_ADDRESS ?? "",
    rpcUrl: process.env.ETHEREUM_RPC_URL ?? "",
    confirmations: Number(process.env.DEPOSIT_CONFIRMATIONS_ERC20 ?? 12),
    decimals: 6
  },
  TRC20: {
    label: "TRON — TRC-20 USDT",
    address: process.env.DEPOSIT_TRC20_ADDRESS ?? "",
    qrImage: process.env.DEPOSIT_TRC20_QR ?? "",
    tokenAddress: process.env.USDT_TRC20_TOKEN_ADDRESS ?? "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    rpcUrl: process.env.TRON_RPC_URL ?? "",
    confirmations: Number(process.env.DEPOSIT_CONFIRMATIONS_TRC20 ?? 20),
    decimals: 6
  }
};

const reportedInvalidNetworks = new Set<DepositNetwork>();

export function getDepositNetwork(network: DepositNetwork) {
  return { network, ...configuredNetworks[network] };
}

export function getConfiguredDepositNetworks() {
  return (Object.keys(configuredNetworks) as DepositNetwork[])
    .map(getDepositNetwork)
    .filter((config) => {
      try {
        validateNetworkConfig(config);
        return true;
      } catch (error) {
        if (!reportedInvalidNetworks.has(config.network)) {
          const reason = error instanceof Error ? error.message : "Unknown configuration error.";
          console.error(`Disabling ${config.network} deposits: ${reason}`);
          reportedInvalidNetworks.add(config.network);
        }
        return false;
      }
    });
}

function validateNetworkConfig(config: DepositNetworkConfig) {
  const qrPath = /^\/deposit\/[A-Za-z0-9._-]+\.(?:png|jpe?g|webp)$/i.test(config.qrImage)
    ? join(process.cwd(), "public", config.qrImage.slice(1))
    : "";
  const hasQrImage = Boolean(qrPath && existsSync(qrPath));
  const validAddresses = config.network === "TRC20"
    ? TronWeb.isAddress(config.address) && TronWeb.isAddress(config.tokenAddress)
    : isAddress(config.address) && isAddress(config.tokenAddress);
  if (!config.address || !config.tokenAddress || !config.rpcUrl || !hasQrImage || !validAddresses ||
      !Number.isSafeInteger(config.confirmations) || config.confirmations < 1) {
    throw new Error(`${config.label} deposit verification is not fully configured.`);
  }
}

export function getDepositNetworkConfig(network: DepositNetwork) {
  const config = getDepositNetwork(network);
  validateNetworkConfig(config);
  return config;
}
