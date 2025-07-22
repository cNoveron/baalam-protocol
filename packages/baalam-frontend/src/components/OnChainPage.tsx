import { Line } from 'react-chartjs-2'
import { useArbitrageWebSocket } from '../hooks/useArbitrageWebSocket'

interface OnChainPageProps {
  arbitrageData: ReturnType<typeof useArbitrageWebSocket>
  arbitragePortfolioData: { labels: string[], data: number[] }
  createChartData: (portfolioData: { labels: string[], data: number[] }, color: string) => any
  chartOptions: any
}

export const OnChainPage = ({
  arbitrageData,
  arbitragePortfolioData,
  createChartData,
  chartOptions
}: OnChainPageProps) => {
  const totalPortfolioValue = arbitrageData.getTotalPortfolioValue();
  const priceDiff = arbitrageData.getPriceDifference();

  // Chain name mapping for display
  const getChainDisplayName = (chainKey: string) => {
    switch (chainKey) {
      case 'avalanche':
        return 'Ethereum Mainnet';
      case 'sonic':
        return 'Arbitrum';
      default:
        return chainKey;
    }
  };

  // Create chart data from real-time portfolio history
  const portfolioChartData = arbitrageData.portfolioHistory.length > 0 ? {
    labels: arbitrageData.portfolioHistory.map(point =>
      new Date(point.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    ),
    data: arbitrageData.portfolioHistory.map(point => point.value)
  } : arbitragePortfolioData; // Fallback to mock data

  return (
    <div className="arbitrage-layout">
      <div className="arbitrage-main">
        <div className="arbitrage-panel">
          <div className="panel-header">
            <h3>
              Arbitrage Portfolio Evolution
              <span className={`connection-indicator ${arbitrageData.connected ? 'connected' : 'disconnected'}`}>
                {arbitrageData.connected ? '🟢' : '🔴'}
              </span>
            </h3>
            <div className="panel-stats">
              <span className="current-value">
                ${totalPortfolioValue > 0 ? totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </span>
              <span className="change-indicator positive">
                {arbitrageData.stats ? `+${arbitrageData.stats.totalProfit.toFixed(2)}` : '+0.00'}
              </span>
            </div>
          </div>
          <div className="chart-container">
            <Line
              data={createChartData(portfolioChartData, '#3a1c2a')}
              options={chartOptions}
            />
          </div>
        </div>
      </div>

      <div className="arbitrage-sidebar">
        <div className="portfolio-section">
          <h3>Portfolio</h3>

          <div className="balance-item">
            <label>Ethereum Mainnet Balance</label>
            <div className="balance-value">
              ${arbitrageData.balances.avalanche ? arbitrageData.balances.avalanche.total.toFixed(2) : '0.00'}
            </div>
            <div className="balance-detail">
              MXNB: {arbitrageData.balances.avalanche ? arbitrageData.balances.avalanche.usdc.toFixed(2) : '0.00'} |
              USDT: {arbitrageData.balances.avalanche ? arbitrageData.balances.avalanche.usdt.toFixed(2) : '0.00'}
            </div>
          </div>

          <div className="balance-item">
            <label>Arbitrum Balance</label>
            <div className="balance-value">
              ${arbitrageData.balances.sonic ? arbitrageData.balances.sonic.total.toFixed(2) : '0.00'}
            </div>
            <div className="balance-detail">
              MXNB: {arbitrageData.balances.sonic ? arbitrageData.balances.sonic.usdc.toFixed(2) : '0.00'} |
              USDT: {arbitrageData.balances.sonic ? arbitrageData.balances.sonic.usdt.toFixed(2) : '0.00'}
            </div>
          </div>

          <div className="price-diff-section">
            <h4>Price Difference</h4>
            {priceDiff ? (
              <div className="price-diff">
                <span className="percentage">{priceDiff.percentage.toFixed(4)}%</span>
                <span className="direction">{priceDiff.direction === 'avalanche_higher' ? '↑ ETH' : '↓ ARB'}</span>
              </div>
            ) : (
              <span className="no-data">No price data</span>
            )}
          </div>

          <div className="stats-section">
            <h4>Trading Stats</h4>
            {arbitrageData.stats ? (
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Total Trades</span>
                  <span className="stat-value">{arbitrageData.stats.totalTrades}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Win Rate</span>
                  <span className="stat-value">{arbitrageData.stats.winRate.toFixed(1)}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Profit</span>
                  <span className="stat-value">${arbitrageData.stats.totalProfit.toFixed(4)}</span>
                </div>
              </div>
            ) : (
              <span className="no-data">No stats data</span>
            )}
          </div>

          <div className="recent-trades-section">
            <h4>Recent Trades</h4>
            {arbitrageData.recentTrades.length > 0 ? (
              <div className="trades-list">
                {arbitrageData.recentTrades.slice(0, 5).map((trade, index) => (
                  <div key={index} className="trade-item">
                    <div className="trade-header">
                      <span className="trade-type">{trade.type.replace('USDC_TARGETED', 'MXNB_TARGETED')}</span>
                      <span className="trade-timestamp">
                        {new Date(trade.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="trade-details">
                      <span className="trade-route">{getChainDisplayName(trade.sourceChain)} → {getChainDisplayName(trade.targetChain)}</span>
                      <span className={`trade-profit ${trade.netProfit > 0 ? 'positive' : 'negative'}`}>
                        ${trade.netProfit.toFixed(4)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span className="no-data">No recent trades</span>
            )}
          </div>

          <div className="action-buttons">
            <button className="btn-primary">Deposit</button>
            <button className="btn-secondary">Withdraw</button>
          </div>
        </div>
      </div>
    </div>
  );
}