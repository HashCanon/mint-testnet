interface WalletInfoProps {
    isConnected: boolean
    address?: string
    chainName?: string
    networkOk: boolean
  }
  
  export function WalletInfo({ isConnected, address, chainName, networkOk }: WalletInfoProps) {
    return isConnected && address ? (
      <p className="status">
        Wallet: {address.slice(0, 6)}…{address.slice(-4)} (
        {networkOk ? `${chainName} ✅` : 'Wrong network ❌'})
      </p>
    ) : (
      <p className="status">Please connect wallet ↑</p>
    )
  }
  