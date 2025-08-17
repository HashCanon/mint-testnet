// src/components/Header.tsx
import { ConnectButton } from '@rainbow-me/rainbowkit'

interface HeaderProps {
  chainName?: string
}

export function Header({ chainName }: HeaderProps) {
  return (
    <div>
      {/* sticky header bar with centered title */}
      <div className="sticky top-0 z-10 w-full bg-background border-b border-gray-300">
        <div className="relative py-3">
          <h1 className="text-center text-3xl font-bold">HashCanon Mint</h1>
          {/* place wallet button without affecting centered title */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <ConnectButton
              showBalance={false}
              chainStatus="icon" // compact on mobile
              accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
            />
          </div>
        </div>
      </div>

      {/* optional chain name line */}
      <div className="mt-8 mx-auto max-w-screen-md px-4 space-y-8">
        {chainName ?? 'No network'}
      </div>
    </div>
  )
}
