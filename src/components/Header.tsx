interface HeaderProps {
    chainName?: string
  }
  
  export function Header({ chainName }: HeaderProps) {
    return (
      <div>
        <div className="sticky top-0 z-10 w-full py-3 text-center text-3xl font-bold bg-background border-b border-gray-300">
          HashJing Mint
        </div>
        <div className="space-y-4 mt-8 mx-auto max-w-screen-md px-4 space-y-8">{chainName ?? 'No network'}</div>
      </div>
    )
  }
  