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
  .action(async (opts) => {
    await runTxForSeconds({
      duration: parseInt(opts.duration),
      txType: opts.type,
      rpc: opts.rpc,
      key: opts.key,
      to: opts.to
    });
  });

program.parse();
