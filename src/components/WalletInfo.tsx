// src/components/WalletInfo.tsx
import { Badge } from '@/components/ui/badge'
import { sepolia } from 'wagmi/chains'

interface WalletInfoProps {
  isConnected: boolean
  chainId?: number
}

export function WalletInfo({ isConnected, chainId }: WalletInfoProps) {
  // No explicit hint when not connected — ConnectButton handles this.
  if (!isConnected) return null

  const isSepolia = chainId === sepolia.id
  if (!isSepolia) return null

  return (
    <div className="status flex justify-center">
      <Badge
        // Paint in Sepolia-like violet
        variant="secondary"
        className="bg-violet-600 text-white border-transparent"
      >
        Sepolia Testnet
      </Badge>
    </div>
  )
}
