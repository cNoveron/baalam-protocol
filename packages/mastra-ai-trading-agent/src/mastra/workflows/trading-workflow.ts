import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// Schema for TradingView alert data
const tradingViewAlertSchema = z.object({
  symbol: z.string().describe('The trading symbol (e.g., BTCUSDT)'),
  price: z.number().describe('Current price at alert trigger'),
  action: z.enum(['buy', 'sell', 'alert']).describe('The action to take'),
  strategy: z.string().optional().describe('Trading strategy name'),
  timeframe: z.string().optional().describe('Chart timeframe'),
  exchange: z.string().optional().describe('Exchange name'),
  timestamp: z.number().describe('Alert timestamp'),
  message: z.string().optional().describe('Additional alert message'),
  volume: z.number().optional().describe('Volume at alert'),
  rsi: z.number().optional().describe('RSI value if available'),
  macd: z.string().optional().describe('MACD signal if available'),
});

// Schema for trading analysis
const tradingAnalysisSchema = z.object({
  symbol: z.string(),
  currentPrice: z.number(),
  recommendedAction: z.enum(['buy', 'sell', 'hold']),
  confidence: z.number().min(0).max(100),
  reasoning: z.string(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  targetPrice: z.number().optional(),
  stopLoss: z.number().optional(),
  positionSize: z.number().optional(),
  timeframe: z.string(),
});

// Step 1: Analyze the TradingView alert
const analyzeAlert = createStep({
  id: 'analyze-alert',
  description: 'Analyzes TradingView alert data and provides trading recommendations',
  inputSchema: tradingViewAlertSchema,
  outputSchema: tradingAnalysisSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Alert data not found');
    }

    const agent = mastra?.getAgent('tradingAgent');
    if (!agent) {
      throw new Error('Trading agent not found');
    }

    // Create a comprehensive analysis prompt
    const prompt = `Analyze this TradingView alert and provide a detailed trading recommendation:

ALERT DATA:
- Symbol: ${inputData.symbol}
- Price: $${inputData.price}
- Action: ${inputData.action}
- Strategy: ${inputData.strategy || 'Not specified'}
- Timeframe: ${inputData.timeframe || 'Not specified'}
- Exchange: ${inputData.exchange || 'Not specified'}
- Volume: ${inputData.volume || 'Not available'}
- RSI: ${inputData.rsi || 'Not available'}
- MACD: ${inputData.macd || 'Not available'}
- Message: ${inputData.message || 'No additional message'}

Please provide a comprehensive analysis including:
1. Current market sentiment for this symbol
2. Technical analysis based on the alert data
3. Risk assessment
4. Recommended action (buy/sell/hold) with confidence level
5. Target price and stop loss if applicable
6. Position sizing recommendation
7. Reasoning for the recommendation

Format your response as a structured analysis that can be used for automated trading decisions.`;

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
    // This is a simplified parser - you might want to use a more sophisticated approach
    const confidenceMatch = analysisText.match(/confidence[:\s]*(\d+)%/i);
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;

    const actionMatch = analysisText.match(/recommended action[:\s]*(buy|sell|hold)/i);
    const recommendedAction = actionMatch ? actionMatch[1] as 'buy' | 'sell' | 'hold' : 'hold';

    const riskMatch = analysisText.match(/risk level[:\s]*(low|medium|high)/i);
    const riskLevel = riskMatch ? riskMatch[1] as 'low' | 'medium' | 'high' : 'medium';

    return {
      symbol: inputData.symbol,
      currentPrice: inputData.price,
      recommendedAction,
      confidence,
      reasoning: analysisText,
      riskLevel,
      timeframe: inputData.timeframe || '1h',
    };
  },
});

// Step 2: Execute trading decision
const executeTrade = createStep({
  id: 'execute-trade',
  description: 'Executes the trading decision based on analysis',
  inputSchema: tradingAnalysisSchema,
  outputSchema: z.object({
    executed: z.boolean(),
    tradeId: z.string().optional(),
    message: z.string(),
    timestamp: z.number(),
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Analysis data not found');
    }

    const agent = mastra?.getAgent('tradingAgent');
    if (!agent) {
      throw new Error('Trading agent not found');
    }

    // Only execute if confidence is high enough and action is not 'hold'
    if (inputData.confidence < 70 || inputData.recommendedAction === 'hold') {
      return {
        executed: false,
        message: `Trade not executed: ${inputData.recommendedAction === 'hold' ? 'Hold recommendation' : 'Low confidence'}`,
        timestamp: Date.now(),
      };
    }

    // Here you would integrate with your actual trading execution logic
    // For now, we'll simulate the execution
    const executionPrompt = `Execute a ${inputData.recommendedAction} trade for ${inputData.symbol}:

    Analysis Summary:
    - Symbol: ${inputData.symbol}
    - Current Price: $${inputData.currentPrice}
    - Action: ${inputData.recommendedAction}
    - Confidence: ${inputData.confidence}%
    - Risk Level: ${inputData.riskLevel}
    - Reasoning: ${inputData.reasoning.substring(0, 200)}...

    Please execute this trade using the available trading tools.`;

    const response = await agent.stream([
      {
        role: 'user',
        content: executionPrompt,
      },
    ]);

    let executionResult = '';
    for await (const chunk of response.textStream) {
      executionResult += chunk;
    }

    return {
      executed: true,
      tradeId: `trade_${Date.now()}`,
      message: `Trade executed: ${inputData.recommendedAction} ${inputData.symbol} at $${inputData.currentPrice}`,
      timestamp: Date.now(),
    };
  },
});

// Step 3: Log the trading event
const logTradeEvent = createStep({
  id: 'log-trade-event',
  description: 'Logs the trading event for monitoring and analysis',
  inputSchema: z.object({
    executed: z.boolean(),
    tradeId: z.string().optional(),
    message: z.string(),
    timestamp: z.number(),
  }),
  outputSchema: z.object({
    logged: z.boolean(),
    logId: z.string(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Trade event data not found');
    }

    // Log the complete trading event
    const logEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      execution: inputData,
    };

    console.log('TRADING EVENT LOG:', JSON.stringify(logEntry, null, 2));

    return {
      logged: true,
      logId: logEntry.id,
    };
  },
});

// Create the main trading workflow
const tradingWorkflow = createWorkflow({
  id: 'trading-workflow',
  inputSchema: tradingViewAlertSchema,
  outputSchema: z.object({
    analysis: tradingAnalysisSchema,
    execution: z.object({
      executed: z.boolean(),
      tradeId: z.string().optional(),
      message: z.string(),
      timestamp: z.number(),
    }),
    logging: z.object({
      logged: z.boolean(),
      logId: z.string(),
    }),
  }),
})
  .then(analyzeAlert)
  .then(executeTrade)
  .then(logTradeEvent);

tradingWorkflow.commit();

export { tradingWorkflow, tradingViewAlertSchema };