import { config } from 'dotenv';

// Load environment variables FIRST, before any other imports
config();

import { log, setupGracefulShutdown } from './utils';
import { monitorChains, setupWebSocketMonitoring, monitorPrices } from './arbitrage';
import { getWebSocketServer, closeWebSocketServer } from './websocket-server';

// Main function
async function main(): Promise<void> {
  try {
    log('Starting viem continuous monitoring script...');

    // Setup graceful shutdown
    setupGracefulShutdown();

    // Start WebSocket server for frontend communication
    const wsServer = getWebSocketServer();
    log('WebSocket server started for frontend communication');

    // Start WebSocket monitoring
    await setupWebSocketMonitoring();

    // Start both monitoring loops in parallel
    await Promise.all([
      // monitorChains(),
      monitorPrices()
    ]);

  } catch (error) {
    log(`Fatal error: ${error}`, 'error');
    closeWebSocketServer();
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  main().catch((error) => {
    log(`Unhandled error: ${error}`, 'error');
    process.exit(1);
  });
}

export { main, monitorChains, setupWebSocketMonitoring, monitorPrices };