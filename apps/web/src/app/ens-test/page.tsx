"use client";

import { useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseAbi,
} from "viem";
import { sepolia } from "viem/chains";
import { namehash, normalize } from "viem/ens";

const ENS_NAME = "trustcap-test-9284.eth";

const resolverAbi = parseAbi([
  "function setText(bytes32 node, string key, string value)",
]);

export default function EnsTestPage() {
  const [status, setStatus] = useState("");

  async function writeDescription() {
    try {
      const ethereum = (window as any).ethereum;

      if (!ethereum) {
        throw new Error("MetaMask or another browser wallet is required");
      }

      setStatus("Connecting wallet...");

      // Ask MetaMask which account the user wants to use.
      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as `0x${string}`[];

      const account = accounts[0];

      if (!account) {
        throw new Error("No wallet connected");
      }

      // Wallet client = sends transactions via MetaMask.
      const walletClient = createWalletClient({
        account,
        chain: sepolia,
        transport: custom(ethereum),
      });

      // Public client = reads blockchain data.
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(),
      });

      const name = normalize(ENS_NAME);

      setStatus("Finding ENS resolver...");

      const resolverAddress = await publicClient.getEnsResolver({
        name,
      });

      if (!resolverAddress) {
        throw new Error("No resolver found for this name");
      }

      const node = namehash(name);

      setStatus("Waiting for wallet confirmation...");

      const hash = await walletClient.writeContract({
        address: resolverAddress,
        abi: resolverAbi,
        functionName: "setText",
        args: [node, "description", "My first test"],
      });

      setStatus(`Transaction sent: ${hash}`);

      await publicClient.waitForTransactionReceipt({
        hash,
      });

      setStatus("Success ✅ description = My first test");
    } catch (error) {
      console.error(error);

      setStatus(
        error instanceof Error ? `Error: ${error.message}` : "Unknown error",
      );
    }
  }

  return (
    <main style={{ padding: "40px" }}>
      <h1>ENSv2 Test</h1>

      <p>Name: {ENS_NAME}</p>

      <button onClick={writeDescription}>
        Write ENS Description
      </button>

      <p>{status}</p>
    </main>
  );
}