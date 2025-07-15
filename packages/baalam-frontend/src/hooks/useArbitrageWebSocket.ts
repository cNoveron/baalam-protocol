import { useState, useEffect, useRef, useCallback } from 'react';

export interface PriceData {
  tokens0PerToken1: number;
  tokens1PerToken0: number;
  timestamp: number;
}

export interface BalanceData {
  usdc: number;
  usdt: number;
  total: number;
  timestamp: number;
}

export interface TradeData {
  sourceChain: string;
  targetChain: string;
  sourcePrice: number;
  targetPrice: number;
  amount: number;
  profit: number;
  gasCost: number;
  netProfit: number;
  status: 'executed' | 'failed' | 'pending';
  type: 'USDC_TARGETED' | 'USDT_TARGETED';
  timestamp: number;
}

export interface StatsData {
  totalTrades: number;
  profitableTrades: number;
  totalProfit: number;
  winRate: number;
  totalPortfolioValue: number;
  timestamp: number;
}

export interface OpportunityData {
  type: 'USDC_TARGETED' | 'USDT_TARGETED';
  buyChain: string;
  sellChain: string;
  buyPrice: number;
  sellPrice: number;
  tradeAmount: number;
  grossProfit: number;
  netProfit: number;
  threshold: number;
  timestamp: number;
}

export interface ArbitrageData {
  type: 'price_update' | 'balance_update' | 'trade_executed' | 'stats_update' | 'opportunity_found' | 'connection_confirmed';
  timestamp: number;
  data: any;
}

export interface ArbitrageState {
  connected: boolean;
  prices: {
    avalanche: PriceData | null;
    sonic: PriceData | null;
  };
  balances: {
    avalanche: BalanceData | null;
    sonic: BalanceData | null;
  };
  recentTrades: TradeData[];
  stats: StatsData | null;
  opportunities: OpportunityData[];
  portfolioHistory: Array<{
    timestamp: number;
    value: number;
  }>;
}

const WEBSOCKET_URL = 'ws://localhost:8080';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

export const useArbitrageWebSocket = () => {
  const [state, setState] = useState<ArbitrageState>({
    connected: false,
    prices: {
      avalanche: null,
      sonic: null
    },
    balances: {
      avalanche: null,
      sonic: null
    },
    recentTrades: [],
    stats: null,
    opportunities: [],
    portfolioHistory: []
  });

  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      ws.current = new WebSocket(WEBSOCKET_URL);

      ws.current.onopen = () => {
        console.log('WebSocket connected to arbitrage server');
        setState(prev => ({ ...prev, connected: true }));
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const message: ArbitrageData = JSON.parse(event.data);

          setState(prev => {
            const newState = { ...prev };

            switch (message.type) {
              case 'price_update':
                newState.prices = {
                  ...prev.prices,
                  [message.data.chain]: message.data.price
                };
                break;

              case 'balance_update':
                newState.balances = {
                  ...prev.balances,
                  [message.data.chain]: message.data.balance
                };
                break;

              case 'trade_executed':
                newState.recentTrades = [
                  message.data,
                  ...prev.recentTrades.slice(0, 19) // Keep last 20 trades
                ];
                break;

              case 'stats_update':
                newState.stats = message.data;

                // Update portfolio history
                newState.portfolioHistory = [
                  ...prev.portfolioHistory,
                  {
                    timestamp: message.data.timestamp,
                    value: message.data.totalPortfolioValue
                  }
                ].slice(-100); // Keep last 100 data points
                break;

              case 'opportunity_found':
                newState.opportunities = [
                  message.data,
                  ...prev.opportunities.slice(0, 9) // Keep last 10 opportunities
                ];
                break;

              case 'connection_confirmed':
                console.log('WebSocket connection confirmed:', message.data.message);
                break;

              default:
                console.log('Unknown message type:', message.type);
            }

            return newState;
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setState(prev => ({ ...prev, connected: false }));

        // Attempt to reconnect
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current++;
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})...`);

          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, RECONNECT_DELAY);
        } else {
          console.error('Max reconnect attempts reached');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    setState(prev => ({ ...prev, connected: false }));
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Calculate price difference percentage
  const getPriceDifference = useCallback(() => {
    if (!state.prices.avalanche || !state.prices.sonic) {
      return null;
    }

    const avalanchePrice = state.prices.avalanche.tokens0PerToken1;
    const sonicPrice = state.prices.sonic.tokens0PerToken1;

    const priceDiff = Math.abs(avalanchePrice - sonicPrice);
    const percentageDiff = (priceDiff / Math.min(avalanchePrice, sonicPrice)) * 100;

    return {
      absolute: priceDiff,
      percentage: percentageDiff,
      direction: avalanchePrice > sonicPrice ? 'avalanche_higher' : 'sonic_higher'
    };
  }, [state.prices]);

  // Calculate total portfolio value
  const getTotalPortfolioValue = useCallback(() => {
    if (!state.balances.avalanche || !state.balances.sonic) {
      return 0;
    }

    return state.balances.avalanche.total + state.balances.sonic.total;
  }, [state.balances]);

  return {
    ...state,
    connect,
    disconnect,
    getPriceDifference,
    getTotalPortfolioValue
  };
};