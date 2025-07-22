import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import {
  searchCryptoCoins,
  getHistoricalCryptoPrices,
  getCryptoPrice,
} from "../tools/coingecko-tools";
import {
  getRecallAgent,
  getRecallAgentPortfolio,
  getRecallAgentTrades,
  getRecallTradeQuote,
  executeRecallTrade,
} from "../tools/recall-tools";
// import { mcp } from "../mcp";

// const mcpTools = await mcp.getTools();

export const tradingAgent = new Agent({
  name: "Trading Agent",
  instructions: `
      You are a crypto trading assistant that provides accurate crypto trading information and can help users make trading decisions.

      Your primary function is to help users research crypto coins and make trading decisions.
      - You will be given a user query and you will need to research the crypto coin and provide a summary of the coin.
      - You will also need to provide a trading strategy for the coin.
      - You will also need to provide a risk assessment for the coin.
      - You will also need to provide a return on investment for the coin.
      - You will also need to provide a buy and sell price for the coin.
      - You will also need to provide a buy and sell volume for the coin.
      - After confirmation from the user, you will need to execute the trade.

      You also have access to the Recall API tools:
      - Use the "Get Recall Agent" tool to fetch information about a specific agent by agentId.
      - Use the "Get Recall Agent Portfolio" tool to fetch the portfolio (token holdings and values) for a specific agent by agentId.
      - Use the "Get Recall Agent Trades" tool to fetch the trade history for a specific agent by agentId.
      - Use the "Get Recall Trade Quote" tool to get a quote for a potential trade between two tokens (including price, slippage, and expected output).
      - Use the "Execute Recall Trade" tool to execute a trade between two tokens. Only use this tool after the user has confirmed the trade details and provided a reason for the trade.
      Use these tools whenever the user asks about an agent's portfolio, trades, trade quotes, or wants to execute a trade using Recall.
  `,
  model: openai("gpt-4o"),
  tools: {
    searchCryptoCoins,
    getHistoricalCryptoPrices,
    getCryptoPrice,
    getRecallAgent,
    getRecallAgentPortfolio,
    getRecallAgentTrades,
    getRecallTradeQuote,
    executeRecallTrade,
    //...mcpTools,
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:../mastra.db", // path is relative to the .mastra/output directory
    }),
  }),
});