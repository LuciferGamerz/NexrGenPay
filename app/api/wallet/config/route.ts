import { NextResponse } from "next/server";
import { getConfiguredDepositNetworks } from "@/lib/deposit-config";

export async function GET() {
  return NextResponse.json({
    networks: getConfiguredDepositNetworks()
      .filter(({ network }) => network === "ERC20")
      .map(({ network, label, address, qrImage }) => ({
        network,
        label,
        address,
        qrImage
      }))
  });
}
