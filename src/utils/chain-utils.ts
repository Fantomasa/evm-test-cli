import type { JsonRpcProvider } from "ethers";

export async function chainSupportsBlobTx(provider: JsonRpcProvider): Promise<boolean> {
  try {
    const fee = await provider.send("eth_blobBaseFee", []);
    return fee !== null;
  } catch (err: any) {
    if (err.message.includes("method not found")) {
      return false;
    }
    return false; // treat any other failure as unsupported
  }
}

export async function getChainId(provider: JsonRpcProvider): Promise<bigint> {
  const network = await provider.getNetwork();
  return network.chainId;
}

export async function validateChainSupport(
  provider: JsonRpcProvider,
  txType: string
): Promise<void> {
  if (txType === "blob") {
    const blobIsSupported = await chainSupportsBlobTx(provider);
    if (!blobIsSupported) {
      throw new Error("❌ The chain doesn't support blob transactions. Process stopped.");
    }
    console.log("✅ Blob transactions are supported on this chain.");
  }
}
