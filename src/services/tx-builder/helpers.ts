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
