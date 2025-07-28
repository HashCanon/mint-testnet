interface HeaderProps {
    chainName?: string
  }
  
  export function Header({ chainName }: HeaderProps) {
    return (
      <div id="title">
        <div>HashJing Mint</div>
        <div className="net-label">{chainName ?? 'No network'}</div>
      </div>
    )
  }
  