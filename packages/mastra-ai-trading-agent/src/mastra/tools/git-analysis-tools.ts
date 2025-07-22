import { Tool } from '@mastra/core/tool';
import { z } from 'zod';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

// Schema for git analysis input
const gitAnalysisSchema = z.object({
  strategyName: z.string().describe('Name of the strategy to analyze (without .pine extension)'),
  compareWithCommit: z.string().optional().describe('Git commit hash to compare with (defaults to HEAD~1)'),
  analyzeNewFiles: z.boolean().optional().describe('Whether to analyze newly added files (defaults to true)'),
});

// Schema for git analysis output
const gitAnalysisOutputSchema = z.object({
  strategyFileChanges: z.object({
    hasChanges: z.boolean(),
    filePath: z.string().optional(),
    diff: z.string().optional(),
    addedLines: z.number().optional(),
    removedLines: z.number().optional(),
  }),
  backtestChanges: z.object({
    newFiles: z.array(z.object({
      path: z.string(),
      content: z.string(),
      type: z.enum(['csv', 'text', 'markdown', 'other']),
    })),
    modifiedFiles: z.array(z.object({
      path: z.string(),
      diff: z.string(),
      type: z.enum(['csv', 'text', 'markdown', 'other']),
    })),
  }),
  commitInfo: z.object({
    hash: z.string().optional(),
    message: z.string().optional(),
    timestamp: z.string().optional(),
    author: z.string().optional(),
  }).optional(),
});

