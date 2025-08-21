// comments in English only
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function Header() {
  return (
    <header className="sticky top-0 z-10 w-full bg-background border-b">
      <div className="mx-auto max-w-screen-md px-4 py-3 grid items-center gap-2 grid-cols-1 md:grid-cols-3">
        <div className="hidden md:block" aria-hidden="true" />
        <h1 className="text-center text-3xl font-bold md:col-start-2">HashCanon Mint 2</h1>
        <div className="justify-self-center md:justify-self-end">
          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="full" />
        </div>
      </div>
    </header>
  )
}
