import { useState } from 'react'
import baalamLogo from './assets/baalam.png'
import './App.css'

function App() {
  const [activeService, setActiveService] = useState<string | null>(null)
  const [activeNavSection, setActiveNavSection] = useState<string>('home')

  const services = [
    {
      id: 'spei-deposits',
      name: 'SPEI Deposits',
      description: 'Mexican SPEI deposit processing service',
      status: 'active',
      endpoint: '/api/spei/deposits'
    },
    {
      id: 'cross-chain-arbitrage',
      name: 'Cross-Chain Arbitrage',
      description: 'Automated arbitrage between Avalanche and Sonic networks',
      status: 'monitoring',
      endpoint: '/api/arbitrage'
    },
    {
      id: 'tradingview-webhooks',
      name: 'TradingView Webhooks',
      description: 'Automated trading with TradingView alerts',
      status: 'ready',
      endpoint: '/api/webhooks'
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
              className={`service-card ${activeService === service.id ? 'active' : ''}`}
              onClick={() => setActiveService(activeService === service.id ? null : service.id)}
            >
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <div className="service-footer">
                <span className={`status ${service.status}`}>
                  {service.status}
                </span>
                <code>{service.endpoint}</code>
              </div>
            </div>
          ))}
        </div>
      </section>

      {activeService && (
        <section className="service-details">
          <h3>Service Details: {services.find(s => s.id === activeService)?.name}</h3>
          <div className="details-content">
            <p>Detailed monitoring and configuration for this service would appear here.</p>
            <button className="btn-primary">Configure Service</button>
            <button className="btn-secondary">View Logs</button>
          </div>
        </section>
      )}

      <section className="stats">
        <h2>System Status</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Active Services</h4>
            <div className="stat-value">3</div>
          </div>
          <div className="stat-card">
            <h4>Total Transactions</h4>
            <div className="stat-value">1,247</div>
          </div>
          <div className="stat-card">
            <h4>System Uptime</h4>
            <div className="stat-value">99.9%</div>
          </div>
        </div>
      </section>
    </>
  )

  const renderArbitragePage = () => (
    <div className="arbitrage-layout">
      <div className="arbitrage-main">
        <div className="arbitrage-panel">
          {/* Empty rectangular panel for arbitrage content */}
        </div>
      </div>

      <div className="arbitrage-sidebar">
        <div className="portfolio-section">
          <h3>Portfolio</h3>

          <div className="balance-item">
            <label>MXNB in Portfolio</label>
            <div className="balance-value">$25,430.50</div>
          </div>

          <div className="balance-item">
            <label>MXNB in Arbitrage</label>
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

  const renderCurrentPage = () => {
    switch (activeNavSection) {
      case 'arbitrage':
        return renderArbitragePage()
      case 'deposit':
        return <div className="page-placeholder">Deposit Page - Coming Soon</div>
      case 'trading-bot':
        return <div className="page-placeholder">Trading Bot Page - Coming Soon</div>
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
