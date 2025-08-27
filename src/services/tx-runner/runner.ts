import type { Options } from "./types";
import { worker } from "./helpers";

export async function runTxForSeconds(options: Options) {
  const endTime = Date.now() + options.duration * 1000;
  const workers = Array.from({ length: options.concurrency }, (_, i) =>
    worker(i + 1, options, endTime)
  );

  const results = await Promise.all(workers);
  const total = results.reduce((a, b) => a + b, 0);

  console.log(`\nDone! Sent ${total} transactions across ${options.concurrency} workers.`);
}
