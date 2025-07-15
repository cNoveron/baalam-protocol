import { useState } from 'react'
import baalamLogo from './assets/baalam.png'
import './App.css'

function App() {
  const [activeService, setActiveService] = useState<string | null>(null)

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

  return (
    <div className="app">
      <header className="header">
        <h1>🏛️ Baalam Fintech</h1>
        <p>Financial Technology Services Dashboard</p>
      </header>

      <div className="logo-section" style={{backgroundColor: '#fdfbf7'}}>
        <img
          src={baalamLogo}
          alt="Baalam Fintech Logo"
          className="baalam-logo"
        />
      </div>

      <main className="main">
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
      </main>
    </div>
  )
}

export default App
