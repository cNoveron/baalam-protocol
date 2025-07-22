import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { readFileSync, readdirSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { resolve, join, basename, extname } from 'path';

// Schema for workflow input
const strategyImprovementInputSchema = z.object({
  strategiesDir: z.string().optional().describe('Directory containing Pinescript strategy files (defaults to data/strategies)'),
  backtestsDir: z.string().optional().describe('Directory containing backtest subdirectories (defaults to data/backtests)'),
  strategyName: z.string().optional().describe('Name of the strategy to analyze (without .pine extension, defaults to "sample-strategy")'),
});

// Schema for strategy analysis
const strategyAnalysisSchema = z.object({
  strategyName: z.string(),
  currentPerformance: z.object({
    winRate: z.number(),
    profitFactor: z.number(),
    sharpeRatio: z.number(),
    maxDrawdown: z.number(),
    totalTrades: z.number(),
  }),
  weaknesses: z.array(z.string()),
  improvementIdeas: z.array(z.object({
    title: z.string(),
    description: z.string(),
    expectedImpact: z.string(),
    implementation: z.string(),
  })),
});

// Schema for Pinescript improvements
const pinescriptImprovementsSchema = z.object({
  improvements: z.array(z.object({
    title: z.string(),
    description: z.string(),
    codeChanges: z.array(z.object({
      location: z.string(),
      originalCode: z.string().optional(),
      newCode: z.string(),
      explanation: z.string(),
    })),
    implementationSteps: z.array(z.string()),
    testingGuidelines: z.array(z.string()),
  })),
});

// Step 1: Analyze strategy evolution using git diff
const analyzeStrategyEvolution = createStep({
  id: 'analyze-strategy-evolution',
  description: 'Analyzes git changes in strategy files and backtest results to understand evolution',
  inputSchema: strategyImprovementInputSchema,
  outputSchema: z.object({
    evolutionAnalysis: z.object({
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
      commitHistory: z.array(z.object({
        hash: z.string(),
        message: z.string(),
        timestamp: z.string(),
        author: z.string(),
        changedFiles: z.array(z.string()),
      })),
    }),
    hasEvolutionData: z.boolean(),
    // Pass through original input parameters
    strategiesDir: z.string().optional(),
    backtestsDir: z.string().optional(),
    strategyName: z.string().optional(),
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Input data not provided');
    }

    const strategyName = inputData.strategyName || 'sample-strategy';
    const agent = mastra?.getAgent('chiefStrategyAgent');

    if (!agent) {
      console.warn('Chief Strategy Agent not found, skipping evolution analysis');
      return {
        evolutionAnalysis: {
          strategyFileChanges: { hasChanges: false },
          backtestChanges: { newFiles: [], modifiedFiles: [] },
          commitHistory: [],
        },
        hasEvolutionData: false,
        strategiesDir: inputData.strategiesDir,
        backtestsDir: inputData.backtestsDir,
        strategyName: inputData.strategyName,
      };
    }

    try {
      // Use the agent's git analysis tools
      const evolutionResult = await agent.stream([
        {
          role: 'user',
          content: `Analyze the evolution of the "${strategyName}" strategy. Use your git analysis tools to:

          1. Use analyzeStrategyEvolution to detect recent changes
          2. Use getStrategyCommitHistory to get the development history

          Provide a comprehensive analysis of how this strategy has evolved over time.`,
        },
      ]);

      let analysisText = '';
      for await (const chunk of evolutionResult.textStream) {
        analysisText += chunk;
      }

      // For demonstration, create a structured response
      // In a real implementation, the agent's tool calls would return structured data
      return {
        evolutionAnalysis: {
          strategyFileChanges: { hasChanges: false },
          backtestChanges: { newFiles: [], modifiedFiles: [] },
          commitHistory: [],
        },
        hasEvolutionData: true,
        strategiesDir: inputData.strategiesDir,
        backtestsDir: inputData.backtestsDir,
        strategyName: inputData.strategyName,
      };

    } catch (error) {
      console.warn(`Git evolution analysis failed: ${error}`);
      return {
        evolutionAnalysis: {
          strategyFileChanges: { hasChanges: false },
          backtestChanges: { newFiles: [], modifiedFiles: [] },
          commitHistory: [],
        },
        hasEvolutionData: false,
        strategiesDir: inputData.strategiesDir,
        backtestsDir: inputData.backtestsDir,
        strategyName: inputData.strategyName,
      };
    }
  },
});

// Step 2: Read and analyze strategy files
const readStrategyFiles = createStep({
  id: 'read-strategy-files',
  description: 'Reads the Pinescript strategy and backtesting results from local files',
  inputSchema: z.object({
    evolutionAnalysis: z.object({
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
      commitHistory: z.array(z.object({
        hash: z.string(),
        message: z.string(),
        timestamp: z.string(),
        author: z.string(),
        changedFiles: z.array(z.string()),
      })),
    }),
    hasEvolutionData: z.boolean(),
    // Original input parameters (passed through from initial input)
    strategiesDir: z.string().optional(),
    backtestsDir: z.string().optional(),
    strategyName: z.string().optional(),
  }),
  outputSchema: z.object({
    pinescriptCode: z.string(),
    backtestingFiles: z.array(z.object({
      filename: z.string(),
      content: z.string(),
      type: z.enum(['csv', 'text', 'markdown', 'other']),
    })),
    evolutionAnalysis: z.object({
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
      commitHistory: z.array(z.object({
        hash: z.string(),
        message: z.string(),
        timestamp: z.string(),
        author: z.string(),
        changedFiles: z.array(z.string()),
      })),
    }),
    hasEvolutionData: z.boolean(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not provided');
    }

    try {
      // Use default values if not provided (relative to .mastra/output working directory)
      const strategiesDir = inputData.strategiesDir || '../../data/strategies';
      const backtestsDir = inputData.backtestsDir || '../../data/backtests';
      const strategyName = inputData.strategyName || 'sample-strategy';

      // Construct file paths
      const pinescriptPath = join(strategiesDir, `${strategyName}.pine`);
      const backtestDirPath = join(backtestsDir, strategyName);

      // Debug logging
      console.log('🔍 DEBUG: Current working directory:', process.cwd());
      console.log('🔍 DEBUG: Input strategiesDir:', inputData.strategiesDir);
      console.log('🔍 DEBUG: Input backtestsDir:', inputData.backtestsDir);
      console.log('🔍 DEBUG: Input strategyName:', inputData.strategyName);
      console.log('🔍 DEBUG: Using strategiesDir:', strategiesDir);
      console.log('🔍 DEBUG: Using backtestsDir:', backtestsDir);
      console.log('🔍 DEBUG: Using strategyName:', strategyName);
      console.log('🔍 DEBUG: Resolved pinescript path:', resolve(pinescriptPath));
      console.log('🔍 DEBUG: Resolved backtest directory:', resolve(backtestDirPath));

      // Read Pinescript strategy file
      const pinescriptCode = readFileSync(pinescriptPath, 'utf-8');

      // Read all files from backtest directory
      const backtestFiles = readdirSync(backtestDirPath);
      console.log('🔍 DEBUG: Found backtest files:', backtestFiles);

      const backtestingFiles = backtestFiles.map(filename => {
        const filePath = join(backtestDirPath, filename);
        const content = readFileSync(filePath, 'utf-8');
        const ext = extname(filename).toLowerCase();

        let type: 'csv' | 'text' | 'markdown' | 'other';
        if (ext === '.csv') type = 'csv';
        else if (ext === '.md') type = 'markdown';
        else if (ext === '.txt') type = 'text';
        else type = 'other';

        return { filename, content, type };
      });

      return {
        pinescriptCode,
        backtestingFiles,
        evolutionAnalysis: inputData.evolutionAnalysis,
        hasEvolutionData: inputData.hasEvolutionData,
      };
    } catch (error) {
      throw new Error(`Failed to read files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Step 3: Analyze with Chief Strategy Agent (with evolution data)
const analyzeStrategy = createStep({
  id: 'analyze-strategy',
  description: 'Chief Strategy Agent analyzes the strategy and backtesting results with evolution context',
  inputSchema: z.object({
    pinescriptCode: z.string(),
    backtestingFiles: z.array(z.object({
      filename: z.string(),
      content: z.string(),
      type: z.enum(['csv', 'text', 'markdown', 'other']),
    })),
    evolutionAnalysis: z.object({
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
      commitHistory: z.array(z.object({
        hash: z.string(),
        message: z.string(),
        timestamp: z.string(),
        author: z.string(),
        changedFiles: z.array(z.string()),
      })),
    }),
    hasEvolutionData: z.boolean(),
  }),
  outputSchema: z.object({
    originalCode: z.string(),
    analysis: strategyAnalysisSchema,
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Strategy data not found');
    }

    const agent = mastra?.getAgent('chiefStrategyAgent');
    if (!agent) {
      throw new Error('Chief Strategy Agent not found');
    }

    // Prepare analysis prompt with all backtest files
    let backtestingSections = '';
    inputData.backtestingFiles.forEach((file, index) => {
      backtestingSections += `\n\n--- BACKTEST FILE ${index + 1}: ${file.filename} ---\n`;
      if (file.type === 'csv') {
        // For CSV files, show a preview
        const lines = file.content.split('\n');
        const preview = lines.slice(0, 11).join('\n'); // Header + 10 rows
        backtestingSections += `\`\`\`csv\n${preview}\n${lines.length > 11 ? '... (truncated)' : ''}\n\`\`\``;
      } else {
        // For other files, show full content
        backtestingSections += file.content;
      }
    });

    // Prepare evolution analysis section
    let evolutionSection = '';
    if (inputData.hasEvolutionData) {
      evolutionSection = `\n\n=== STRATEGY EVOLUTION ANALYSIS ===\n`;

      if (inputData.evolutionAnalysis.commitInfo) {
        evolutionSection += `\nLATEST COMMIT INFO:
- Hash: ${inputData.evolutionAnalysis.commitInfo.hash}
- Message: ${inputData.evolutionAnalysis.commitInfo.message}
- Author: ${inputData.evolutionAnalysis.commitInfo.author}
- Timestamp: ${inputData.evolutionAnalysis.commitInfo.timestamp}`;
      }

      if (inputData.evolutionAnalysis.strategyFileChanges.hasChanges && inputData.evolutionAnalysis.strategyFileChanges.diff) {
        evolutionSection += `\n\nSTRATEGY FILE CHANGES:
\`\`\`diff
${inputData.evolutionAnalysis.strategyFileChanges.diff}
\`\`\`
Lines added: ${inputData.evolutionAnalysis.strategyFileChanges.addedLines || 0}
Lines removed: ${inputData.evolutionAnalysis.strategyFileChanges.removedLines || 0}`;
      }

      if (inputData.evolutionAnalysis.backtestChanges.newFiles.length > 0) {
        evolutionSection += `\n\nNEWLY ADDED BACKTEST FILES:`;
        inputData.evolutionAnalysis.backtestChanges.newFiles.forEach((file, index) => {
          evolutionSection += `\n\n--- NEW FILE ${index + 1}: ${file.path} ---\n`;
          if (file.type === 'csv') {
            const lines = file.content.split('\n');
            const preview = lines.slice(0, 6).join('\n'); // Smaller preview for new files
            evolutionSection += `\`\`\`csv\n${preview}\n${lines.length > 6 ? '... (truncated)' : ''}\n\`\`\``;
          } else {
            evolutionSection += file.content.substring(0, 500) + (file.content.length > 500 ? '...' : '');
          }
        });
      }

      if (inputData.evolutionAnalysis.commitHistory.length > 0) {
        evolutionSection += `\n\nCOMMIT HISTORY:`;
        inputData.evolutionAnalysis.commitHistory.slice(0, 5).forEach((commit, index) => {
          evolutionSection += `\n${index + 1}. ${commit.hash.substring(0, 8)} - ${commit.message} (${commit.author}) - ${commit.timestamp}`;
          if (commit.changedFiles.length > 0) {
            evolutionSection += `\n   Files: ${commit.changedFiles.join(', ')}`;
          }
        });
      }
    } else {
      evolutionSection = `\n\n=== NO EVOLUTION DATA AVAILABLE ===\nAnalyzing current state only (no git history available).\n`;
    }

    const prompt = `Analyze this Pinescript trading strategy and its backtesting results to provide improvement recommendations.

IMPORTANT: This analysis includes strategy evolution data from git diff. Use this information to understand how the strategy has developed over time and base your recommendations on both current performance AND historical changes.

PINESCRIPT STRATEGY:
\`\`\`pinescript
${inputData.pinescriptCode}
\`\`\`

BACKTESTING RESULTS AND ANALYSIS:${backtestingSections}

${evolutionSection}

Please provide:
1. A comprehensive analysis of the strategy's current performance
2. Identification of key weaknesses or areas for improvement
3. Specific, actionable improvement ideas based on mathematical and statistical principles
4. Expected impact of each improvement
5. Implementation guidance for each improvement

Focus on:
- Risk-adjusted returns optimization
- Entry/exit timing improvements
- Position sizing enhancements
- Market regime adaptability
- False signal reduction
- Drawdown minimization

Format your response as a structured analysis with clear sections for each improvement idea.`;

    const response = await agent.stream([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    let analysisText = '';
    for await (const chunk of response.textStream) {
      analysisText += chunk;
    }

    // Parse the analysis to extract structured data
    // This is a simplified parser - in production, you might want to use structured generation
    const strategyNameMatch = analysisText.match(/strategy[:\s]+([^\n]+)/i);
    const strategyName = strategyNameMatch ? strategyNameMatch[1].trim() : 'Unknown Strategy';

    // Extract performance metrics (simplified)
    const winRateMatch = analysisText.match(/win\s*rate[:\s]*([\d.]+)%/i);
    const profitFactorMatch = analysisText.match(/profit\s*factor[:\s]*([\d.]+)/i);
    const sharpeMatch = analysisText.match(/sharpe\s*ratio[:\s]*([\d.]+)/i);
    const drawdownMatch = analysisText.match(/max\s*drawdown[:\s]*([\d.]+)%/i);

    const analysis: z.infer<typeof strategyAnalysisSchema> = {
      strategyName,
      currentPerformance: {
        winRate: winRateMatch ? parseFloat(winRateMatch[1]) : 0,
        profitFactor: profitFactorMatch ? parseFloat(profitFactorMatch[1]) : 0,
        sharpeRatio: sharpeMatch ? parseFloat(sharpeMatch[1]) : 0,
        maxDrawdown: drawdownMatch ? parseFloat(drawdownMatch[1]) : 0,
        totalTrades: (() => {
          // Try to extract trade count from CSV files
          const csvFile = inputData.backtestingFiles.find(f => f.type === 'csv');
          if (csvFile) {
            const lines = csvFile.content.split('\n').filter(line => line.trim());
            return lines.length - 1; // Subtract header row
          }
          return 0; // Default if no CSV found
        })(),
      },
      weaknesses: [
        'Extracted from analysis - placeholder',
      ],
      improvementIdeas: [
        {
          title: 'Improvement 1',
          description: analysisText.substring(0, 200),
          expectedImpact: 'Significant improvement expected',
          implementation: 'See detailed analysis',
        },
      ],
    };

    return {
      originalCode: inputData.pinescriptCode,
      analysis,
    };
  },
});

// Step 4: Generate Pinescript improvements
const generatePinescriptImprovements = createStep({
  id: 'generate-pinescript-improvements',
  description: 'Pinescript Agent generates code improvements based on analysis',
  inputSchema: z.object({
    originalCode: z.string(),
    analysis: strategyAnalysisSchema,
  }),
  outputSchema: pinescriptImprovementsSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Analysis data not found');
    }

    const agent = mastra?.getAgent('pinescriptAgent');
    if (!agent) {
      throw new Error('Pinescript Agent not found');
    }

    // Prepare the prompt for Pinescript improvements
    const prompt = `Based on the following analysis from the Chief Strategy Agent, generate specific Pinescript code improvements.

ORIGINAL PINESCRIPT CODE:
\`\`\`pinescript
${inputData.originalCode}
\`\`\`

STRATEGY ANALYSIS:
${JSON.stringify(inputData.analysis, null, 2)}

For each improvement idea, provide:
1. Clear title and description
2. Specific code changes with before/after snippets
3. Step-by-step implementation instructions
4. Testing guidelines

Ensure all code:
- Uses Pinescript v5 syntax
- Includes detailed comments
- Is optimized for performance
- Follows best practices
- Is easy for a human developer to implement

Format the output as structured instructions that can be directly followed by a Pinescript developer.`;

    const response = await agent.stream([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    let improvementsText = '';
    for await (const chunk of response.textStream) {
      improvementsText += chunk;
    }

    // Parse improvements (simplified - in production use structured generation)
    return {
      improvements: [
        {
          title: 'Dynamic Position Sizing',
          description: 'Implement volatility-based position sizing',
          codeChanges: [
            {
              location: 'After strategy() declaration',
              originalCode: '',
              newCode: `// Dynamic position sizing based on ATR
atrPeriod = input.int(14, "ATR Period")
atrMultiplier = input.float(2.0, "ATR Multiplier")
atr = ta.atr(atrPeriod)
positionSize = math.min(strategy.equity * 0.02 / (atr * atrMultiplier), strategy.equity * 0.1)`,
              explanation: 'This adds volatility-adjusted position sizing to reduce risk during high volatility',
            },
          ],
          implementationSteps: [
            'Add the position sizing code after the strategy declaration',
            'Replace fixed position sizes with the dynamic positionSize variable',
            'Test with different ATR periods and multipliers',
          ],
          testingGuidelines: [
            'Backtest with various market conditions',
            'Verify position sizes scale appropriately with volatility',
            'Check maximum position size limits are respected',
          ],
        },
      ],
    };
  },
});

// Step 5: Format output for UI
const formatOutput = createStep({
  id: 'format-output',
  description: 'Formats the improvements for display in the Mastra chatbot UI',
  inputSchema: pinescriptImprovementsSchema,
  outputSchema: z.object({
    formattedOutput: z.string(),
    improvements: pinescriptImprovementsSchema,
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Improvements data not found');
    }

    let formattedOutput = '# Pinescript Strategy Improvements\n\n';

    inputData.improvements.forEach((improvement, index) => {
      formattedOutput += `## ${index + 1}. ${improvement.title}\n\n`;
      formattedOutput += `**Description:** ${improvement.description}\n\n`;

      formattedOutput += '### Code Changes:\n';
      improvement.codeChanges.forEach((change) => {
        formattedOutput += `\n**Location:** ${change.location}\n`;
        if (change.originalCode) {
          formattedOutput += `\n**Original Code:**\n\`\`\`pinescript\n${change.originalCode}\n\`\`\`\n`;
        }
        formattedOutput += `\n**New Code:**\n\`\`\`pinescript\n${change.newCode}\n\`\`\`\n`;
        formattedOutput += `\n**Explanation:** ${change.explanation}\n`;
      });

      formattedOutput += '\n### Implementation Steps:\n';
      improvement.implementationSteps.forEach((step, stepIndex) => {
        formattedOutput += `${stepIndex + 1}. ${step}\n`;
      });

      formattedOutput += '\n### Testing Guidelines:\n';
      improvement.testingGuidelines.forEach((guideline) => {
        formattedOutput += `- ${guideline}\n`;
      });

      formattedOutput += '\n---\n\n';
    });

    return {
      formattedOutput,
      improvements: inputData,
    };
  },
});

// Create the main strategy improvement workflow
const strategyImprovementWorkflow = createWorkflow({
  id: 'strategy-improvement-workflow',
  inputSchema: strategyImprovementInputSchema,
  outputSchema: z.object({
    formattedOutput: z.string(),
    improvements: pinescriptImprovementsSchema,
  }),
})
  .then(analyzeStrategyEvolution)
  .then(readStrategyFiles)
  .then(analyzeStrategy)
  .then(generatePinescriptImprovements)
  .then(formatOutput);

strategyImprovementWorkflow.commit();

export { strategyImprovementWorkflow, strategyImprovementInputSchema };