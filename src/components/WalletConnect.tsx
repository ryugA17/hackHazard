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
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="font-mono">{formatAddress(address!)}</span>
        </div>
        {chain && (
          <span className="text-sm text-gray-400">{chain.name}</span>
        )}
        <button 
          onClick={() => disconnect()}
          className="text-red-500 hover:text-red-600 text-sm"
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
