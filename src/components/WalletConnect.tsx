import React from 'react';
import { useAccount, useConnect, useDisconnect, useNetwork } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (isConnected)
    return (
      <div className="wallet-status">
        <div className="wallet-address">
          <div className="connection-indicator"></div>
          <span className="address-text">{formatAddress(address!)}</span>
        </div>
        {chain && (
          <span className="chain-name">{chain.name}</span>
        )}
        <button 
          onClick={() => disconnect()}
          className="disconnect-button"
        >
          Disconnect
        </button>
      </div>
    );

  return (
    <button 
      onClick={() => connect()}
      className="wallet-connect-button"
    >
      Connect
    </button>
  );
}
