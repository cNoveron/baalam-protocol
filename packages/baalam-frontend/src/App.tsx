import { useState } from 'react'
import baalamLogo from './assets/baalam.png'
import './App.css'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useArbitrageWebSocket } from './hooks/useArbitrageWebSocket'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

function App() {
  const [activeNavSection, setActiveNavSection] = useState<string>('home')
  const [depositType, setDepositType] = useState<string>('mxnb') // 'mxnb' or 'mxn'

  // WebSocket connection for real-time arbitrage data
  const arbitrageData = useArbitrageWebSocket()

  // Portfolio evolution data
  const generatePortfolioData = (baseValue: number, volatility: number = 0.05) => {
    const labels = []
    const data = []
    const now = new Date()

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))

      // Generate realistic portfolio evolution with some randomness
      const trend = i < 15 ? 1.002 : 0.998 // Slight upward trend recently
      const randomFactor = 1 + (Math.random() - 0.5) * volatility
      const value = baseValue * Math.pow(trend, 30 - i) * randomFactor
      data.push(value)
    }

    return { labels, data }
  }

  const arbitragePortfolioData = generatePortfolioData(25000, 0.03)
  const tradingBotPortfolioData = generatePortfolioData(28000, 0.08)

  const createChartData = (portfolioData: { labels: string[], data: number[] }, color: string) => ({
    labels: portfolioData.labels,
    datasets: [
      {
        label: 'Portfolio Value',
        data: portfolioData.data,
        borderColor: color,
        backgroundColor: `${color}20`,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
      },
    ],
  })

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#3a1c2a',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: { parsed: { y: number } }) => `$${context.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 12,
          },
          maxTicksLimit: 6,
        },
      },
      y: {
        display: true,
        grid: {
          color: '#e2e8f0',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 12,
          },
          callback: (value: string | number) => `$${Number(value).toLocaleString()}`,
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
      console.log('Copied to clipboard:', text)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const services = [
    {
      id: 'arbitrage-investment',
      name: 'DeFi Arbitrage',
      description: 'Take advantage of price differences across Decentralized Exchanges on Ethereum Mainnet and Arbitrum networks. Our automated system identifies and executes profitable opportunities while you sleep, delivering consistent returns with lower risk through market-neutral strategies.',
      status: 'active'
    },
    {
      id: 'trading-bot-investment',
      name: 'AI Trading Bot',
      description: 'Let our intelligent trading algorithm work for you. Using advanced market analysis and proven strategies, our bot executes trades 24/7 to maximize your returns while managing risk through sophisticated position sizing and stop-loss mechanisms.',
      status: 'active'
    }
  ]

  const navigationSections = [
    { id: 'home', label: 'Home' },
    { id: 'deposit', label: 'Deposit' },
    { id: 'arbitrage', label: 'Arbitrage' },
    { id: 'trading-bot', label: 'Trading Bot' }
  ]

  const renderHomePage = () => (
    <>
      <section className="services-grid">
        <h2>Services</h2>
        <div className="grid">
          {services.map((service) => (
            <div
              key={service.id}
              className="service-card"
            >
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <div className="service-footer">
                <span className={`status ${service.status}`}>
                  {service.status}
                </span>
                <button
                  className="btn-primary service-btn"
                  onClick={() => {
                    setDepositType(service.id === 'arbitrage-investment' ? 'mxnb' : 'mxn')
                    setActiveNavSection('deposit')
                  }}
                >
                  {service.id === 'arbitrage-investment' ? 'Get MXNB' : 'Deposit MXN'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="stats">
        <h2>Portfolio Overview</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Total Portfolio</h4>
            <div className="stat-value">
              ${(arbitrageData.getTotalPortfolioValue() + tradingBotPortfolioData.data[tradingBotPortfolioData.data.length - 1]).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="stat-indicator positive">
              {arbitrageData.connected ? '🟢 Live' : '🔴 Offline'}
            </div>
          </div>
          <div className="stat-card">
            <h4>Arbitrage</h4>
            <div className="stat-value">
              ${arbitrageData.getTotalPortfolioValue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="stat-indicator positive">
              {arbitrageData.stats ? `+$${arbitrageData.stats.totalProfit.toFixed(2)}` : '+$0.00'}
            </div>
          </div>
          <div className="stat-card">
            <h4>Trading Bot</h4>
            <div className="stat-value">${tradingBotPortfolioData.data[tradingBotPortfolioData.data.length - 1].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="stat-indicator positive">+4.1%</div>
          </div>
        </div>
      </section>
    </>
  )

  const renderArbitragePage = () => {
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

  const renderTradingBotPage = () => (
    <div className="trading-bot-layout">
      <div className="trading-bot-main">
        <div className="trading-bot-panel">
          <div className="panel-header">
            <h3>Trading Bot Portfolio Evolution</h3>
            <div className="panel-stats">
              <span className="current-value">
                ${tradingBotPortfolioData.data[tradingBotPortfolioData.data.length - 1].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="change-indicator positive">+4.1%</span>
            </div>
          </div>
          <div className="chart-container">
            <Line
              data={createChartData(tradingBotPortfolioData, '#7f581e')}
              options={chartOptions}
            />
          </div>
        </div>
      </div>

      <div className="trading-bot-sidebar">
        <div className="portfolio-section">
          <h3>Portfolio</h3>

          <div className="balance-item">
            <label>MXNB in Portfolio</label>
            <div className="balance-value">$25,430.50</div>
          </div>

          <div className="balance-item">
            <label>MXNB in Trading Bot</label>
            <div className="balance-value">$12,875.25</div>
          </div>

          <div className="action-buttons">
            <button className="btn-primary">Deposit</button>
            <button className="btn-secondary">Withdraw</button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderDepositPage = () => {
    const bankDetails = {
      mxnb: {
        clabe: '710969000000411457',
        description: 'Once we receive the funds, we will credit your account with the corresponding MXNB.'
      },
      mxn: {
        clabe: '713769945002411258',
        description: 'Once we receive the funds, we will credit your account with MXN for trading bot operations.'
      }
    }

    const currentDetails = bankDetails[depositType as keyof typeof bankDetails]

    return (
      <div className="deposit-page">
        <div className="deposit-header">
          <h1>Transfer Money</h1>
          <p>Initiate a fund transfer to the bank account details listed below. {currentDetails.description}</p>
        </div>

        <div className="deposit-type-toggle">
          <button
            className={`toggle-btn ${depositType === 'mxnb' ? 'active' : ''}`}
            onClick={() => setDepositType('mxnb')}
          >
            Get MXNB
          </button>
          <button
            className={`toggle-btn ${depositType === 'mxn' ? 'active' : ''}`}
            onClick={() => setDepositType('mxn')}
          >
            Deposit MXN
          </button>
        </div>

        <div className="deposit-limits">
        <div className="limit-row">
          <span className="limit-label">Monthly fiat deposit limit:</span>
          <span className="limit-value">$0.00 / $1,000,000.00</span>
        </div>
        <div className="limit-row">
          <span className="limit-label">Remaining limit:</span>
          <span className="limit-value highlight">$1,000,000.00</span>
        </div>
      </div>

      <div className="deposit-info">
        <div className="info-item">
          <span className="info-icon">💡</span>
          <span>If you would like to deposit more, you can submit a <a href="#" className="info-link">limit increase request</a>.</span>
        </div>

        <div className="info-item">
          <span className="info-icon">⬇️</span>
          <span>The minimum deposit is $101 MXN. Any amount below this will be returned.</span>
        </div>
      </div>

      <div className="bank-details">
        <div className="bank-field">
          <label>Bank Name</label>
          <div className="field-value">
            <span>Nvio</span>
            <button className="copy-btn" aria-label="Copy bank name" onClick={() => copyToClipboard('Nvio')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        </div>

        <div className="bank-field">
          <label>Beneficiary</label>
          <div className="field-value">
            <span>Baalam Fintech</span>
            <button className="copy-btn" aria-label="Copy beneficiary name" onClick={() => copyToClipboard('Baalam Fintech')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        </div>

        <div className="bank-field">
          <label>CLABE</label>
          <div className="field-value">
            <span>{currentDetails.clabe}</span>
            <button className="copy-btn" aria-label="Copy CLABE" onClick={() => copyToClipboard(currentDetails.clabe)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="deposit-actions">
        <button className="btn-secondary btn-back">Back</button>
        <button className="btn-primary btn-done" onClick={() => setActiveNavSection('home')}>Done</button>
      </div>
    </div>
  )
}

  const renderCurrentPage = () => {
    switch (activeNavSection) {
      case 'arbitrage':
        return renderArbitragePage()
      case 'deposit':
        return renderDepositPage()
      case 'trading-bot':
        return renderTradingBotPage()
      default:
        return renderHomePage()
    }
  }

  return (
    <div className="app">
      <header className="header">
        <nav className="header-nav">
          {navigationSections.map((section) => (
            <button
              key={section.id}
              className={`nav-button ${activeNavSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveNavSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="logo-section" style={{backgroundColor: '#fdfbf7'}}>
        <img
          src={baalamLogo}
          alt="Baalam Fintech Logo"
          className="baalam-logo"
        />
      </div>

      <main className="main">
        {renderCurrentPage()}
      </main>
    </div>
  )
}

export default App
