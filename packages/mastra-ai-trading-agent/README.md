# Mastra AI Trading Agent with TradingView Integration

This project demonstrates how to trigger Mastra AI agent workflows with asynchronous events from TradingView alerts using webhooks.

## 🚀 Features

- **TradingView Webhook Integration**: Receive real-time trading alerts from TradingView
- **AI-Powered Analysis**: Use Mastra's trading agent to analyze alerts and provide recommendations
- **Automated Trading Decisions**: Process alerts and generate trading strategies
- **Comprehensive Logging**: Track all trading events and analysis results

## 📋 Prerequisites

- Node.js 20.9.0 or higher
- pnpm package manager
- TradingView Pro account (for webhook alerts)
- API keys for:
  - OpenAI (for AI analysis)
  - CoinGecko (for crypto data)
  - Recall (for trading execution)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mastra-ai-trading-agent
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your API keys:
```env
OPENAI_API_KEY=your_openai_api_key
COINGECKO_API_KEY=your_coingecko_api_key
RECALL_API_KEY=your_recall_api_key
RECALL_WALLET_PRIVATE_KEY=your_recall_wallet_key
```

## 🚀 Usage

### 1. Start the Webhook Handler

```bash
pnpm run webhook
```

This starts the webhook server on port 5001 (or the port specified in `PORT` environment variable).

**Note**: This is currently a demonstration server that simulates Mastra integration. For full Mastra integration, you'll need to configure the proper TypeScript compilation and import the Mastra instance.

### 2. Configure TradingView Alerts

In TradingView, create an alert and configure it to send webhooks:

1. Go to your chart and create an alert
2. In the alert settings, enable "Webhook URL"
3. Set the webhook URL to: `http://your-domain:5001/webhook/tradingview`
4. Configure the alert message to include the required data

### 3. Webhook Payload Format

TradingView should send alerts in this simplified format:

```json
{
  "symbol": "BTCUSDT",
  "price": 45000,
  "action": "buy",
  "timeframe": "1h",
  "exchange": "binance",
  "message": "RSI below 30, potential buy signal"
}
```

### 4. Test the Integration

You can test the webhook handler using the test endpoint:

```bash
curl -X POST http://localhost:5001/test/trigger-analysis
```

Or send a test webhook:

```bash
curl -X POST http://localhost:5001/webhook/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "price": 45000,
    "action": "buy",
    "strategy": "RSI Oversold",
    "timeframe": "1h",
    "exchange": "binance",
    "timestamp": 1640995200000,
    "message": "Test alert",
    "volume": 1000000,
    "rsi": 28,
    "macd": "bullish"
  }'
```

## 📊 How It Works

1. **TradingView Alert**: When a trading condition is met, TradingView sends a webhook to your server
2. **Webhook Processing**: The server validates and processes the alert data
3. **AI Analysis**: The Mastra trading agent analyzes the alert and provides recommendations
4. **Decision Making**: Based on the analysis, the system can:
   - Recommend buy/sell/hold actions
   - Calculate risk levels and confidence scores
   - Suggest target prices and stop losses
   - Provide position sizing recommendations
5. **Logging**: All events are logged for monitoring and analysis

## 🔧 API Endpoints

### POST `/webhook/tradingview`
Receives TradingView alerts and triggers analysis.

**Request Body:**
```json
{
  "symbol": "string",
  "price": "number",
  "action": "buy|sell",
  "timeframe": "string (optional)",
  "exchange": "string (optional)",
  "message": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "TradingView alert processed successfully",
  "logId": "log_1234567890",
  "analysis": "AI-generated trading analysis..."
}
```

### GET `/health`
Health check endpoint.

### POST `/test/trigger-analysis`
Test endpoint to manually trigger analysis with sample data.

## 🏗️ Architecture

```
TradingView Alert → Webhook Server → Mastra Agent → AI Analysis → Trading Decision
```

### Components:

- **Webhook Handler** (`src/webhook-handler.ts`): Receives and processes TradingView alerts
- **Trading Agent** (`src/mastra/agents/trading-agent.ts`): AI agent for trading analysis
- **Trading Tools** (`src/mastra/tools/`): Tools for crypto data and trading execution
- **Trading Workflow** (`src/mastra/workflows/trading-workflow.ts`): Workflow for processing alerts

## 🔒 Security Considerations

1. **Webhook Validation**: All incoming webhooks are validated against a schema
2. **Rate Limiting**: Consider implementing rate limiting for production use
3. **Authentication**: Add webhook authentication for production deployments
4. **HTTPS**: Use HTTPS in production for secure webhook communication

## 🚀 Deployment

### Local Development
```bash
pnpm run webhook
```

### Production Deployment

1. Build the project:
```bash
pnpm run build
```

2. Deploy to your preferred platform (Heroku, AWS, etc.)

3. Set environment variables in your deployment platform

4. Configure TradingView to send webhooks to your production URL

## 📝 Example TradingView Alert Configuration

In TradingView, create an alert with these settings:

- **Condition**: Your trading strategy (e.g., RSI < 30)
- **Actions**: Webhook URL
- **Webhook URL**: `https://your-domain.com/webhook/tradingview`
- **Message**:
```
{
  "symbol": "{{ticker}}",
  "price": {{close}},
  "action": "buy",
  "timeframe": "1h",
  "exchange": "binance",
  "message": "RSI oversold condition"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions:
1. Check the logs in the console output
2. Verify your API keys are correctly set
3. Test the webhook endpoint manually
4. Check TradingView alert configuration

## 🔮 Future Enhancements

- [ ] Add more sophisticated trading strategies
- [ ] Implement portfolio management
- [ ] Add real-time market data integration
- [ ] Create a web dashboard for monitoring
- [ ] Add email/SMS notifications
- [ ] Implement backtesting capabilities

## 🚧 Current Status

### ✅ What's Working
- Webhook server that receives TradingView alerts
- Data validation with Zod schemas
- Simulated AI analysis (demonstrates the concept)
- Health check and test endpoints
- Comprehensive logging and error handling

### 🔄 Next Steps for Full Mastra Integration
1. **Fix TypeScript compilation**: Resolve module resolution issues
2. **Import Mastra instance**: Properly import the built Mastra application
3. **Replace simulation**: Replace `simulateAIAnalysis()` with actual Mastra agent calls
4. **Add workflow execution**: Integrate the trading workflow we created
5. **Production deployment**: Deploy with proper authentication and HTTPS

### 🧪 Testing the Current Demo
```bash
# Start the webhook server
pnpm run webhook

# Test with sample data
pnpm run test-webhook

# Test the health endpoint
curl http://localhost:5001/health

# Test the analysis endpoint
curl -X POST http://localhost:5001/test/trigger-analysis
```