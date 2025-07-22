import { useArbitrageWebSocket } from '../hooks/useArbitrageWebSocket'

interface HomePageProps {
  arbitrageData: ReturnType<typeof useArbitrageWebSocket>
  tradingBotPortfolioData: { labels: string[], data: number[] }
  setDepositType: (type: string) => void
  setActiveNavSection: (section: string) => void
}

export const HomePage = ({
  arbitrageData,
  tradingBotPortfolioData,
  setDepositType,
  setActiveNavSection
}: HomePageProps) => {
  const services = [
    {
      id: 'arbitrage-investment',
      name: 'DeFi Strategy Bots',
      description: 'Take advantage of short term price differences and long term price action across Decentralized Exchanges on different networks. Our automated system identifies and executes profitable opportunities while you sleep, delivering consistent returns with lower risk through market-neutral strategies.',
      status: 'active'
    },
    {
      id: 'trading-bot-investment',
      name: 'CEX Trading Bots',
      description: 'Let our intelligent trading algorithms work for you. Using advanced market analysis and proven strategies, our bot executes trades 24/7 to maximize your returns while managing risk through sophisticated position sizing and risk-reduction mechanisms.',
      status: 'active'
    }
  ]

  return (
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
            <h4>On Chain / DeFi</h4>
            <div className="stat-value">
              ${arbitrageData.getTotalPortfolioValue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="stat-indicator positive">
              {arbitrageData.stats ? `+$${arbitrageData.stats.totalProfit.toFixed(2)}` : '+$0.00'}
            </div>
          </div>
          <div className="stat-card">
            <h4>Off Chain / CeFi</h4>
            <div className="stat-value">${tradingBotPortfolioData.data[tradingBotPortfolioData.data.length - 1].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="stat-indicator positive">+4.1%</div>
          </div>
        </div>
      </section>
    </>
  )
}