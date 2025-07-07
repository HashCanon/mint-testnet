// src/App.tsx
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

function App() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({ connector: injected() });
  const { disconnect } = useDisconnect();

  return (
    <div style={{ padding: 24 }}>
      <h1>Wallet Connect (wagmi)</h1>
      {!isConnected ? (
        <button onClick={() => connect()}>Connect Wallet</button>
      ) : (
        <>
          <div>✅ Connected: {address}</div>
          <button onClick={() => disconnect()}>Disconnect</button>
        </>
      )}
    </div>
  );
}

export default App;
