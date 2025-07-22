interface OnChainPageProps {
  setDepositType: (type: string) => void
  setActiveNavSection: (section: string) => void
}

export const OnChainPage = ({ setDepositType, setActiveNavSection }: OnChainPageProps) => {
  const onChainServices = [
    {
      id: 'arbitrage',
      name: 'Arbitrage',
      description: 'Take advantage of price differences across Decentralized Exchanges on Ethereum Mainnet and Arbitrum networks. Our automated system identifies and executes profitable opportunities while you sleep, delivering consistent returns with lower risk through market-neutral strategies.',
      status: 'active'
    },
    {
      id: 'lending',
      name: 'Lending',
      description: 'Earn passive income by lending your digital assets to borrowers on decentralized lending protocols. Our smart contract integration automatically finds the best lending rates across multiple DeFi platforms to maximize your returns.',
      status: 'active'
    },
    {
      id: 'liquidity-provision',
      name: 'Liquidity Provision',
      description: 'Provide liquidity to decentralized exchanges and earn trading fees plus liquidity mining rewards. Our automated liquidity management strategies optimize your positions across multiple pools for maximum yield.',
      status: 'active'
    },
    {
      id: 'borrow-leveraged-trading',
      name: 'Borrow-Leveraged Trading',
      description: 'Access leveraged trading opportunities by borrowing against your crypto assets. Our risk management system automatically monitors your positions and executes trades to maximize profits while maintaining safe collateral ratios.',
      status: 'active'
    }
  ]

  return (
    <>
      <section className="services-grid">
        <h2>On Chain DeFi Services</h2>
        <div className="grid">
          {onChainServices.map((service) => (
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
                    if (service.id === 'arbitrage') {
                      setActiveNavSection('arbitrage-detail')
                    } else {
                      setDepositType('mxnb')
                      setActiveNavSection('deposit')
                    }
                  }}
                >
                  {service.id === 'arbitrage' ? 'View Details' : 'Get MXNB'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}