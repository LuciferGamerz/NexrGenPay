import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { getDepositNetworkConfig } from "@/lib/deposit-config";

export function createEthereumClient() {
  const config = getDepositNetworkConfig("ERC20");
  return createPublicClient({
    chain: mainnet,
    transport: http(config.rpcUrl, { timeout: 15_000 }),
  });
}
