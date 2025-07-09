// src/App.tsx
import { useAccount } from 'wagmi'

export default function App() {
  const { address, isConnected } = useAccount()

  return (
    <div className="mint-wrapper">
      {isConnected ? (
        <p>Wallet: {address}</p>
      ) : (
        <p>Please connect wallet ↑</p>
      )}
      {/* mint / read / write logic here */}
    </div>
  )
}
