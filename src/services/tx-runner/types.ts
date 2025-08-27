import type { TxType } from "../tx-builder/types";

export type Options = {
  duration: number;
  txType: TxType;
  rpc: string;
  key: string;
  to: string;
  concurrency: number;
};
