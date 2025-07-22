
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { tradingWorkflow } from './workflows/trading-workflow';
import { strategyImprovementWorkflow } from './workflows/strategy-improvement-workflow';
import { tradingAgent } from './agents/trading-agent';
import { chiefStrategyAgent } from './agents/chief-strategy-agent';
import { pinescriptAgent } from './agents/pinescript-agent';

export const mastra = new Mastra({
  workflows: { tradingWorkflow, strategyImprovementWorkflow },
  agents: { tradingAgent, chiefStrategyAgent, pinescriptAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
