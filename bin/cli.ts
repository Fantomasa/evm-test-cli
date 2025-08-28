#!/usr/bin/env bun
import { Command } from "commander";
import { runTransactionTest } from "../src/worker/orchestrator";
import { TransactionType } from "../src/types";
import type { TestConfiguration } from "../src/types";
import { DEFAULT_VALUES } from "../src/utils/constants";

const program = new Command();

program.name("evm-test-cli").description("EVM Transaction Testing CLI Tool").version("0.1.0");

program
  .command("tx")
  .description("Send transactions for N seconds")
  .requiredOption(
    "-d, --duration <seconds>",
    "How many seconds to run",
    DEFAULT_VALUES.DEFAULT_DURATION.toString()
  )
  .option("-t, --type <type>", "Transaction type: legacy | eip1559 | blob", TransactionType.EIP1559)
  .requiredOption("-r, --rpc <url>", "RPC endpoint")
  .requiredOption("-k, --key <privateKey>", "Private key for sending txs")
  .requiredOption("--to <address>", "Recipient address for transactions")
  .option(
    "-c, --concurrency <number>",
    "Concurrency for sending txs",
    DEFAULT_VALUES.DEFAULT_CONCURRENCY.toString()
  )
  .action(async (opts) => {
    let concurrency = Number(opts.concurrency) ?? DEFAULT_VALUES.DEFAULT_CONCURRENCY;
    if (isNaN(concurrency)) concurrency = DEFAULT_VALUES.DEFAULT_CONCURRENCY;

    // Validate transaction type
    const txType = opts.type as TransactionType;
    if (!Object.values(TransactionType).includes(txType)) {
      console.error(
        `Invalid transaction type: ${opts.type}. Must be one of: ${Object.values(
          TransactionType
        ).join(", ")}`
      );
      process.exit(1);
    }

    const config: TestConfiguration = {
      duration: parseInt(opts.duration),
      txType,
      rpc: opts.rpc,
      privateKey: opts.key,
      recipient: opts.to,
      concurrency
    };

    await runTransactionTest(config);
  });

program.parse();
