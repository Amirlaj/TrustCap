import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
} from "viem";

import { privateKeyToAccount } from "viem/accounts";
import { namehash, normalize } from "viem/ens";
import { sepolia } from "viem/chains";

async function main() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.DEVELOPMENT_PRIVATE_KEY as `0x${string}`;
  const ensName = process.env.ENS_TEST_NAME;

  if (!rpcUrl) {
    throw new Error("Missing SEPOLIA_RPC_URL");
  }

  if (!privateKey) {
    throw new Error("Missing DEVELOPMENT_PRIVATE_KEY");
  }

  if (!ensName) {
    throw new Error("Missing ENS_TEST_NAME");
  }

  // Turn the private key into the development wallet account
  const account = privateKeyToAccount(privateKey);

  // Used for reading blockchain data
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });

  // Used for sending signed transactions
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(rpcUrl),
  });

  const normalizedName = normalize(ensName);

  console.log("ENS name:", normalizedName);
  console.log("Wallet:", account.address);

  // Ask ENS which resolver this name currently uses
  const resolverAddress = await publicClient.getEnsResolver({
    name: normalizedName,
  });

  if (!resolverAddress) {
    throw new Error("No resolver found for this ENS name");
  }

  console.log("Resolver:", resolverAddress);

  const resolverAbi = parseAbi([
    "function setText(bytes32 node, string key, string value)",
  ]);

  const node = namehash(normalizedName);

  console.log('Writing description = "My first test"...');

  const hash = await walletClient.writeContract({
    address: resolverAddress,
    abi: resolverAbi,
    functionName: "setText",
    args: [node, "description", "My first test"],
  });

  console.log("Transaction:", hash);
  console.log("Waiting for confirmation...");

  await publicClient.waitForTransactionReceipt({
    hash,
  });

  console.log("Transaction confirmed ✅");

  // Read the record back through ENS
  const description = await publicClient.getEnsText({
    name: normalizedName,
    key: "description",
  });

  console.log("Description:", description);
}

main().catch((error) => {
  console.error("Something went wrong:");
  console.error(error);
  process.exit(1);
});