#!/usr/bin/env node

import './webhook-handler.js';

console.log('🚀 Starting Mastra Trading Webhook Handler...');
console.log('📝 This server will receive TradingView alerts and trigger trading analysis');
console.log('🔗 Configure your TradingView alerts to send webhooks to: http://your-domain:5001/webhook/tradingview');
console.log('');
console.log('📋 Example TradingView webhook payload:');
console.log(JSON.stringify({
  symbol: 'BTCUSDT',
  price: 45000,
  action: 'buy',
  strategy: 'RSI Oversold',
  timeframe: '1h',
  exchange: 'binance',
  timestamp: Date.now(),
  message: 'RSI below 30, potential buy signal',
  volume: 1000000,
  rsi: 28,
  macd: 'bullish'
}, null, 2));