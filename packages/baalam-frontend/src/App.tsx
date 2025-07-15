import { useState } from 'react'
import baalamLogo from './assets/baalam.png'
import './App.css'

function App() {
  const [activeService, setActiveService] = useState<string | null>(null)
  const [activeNavSection, setActiveNavSection] = useState<string>('home')

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

  const renderTradingBotPage = () => (
    <div className="trading-bot-layout">
      <div className="trading-bot-main">
        <div className="trading-bot-panel">
          {/* Empty rectangular panel for arbitrage content */}
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

  const renderDepositPage = () => (
    <div className="deposit-page">
      <div className="deposit-header">
        <h1>Transfer Money</h1>
        <p>Initiate a fund transfer to the bank account details listed below. Once we receive the funds, we will credit your account with the corresponding MXNB.</p>
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
            <span>710969000000411457</span>
            <button className="copy-btn" aria-label="Copy CLABE" onClick={() => copyToClipboard('710969000000411457')}>
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