// Tool to analyze git changes for strategy evolution
export const analyzeStrategyEvolution = new Tool({
  id: 'analyze-strategy-evolution',
  description: 'Analyzes git diff changes in Pine script strategy files and backtest results to understand strategy evolution',
  inputSchema: gitAnalysisSchema,
  outputSchema: gitAnalysisOutputSchema,
  execute: async ({ strategyName, compareWithCommit = 'HEAD~1', analyzeNewFiles = true }) => {
    try {
      const strategiesDir = 'data/strategies';
      const backtestsDir = 'data/backtests';
      const strategyFile = `${strategyName}.pine`;
      const strategyPath = join(strategiesDir, strategyFile);
      const backtestPath = join(backtestsDir, strategyName);

      // Check if we're in a git repository
      let isGitRepo = false;
      try {
        execSync('git rev-parse --git-dir', { stdio: 'ignore' });
        isGitRepo = true;
      } catch (error) {
        console.warn('Not in a git repository or git not available');
      }

      const result: z.infer<typeof gitAnalysisOutputSchema> = {
        strategyFileChanges: {
          hasChanges: false,
        },
        backtestChanges: {
          newFiles: [],
          modifiedFiles: [],
        },
      };

      if (!isGitRepo) {
        // If not in git repo, just read current files
        if (existsSync(strategyPath)) {
          result.strategyFileChanges = {
            hasChanges: false,
            filePath: strategyPath,
            diff: 'Git repository not available - showing current file content',
          };
        }

        // Read backtest files as "new" files
        if (existsSync(backtestPath) && analyzeNewFiles) {
          const { readdirSync } = require('fs');
          const files = readdirSync(backtestPath);

          result.backtestChanges.newFiles = files.map((filename: string) => {
            const filePath = join(backtestPath, filename);
            const content = readFileSync(filePath, 'utf-8');
            const ext = filename.toLowerCase().split('.').pop() || '';

            let type: 'csv' | 'text' | 'markdown' | 'other';
            if (ext === 'csv') type = 'csv';
            else if (ext === 'md') type = 'markdown';
            else if (ext === 'txt') type = 'text';
            else type = 'other';

            return {
              path: filePath,
              content,
              type,
            };
          });
        }

        return result;
      }

      // Git repository analysis
      try {
        // Get current commit info
        const currentCommitHash = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
        const commitMessage = execSync('git log -1 --pretty=format:"%s"', { encoding: 'utf-8' }).trim();
        const commitTimestamp = execSync('git log -1 --pretty=format:"%ci"', { encoding: 'utf-8' }).trim();
        const commitAuthor = execSync('git log -1 --pretty=format:"%an"', { encoding: 'utf-8' }).trim();

        result.commitInfo = {
          hash: currentCommitHash,
          message: commitMessage,
          timestamp: commitTimestamp,
          author: commitAuthor,
        };

        // Analyze strategy file changes
        try {
          const strategyDiff = execSync(`git diff ${compareWithCommit} HEAD -- ${strategyPath}`, { encoding: 'utf-8' });

          if (strategyDiff.trim()) {
            // Count added and removed lines
            const diffLines = strategyDiff.split('\n');
            const addedLines = diffLines.filter(line => line.startsWith('+')).length;
            const removedLines = diffLines.filter(line => line.startsWith('-')).length;

            result.strategyFileChanges = {
              hasChanges: true,
              filePath: strategyPath,
              diff: strategyDiff,
              addedLines,
              removedLines,
            };
          } else {
            result.strategyFileChanges = {
              hasChanges: false,
              filePath: strategyPath,
            };
          }
        } catch (error) {
          console.warn(`Could not get diff for strategy file: ${error}`);
        }

        // Analyze backtest directory changes
        if (analyzeNewFiles) {
          try {
            // Get list of new files added since the comparison commit
            const newFilesOutput = execSync(`git diff --name-status ${compareWithCommit} HEAD -- ${backtestPath}`, { encoding: 'utf-8' });

            if (newFilesOutput.trim()) {
              const changes = newFilesOutput.trim().split('\n');

              for (const change of changes) {
                const [status, filePath] = change.split('\t');

                if (status === 'A' && existsSync(filePath)) {
                  // New file added
                  const content = readFileSync(filePath, 'utf-8');
                  const filename = filePath.split('/').pop() || '';
                  const ext = filename.toLowerCase().split('.').pop() || '';

                  let type: 'csv' | 'text' | 'markdown' | 'other';
                  if (ext === 'csv') type = 'csv';
                  else if (ext === 'md') type = 'markdown';
                  else if (ext === 'txt') type = 'text';
                  else type = 'other';

                  result.backtestChanges.newFiles.push({
                    path: filePath,
                    content,
                    type,
                  });
                } else if (status === 'M' && existsSync(filePath)) {
                  // Modified file
                  const diff = execSync(`git diff ${compareWithCommit} HEAD -- ${filePath}`, { encoding: 'utf-8' });
                  const filename = filePath.split('/').pop() || '';
                  const ext = filename.toLowerCase().split('.').pop() || '';

                  let type: 'csv' | 'text' | 'markdown' | 'other';
                  if (ext === 'csv') type = 'csv';
                  else if (ext === 'md') type = 'markdown';
                  else if (ext === 'txt') type = 'text';
                  else type = 'other';

                  result.backtestChanges.modifiedFiles.push({
                    path: filePath,
                    diff,
                    type,
                  });
                }
              }
            }
          } catch (error) {
            console.warn(`Could not analyze backtest directory changes: ${error}`);
          }
        }

      } catch (error) {
        console.warn(`Git analysis failed: ${error}`);
      }

      return result;

    } catch (error) {
      throw new Error(`Failed to analyze strategy evolution: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Tool to get git commit history for a strategy
export const getStrategyCommitHistory = new Tool({
  id: 'get-strategy-commit-history',
  description: 'Gets the git commit history for a specific strategy and its backtest files',
  inputSchema: z.object({
    strategyName: z.string().describe('Name of the strategy to analyze'),
    maxCommits: z.number().optional().describe('Maximum number of commits to retrieve (defaults to 10)'),
  }),
  outputSchema: z.object({
    commits: z.array(z.object({
      hash: z.string(),
      message: z.string(),
      timestamp: z.string(),
      author: z.string(),
      changedFiles: z.array(z.string()),
    })),
  }),
  execute: async ({ strategyName, maxCommits = 10 }) => {
    try {
      const strategiesDir = 'data/strategies';
      const backtestsDir = 'data/backtests';
      const strategyFile = `${strategyName}.pine`;
      const strategyPath = join(strategiesDir, strategyFile);
      const backtestPath = join(backtestsDir, strategyName);

      // Check if we're in a git repository
      try {
        execSync('git rev-parse --git-dir', { stdio: 'ignore' });
      } catch (error) {
        return { commits: [] };
      }

      // Get commit history for strategy-related files
      const gitLogCommand = `git log --max-count=${maxCommits} --pretty=format:"%H|%s|%ci|%an" --name-only -- ${strategyPath} ${backtestPath}`;

      try {
        const output = execSync(gitLogCommand, { encoding: 'utf-8' });
        const commits: Array<{
          hash: string;
          message: string;
          timestamp: string;
          author: string;
          changedFiles: string[];
        }> = [];

        if (output.trim()) {
          const logEntries = output.trim().split('\n\n');

          for (const entry of logEntries) {
            const lines = entry.trim().split('\n');
            if (lines.length === 0) continue;

            const commitLine = lines[0];
            const [hash, message, timestamp, author] = commitLine.split('|');
            const changedFiles = lines.slice(1).filter(line => line.trim());

            commits.push({
              hash,
              message,
              timestamp,
              author,
              changedFiles,
            });
          }
        }

        return { commits };

      } catch (error) {
        console.warn(`Could not get commit history: ${error}`);
        return { commits: [] };
      }

    } catch (error) {
      throw new Error(`Failed to get strategy commit history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});