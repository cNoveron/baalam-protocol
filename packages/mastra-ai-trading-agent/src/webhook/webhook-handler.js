import express from 'express';
import { z } from 'zod';

// Import the built Mastra application
const { mastra } = await import('../.mastra/output/index.mjs');

const app = express();
app.use(express.json());

// Validation schema for TradingView webhook payload
const tradingViewWebhookSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  action: z.enum(['buy', 'sell', 'alert']),
  strategy: z.string().optional(),
  timeframe: z.string().optional(),
  exchange: z.string().optional(),
  timestamp: z.number().optional(),
  message: z.string().optional(),
  volume: z.number().optional(),
  rsi: z.number().optional(),
  macd: z.string().optional(),
  // Additional fields that TradingView might send
  alert_name: z.string().optional(),
  chart_time: z.number().optional(),
  bar_index: z.number().optional(),
  bar_time: z.number().optional(),
  close: z.number().optional(),
  high: z.number().optional(),
  low: z.number().optional(),
  open: z.number().optional(),
  volume_24h: z.number().optional(),
});

// Webhook endpoint for TradingView alerts
app.post('/webhook/tradingview', async (req, res) => {
  try {
    console.log('Received TradingView webhook:', JSON.stringify(req.body, null, 2));

    // Validate the incoming webhook data
    const validatedData = tradingViewWebhookSchema.parse(req.body);

    // Transform TradingView data to our format
    const alertData = {
      symbol: validatedData.symbol,
      price: validatedData.price || validatedData.close || 0,
      action: validatedData.action,
      strategy: validatedData.strategy || validatedData.alert_name,
      timeframe: validatedData.timeframe,
      exchange: validatedData.exchange,
      timestamp: validatedData.timestamp || validatedData.bar_time || Date.now(),
      message: validatedData.message,
      volume: validatedData.volume || validatedData.volume_24h,
      rsi: validatedData.rsi,
      macd: validatedData.macd,
    };

    console.log('Processed alert data:', JSON.stringify(alertData, null, 2));

    // Get the trading agent
    const tradingAgent = mastra.getAgent('tradingAgent');
    if (!tradingAgent) {
      throw new Error('Trading agent not found');
    }

    // Create a comprehensive analysis prompt
    const prompt = `Analyze this TradingView alert and provide a detailed trading recommendation:

ALERT DATA:
- Symbol: ${alertData.symbol}
- Price: $${alertData.price}
- Action: ${alertData.action}
- Strategy: ${alertData.strategy || 'Not specified'}
- Timeframe: ${alertData.timeframe || 'Not specified'}
- Exchange: ${alertData.exchange || 'Not specified'}
- Volume: ${alertData.volume || 'Not available'}
- RSI: ${alertData.rsi || 'Not available'}
- MACD: ${alertData.macd || 'Not available'}
- Message: ${alertData.message || 'No additional message'}

Please provide a comprehensive analysis including:
1. Current market sentiment for this symbol
2. Technical analysis based on the alert data
3. Risk assessment
4. Recommended action (buy/sell/hold) with confidence level
5. Target price and stop loss if applicable
6. Position sizing recommendation
7. Reasoning for the recommendation

Format your response as a structured analysis that can be used for automated trading decisions.`;

    // Execute the analysis using the trading agent
    const response = await tradingAgent.stream([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    let analysisText = '';
    for await (const chunk of response.textStream) {
      analysisText += chunk;
    }

    console.log('Trading analysis result:', analysisText);

    // Log the complete trading event
    const logEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      alert: alertData,
      analysis: analysisText,
    };

    console.log('TRADING EVENT LOG:', JSON.stringify(logEntry, null, 2));

    // Return success response
    res.status(200).json({
      success: true,
      message: 'TradingView alert processed successfully',
      logId: logEntry.id,
      analysis: analysisText,
    });

  } catch (error) {
    console.error('Error processing TradingView webhook:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook data',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Mastra Trading Webhook Handler',
  });
});

// Test endpoint to manually trigger a trading analysis
app.post('/test/trigger-analysis', async (req, res) => {
  try {
    const testData = {
      symbol: 'BTCUSDT',
      price: 45000,
      action: 'buy',
      strategy: 'RSI Oversold',
      timeframe: '1h',
      exchange: 'binance',
      timestamp: Date.now(),
      message: 'Test alert from manual trigger',
      volume: 1000000,
      rsi: 30,
      macd: 'bullish',
    };

    console.log('Triggering test analysis with data:', JSON.stringify(testData, null, 2));

    const tradingAgent = mastra.getAgent('tradingAgent');
    if (!tradingAgent) {
      throw new Error('Trading agent not found');
    }

    const prompt = `Analyze this test TradingView alert and provide a detailed trading recommendation:

ALERT DATA:
- Symbol: ${testData.symbol}
- Price: $${testData.price}
- Action: ${testData.action}
- Strategy: ${testData.strategy}
- Timeframe: ${testData.timeframe}
- Exchange: ${testData.exchange}
- Volume: ${testData.volume}
- RSI: ${testData.rsi}
- MACD: ${testData.macd}
- Message: ${testData.message}

Please provide a comprehensive analysis including:
1. Current market sentiment for this symbol
2. Technical analysis based on the alert data
3. Risk assessment
4. Recommended action (buy/sell/hold) with confidence level
5. Target price and stop loss if applicable
6. Position sizing recommendation
7. Reasoning for the recommendation

Format your response as a structured analysis that can be used for automated trading decisions.`;

    const response = await tradingAgent.stream([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    let analysisText = '';
    for await (const chunk of response.textStream) {
      analysisText += chunk;
    }

    res.status(200).json({
      success: true,
      message: 'Test analysis executed successfully',
      analysis: analysisText,
    });

  } catch (error) {
    console.error('Error executing test analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error executing test analysis',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 TradingView webhook handler running on port ${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook/tradingview`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test/trigger-analysis`);
});

export { app };