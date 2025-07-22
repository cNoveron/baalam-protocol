interface OffChainPageProps {
  setDepositType: (type: string) => void
  setActiveNavSection: (section: string) => void
}

export const OffChainPage = ({ setDepositType, setActiveNavSection }: OffChainPageProps) => {
  const cexServices = [
    {
      id: 'cex-15s',
      name: 'CEX 15 seconds',
      description: 'Let our intelligent trading algorithm work for you. Using advanced market analysis and proven strategies, our bot executes trades 24/7 to maximize your returns while managing risk through sophisticated position sizing and stop-loss mechanisms.',
      status: 'active'
    },
    {
      id: 'cex-1m',
      name: 'CEX 1 minute',
      description: 'Let our intelligent trading algorithm work for you. Using advanced market analysis and proven strategies, our bot executes trades 24/7 to maximize your returns while managing risk through sophisticated position sizing and stop-loss mechanisms.',
      status: 'active'
    },
    {
      id: 'cex-1h',
      name: 'CEX 1 hour',
      description: 'Let our intelligent trading algorithm work for you. Using advanced market analysis and proven strategies, our bot executes trades 24/7 to maximize your returns while managing risk through sophisticated position sizing and stop-loss mechanisms.',
      status: 'active'
    },
    {
      id: 'cex-4h',
      name: 'CEX 4 hours',
      description: 'Let our intelligent trading algorithm work for you. Using advanced market analysis and proven strategies, our bot executes trades 24/7 to maximize your returns while managing risk through sophisticated position sizing and stop-loss mechanisms.',
      status: 'active'
    },
    {
      id: 'cex-1d',
      name: 'CEX 1 day',
      description: 'Let our intelligent trading algorithm work for you. Using advanced market analysis and proven strategies, our bot executes trades 24/7 to maximize your returns while managing risk through sophisticated position sizing and stop-loss mechanisms.',
      status: 'active'
    },
    {
      id: 'cex-1w',
      name: 'CEX 1 week',
      description: 'Let our intelligent trading algorithm work for you. Using advanced market analysis and proven strategies, our bot executes trades 24/7 to maximize your returns while managing risk through sophisticated position sizing and stop-loss mechanisms.',
      status: 'active'
    }
  ]

  return (
    <>
      <section className="services-grid">
        <h2>Off Chain Trading Bots</h2>
        <div className="grid">
          {cexServices.map((service) => (
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
                    setDepositType('mxn')
                    setActiveNavSection('deposit')
                  }}
                >
                  Deposit MXN
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}