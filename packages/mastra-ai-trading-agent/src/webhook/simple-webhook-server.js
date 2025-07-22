#!/usr/bin/env node

import express from 'express';
import { z } from 'zod';

const app = express();
app.use(express.json());

// Validation schema for TradingView webhook payload
const tradingViewWebhookSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  action: z.enum(['buy', 'sell']),
  timeframe: z.string().optional(),
  exchange: z.string().optional(),
  message: z.string().optional(),
});

// Webhook endpoint for TradingView alerts
app.post('/webhook/tradingview', async (req, res) => {
  try {
    console.log('📥 Received TradingView webhook:', JSON.stringify(req.body, null, 2));

    // Validate the incoming webhook data
    const validatedData = tradingViewWebhookSchema.parse(req.body);

    // Transform TradingView data to our format
    const alertData = {
      symbol: validatedData.symbol,
      price: validatedData.price,
      action: validatedData.action,
      timeframe: validatedData.timeframe,
      exchange: validatedData.exchange,
      message: validatedData.message,
      timestamp: Date.now(), // Add timestamp for logging
    };

    console.log('🔄 Processed alert data:', JSON.stringify(alertData, null, 2));

    // Simulate AI analysis (in a real implementation, this would call Mastra)
    const analysis = await simulateAIAnalysis(alertData);

    // Log the complete trading event
    const logEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      alert: alertData,
      analysis: analysis,
    };

    console.log('📊 TRADING EVENT LOG:', JSON.stringify(logEntry, null, 2));

    // Return success response
    res.status(200).json({
      success: true,
      message: 'TradingView alert processed successfully',
      logId: logEntry.id,
      analysis: analysis,
    });

  } catch (error) {
    console.error('❌ Error processing TradingView webhook:', error);

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

// Simulate AI analysis (replace with actual Mastra integration)
async function simulateAIAnalysis(alertData) {
  console.log('🤖 Simulating AI analysis for:', alertData.symbol);

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  const analysis = {
    symbol: alertData.symbol,
    currentPrice: alertData.price,
    recommendedAction: alertData.action,
    confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
    reasoning: `Based on the TradingView alert for ${alertData.symbol}, the system recommends a ${alertData.action} action at $${alertData.price}. ${alertData.message || 'No additional message provided.'}`,
    riskLevel: 'medium',
    targetPrice: alertData.action === 'buy' ? alertData.price * 1.05 : alertData.price * 0.95,
    stopLoss: alertData.action === 'buy' ? alertData.price * 0.98 : alertData.price * 1.02,
    positionSize: '2% of portfolio',
    timeframe: alertData.timeframe || '1h',
  };

  return analysis;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'TradingView Webhook Handler (Demo)',
    version: '1.0.0',
  });
});

// Test endpoint to manually trigger a trading analysis
app.post('/test/trigger-analysis', async (req, res) => {
  try {
    const testData = {
      symbol: 'BTCUSDT',
      price: 45000,
      action: 'buy',
      timeframe: '1h',
      exchange: 'binance',
      message: 'Test alert from manual trigger',
    };

    console.log('🧪 Triggering test analysis with data:', JSON.stringify(testData, null, 2));

    const analysis = await simulateAIAnalysis(testData);

    res.status(200).json({
      success: true,
      message: 'Test analysis executed successfully',
      analysis: analysis,
    });

  } catch (error) {
    console.error('❌ Error executing test analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error executing test analysis',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get all logs endpoint (for monitoring)
app.get('/logs', (req, res) => {
  res.status(200).json({
    message: 'Logs endpoint - in production, this would return stored logs',
    note: 'Currently logs are only printed to console',
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log('🚀 TradingView Webhook Handler (Demo) Starting...');
  console.log('📝 This is a demonstration server that simulates Mastra integration');
  console.log('🔗 Configure your TradingView alerts to send webhooks to:');
  console.log(`   http://your-domain:${PORT}/webhook/tradingview`);
  console.log('');
  console.log('📡 Available endpoints:');
  console.log(`   POST http://localhost:${PORT}/webhook/tradingview - Receive TradingView alerts`);
  console.log(`   GET  http://localhost:${PORT}/health - Health check`);
  console.log(`   POST http://localhost:${PORT}/test/trigger-analysis - Test endpoint`);
  console.log(`   GET  http://localhost:${PORT}/logs - View logs (demo)`);
  console.log('');
  console.log('📋 Example TradingView webhook payload:');
  console.log(JSON.stringify({
    symbol: 'BTCUSDT',
    price: 45000,
    action: 'buy',
    timeframe: '1h',
    exchange: 'binance',
    message: 'RSI below 30, potential buy signal'
  }, null, 2));
  console.log('');
  console.log('✅ Server is ready to receive webhooks!');
});

export { app };