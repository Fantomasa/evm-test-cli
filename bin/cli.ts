#!/usr/bin/env bun
import { Command } from "commander";
import { runTxForSeconds } from "../src/services/tx-runner/runner";

const program = new Command();

program.name("evm-test-cli").description("EVM Transaction Testing CLI Tool").version("0.1.0");

program
  .command("tx")
  .description("Send transactions for N seconds")
  .requiredOption("-d, --duration <seconds>", "How many seconds to run", "30")
  .option("-t, --type <type>", "Transaction type: legacy | eip1559 | blob", "legacy")
  .requiredOption("-r, --rpc <url>", "RPC endpoint")
  .requiredOption("-k, --key <privateKey>", "Private key for sending txs")
  .requiredOption("--to <address>", "Recipient address for transactions")
  .option("-c, --concurrency", "Concurrency tx for sending txs")
  .action(async (opts) => {
    let concurrency = Number(opts.concurrency) ?? 1;
    if (isNaN(concurrency)) concurrency = 1;

    await runTxForSeconds({
      duration: parseInt(opts.duration),
      txType: opts.type,
      rpc: opts.rpc,
      key: opts.key,
      to: opts.to,
      concurrency
    });
  });

program.parse();
