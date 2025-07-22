#!/usr/bin/env node

import fetch from 'node-fetch';

const WEBHOOK_URL = 'http://localhost:5001/webhook/tradingview';

const testAlert = {
  symbol: 'BTCUSDT',
  price: 45000,
  action: 'buy',
  timeframe: '1h',
  exchange: 'binance',
  message: 'RSI below 30, potential buy signal detected'
};

async function testWebhook() {
  try {
    console.log('🚀 Testing TradingView webhook...');
    console.log('📤 Sending alert data:', JSON.stringify(testAlert, null, 2));

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testAlert),
    });

    const result = await response.json();

    console.log('📥 Response status:', response.status);
    console.log('📥 Response data:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed!');
    }

  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
    console.log('💡 Make sure the webhook server is running on port 3000');
  }
}

// Run the test
testWebhook();