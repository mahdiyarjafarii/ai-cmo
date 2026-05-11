import fs from "fs";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { config, validateConfig } from "./config";
import logger from "./logger";
import { CompanyAnalysisAgent } from "./agent/analyzer";
import { ReportFormatter } from "./formatters/report";

async function main(): Promise<void> {
  try {
    validateConfig();

    const argv = await yargs(hideBin(process.argv))
      .option("url", {
        alias: "u",
        describe: "Target company URL to analyze",
        type: "string",
        demandOption: false,
      })
      .option("output-dir", {
        alias: "o",
        describe: "Output directory for results",
        type: "string",
        default: config.output.dir,
      })
      .option("format", {
        alias: "f",
        describe: "Output format",
        type: "string",
        choices: ["json", "markdown", "both"],
        default: "both",
      })
      .option("verbose", {
        alias: "v",
        describe: "Enable verbose logging",
        type: "boolean",
        default: false,
      })
      .help()
      .parseAsync();

    if (argv.verbose) {
      logger.info("Verbose mode enabled");
    }

    const targetUrl = argv.url || (await promptForUrl());

    if (!targetUrl) {
      logger.error("URL is required");
      process.exit(1);
    }

    logger.info(`Analyzing ${targetUrl}`);

    // Ensure output directory exists
    const outputDir = argv["output-dir"];
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      logger.info(`Created output directory: ${outputDir}`);
    }

    // Run analysis
    const agent = new CompanyAnalysisAgent();
    const result = await agent.analyze(targetUrl);

    // Save results
    const timestamp = result.timestamp.replace(/[:.]/g, "-").split("T")[0];
    const companyName = result.company.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const baseFilename = `${timestamp}_${companyName}`;

    const format = argv.format;

    if (format === "json" || format === "both") {
      const jsonPath = path.join(outputDir, `${baseFilename}.json`);
      fs.writeFileSync(jsonPath, ReportFormatter.generateJSON(result));
      logger.info(`JSON report saved: ${jsonPath}`);
    }

    if (format === "markdown" || format === "both") {
      const markdownPath = path.join(outputDir, `${baseFilename}.md`);
      fs.writeFileSync(markdownPath, ReportFormatter.generateMarkdown(result));
      logger.info(`Markdown report saved: ${markdownPath}`);
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("ANALYSIS COMPLETE");
    console.log("=".repeat(60));
    console.log(`\nCompany: ${result.company.name}`);
    console.log(`URL: ${result.company.url}`);
    console.log(`Competitors Found: ${result.competitors.length}`);
    console.log(`\nOutput Directory: ${path.resolve(outputDir)}`);
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    logger.error(
      `Fatal error: ${error instanceof Error ? error.message : String(error)}`
    );
    if (process.env.DEBUG) {
      console.error(error);
    }
    process.exit(1);
  }
}

async function promptForUrl(): Promise<string | null> {
  if (process.stdin.isTTY === false) {
    return null;
  }

  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("Enter target company URL: ", (answer) => {
      rl.close();
      resolve(answer || null);
    });
  });
}

main().catch((error) => {
  logger.error(`Unhandled error: ${error}`);
  process.exit(1);
});
