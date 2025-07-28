interface StatusPanelProps {
    totalMinted: number | null
    totalCap: number
    priceLabel: string
    networkOk: boolean
    contractUrl?: string
    contractShort?: string
  }
  
  export function StatusPanel({
    totalMinted,
    totalCap,
    priceLabel,
    networkOk,
    contractUrl,
    contractShort,
  }: StatusPanelProps) {
    return (
      <div className="status">
        <p>
          Status:{' '}
          {totalMinted !== null ? `${totalMinted} / ${totalCap} minted` : `__ / ${totalCap} minted`}
        </p>
        <p>Price: {priceLabel}</p>
        {networkOk && contractUrl && (
          <p>
            Contract:{' '}
            <a href={contractUrl} target="_blank" rel="noopener noreferrer">
              {contractShort}
            </a>
          </p>
        )}
      </div>
    )
  }
  