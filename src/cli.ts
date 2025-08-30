#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';
import { ComponentAnalyzer } from './analyzer';
import { JsonFormatter, MermaidFormatter, DotFormatter } from './formatters';
import { CLIOptions } from './types';

const program = new Command();

program
  .name('rscout')
  .description('Next.js Server/Client Component Visualizer')
  .version('0.1.0');

program
  .command('analyze [path]')
  .description('Analyze Next.js components in the specified path')
  .option('-f, --format <format>', 'output format (json, mermaid, dot)', 'json')
  .option('-o, --output <path>', 'output file path')
  .option('-v, --verbose', 'verbose output', false)
  .action(async (targetPath: string = './src', options: CLIOptions) => {
    try {
      const absolutePath = path.resolve(process.cwd(), targetPath);
      
      if (!fs.existsSync(absolutePath)) {
        console.error(chalk.red(`Error: Path "${absolutePath}" does not exist`));
        process.exit(1);
      }

      console.log(chalk.blue(`Analyzing components in: ${absolutePath}`));
      
      const analyzer = new ComponentAnalyzer(process.cwd());
      const result = await analyzer.analyze(absolutePath);

      let output: string;
      switch (options.format) {
        case 'mermaid':
          output = new MermaidFormatter().format(result);
          break;
        case 'dot':
          output = new DotFormatter().format(result);
          break;
        case 'json':
        default:
          output = new JsonFormatter().format(result);
          break;
      }

      if (options.output) {
        const outputPath = path.resolve(process.cwd(), options.output);
        fs.writeFileSync(outputPath, output);
        console.log(chalk.green(`Analysis saved to: ${outputPath}`));
      } else {
        console.log(output);
      }

      console.log(chalk.cyan('\n📊 Summary:'));
      console.log(`  Total Components: ${result.stats.totalComponents}`);
      console.log(`  Server Components: ${result.stats.serverComponents} ${chalk.blue('■')}`);
      console.log(`  Client Components: ${result.stats.clientComponents} ${chalk.yellow('■')}`);
      
      if (result.warnings.length > 0) {
        console.log(chalk.red(`\n⚠️  Warnings: ${result.warnings.length}`));
        if (options.verbose) {
          result.warnings.forEach(warning => {
            console.log(chalk.yellow(`  - ${warning.message}`));
          });
        }
      } else {
        console.log(chalk.green('\n✅ No warnings found!'));
      }

    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program.parse(process.argv);