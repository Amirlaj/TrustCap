import { createPublicClient, http, formatEther } from "viem";
import { sepolia } from "viem/chains";

async function main() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const wallet = process.env.WALLET_ADDRESS as `0x${string}`;

  if (!rpcUrl) {
    throw new Error("Missing SEPOLIA_RPC_URL");
  }

  if (!wallet) {
    throw new Error("Missing WALLET_ADDRESS");
  }

  const client = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });

  const balance = await client.getBalance({
    address: wallet,
  });

  console.log("Connected to Sepolia ✅");
  console.log("Wallet:", wallet);
  console.log("Balance:", formatEther(balance), "ETH");
}

main().catch((error) => {
  console.error("Something went wrong:");
  console.error(error);
  process.exit(1);
});