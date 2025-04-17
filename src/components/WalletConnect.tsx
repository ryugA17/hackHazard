import React from 'react';
import { useAccount, useConnect, useDisconnect, useNetwork, useSwitchNetwork } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';

// Define Window with ethereum extension for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Monad Testnet Chain info
const monadTestnetChain = {
  chainId: '0x279f', // 10143 in hex
  chainName: 'Monad Testnet',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MONAD',
    decimals: 18
  },
  rpcUrls: ['https://testnet-rpc.monad.xyz'],
  blockExplorerUrls: ['https://testnet.explorer.monad.xyz']
};

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, error: connectError, isLoading, isSuccess } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const { switchNetwork, error: switchError } = useSwitchNetwork();
  
  const [connectClicked, setConnectClicked] = React.useState(false);
  const [noMetaMask, setNoMetaMask] = React.useState(false);
  const [showAddNetwork, setShowAddNetwork] = React.useState(false);
  const [connectionStatus, setConnectionStatus] = React.useState<string>('');
  const [connectionError, setConnectionError] = React.useState<string>('');

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Check if MetaMask is installed on component mount
  React.useEffect(() => {
    // Check for window.ethereum
    if (typeof window !== 'undefined') {
      if (!window.ethereum) {
        setNoMetaMask(true);
        console.warn('MetaMask not detected');
      } else {
        console.log('MetaMask detected:', window.ethereum);
        
        // Check if we're on the right network
        if (window.ethereum.chainId && window.ethereum.chainId !== '0x279f') {
          console.log('Not on Monad network. Current chain:', window.ethereum.chainId);
          setShowAddNetwork(true);
        }
      }
    }
  }, []);

  // Log connection status changes for debugging
  React.useEffect(() => {
    if (connectError) {
      const errorMsg = connectError.message || 'Unknown connection error';
      console.error('Wallet connection error:', errorMsg);
      
      // Simplify error message for display
      let displayError = 'Connection failed';
      if (errorMsg.includes('rejected')) {
        displayError = 'Request rejected';
      } else if (errorMsg.includes('network') || errorMsg.includes('chain')) {
        displayError = 'Wrong network';
      }
      
      setConnectionError(displayError);
      setConnectClicked(false);
      
      // If the error is related to wrong network, show add network button
      if (errorMsg && 
          (errorMsg.includes('network') || 
           errorMsg.includes('chain') || 
           errorMsg.includes('id'))) {
        setShowAddNetwork(true);
      }
    } else {
      setConnectionError('');
    }
    
    if (switchError) {
      console.error('Network switch error:', switchError);
      setConnectionError('Network switch failed');
    }
    
    if (isSuccess) {
      console.log('Wallet connected successfully');
      setConnectClicked(false);
      setShowAddNetwork(false);
      setConnectionStatus('');
    }
  }, [connectError, switchError, isSuccess]);

  // Watch for account and chain changes
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        console.log('Accounts changed:', accounts);
        // Force page refresh to ensure all components update properly
        if (accounts.length === 0) {
          window.location.reload();
        }
      };
      
      const handleChainChanged = (chainId: string) => {
        console.log('Chain changed:', chainId);
        // Force page refresh to ensure all components update properly
        window.location.reload();
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const handleConnect = async () => {
    console.log('Connect button clicked');
    setConnectClicked(true);
    setConnectionStatus('Connecting...');
    setConnectionError('');
    
    // Check if MetaMask is installed
    if (typeof window !== 'undefined' && typeof window.ethereum === 'undefined') {
      console.error('MetaMask is not installed');
      setConnectionError('MetaMask not found');
      setConnectClicked(false);
      setNoMetaMask(true);
      return;
    }

    try {
      // First request accounts to ensure we have permission
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Check if we're on Monad network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (chainId !== '0x279f') {
        setConnectionStatus('Switching...');
        await addMonadNetwork();
      }
      
      // Now connect with wagmi
      connect();
    } catch (err: any) {
      console.error('Connection attempt error:', err);
      
      // Simplify error message
      let displayError = 'Connection failed';
      if (err.message) {
        if (err.message.includes('reject')) {
          displayError = 'Request rejected';
          setShowAddNetwork(false);
        } else if (err.message.includes('network') || 
                  err.message.includes('chain') || 
                  err.message.includes('id')) {
          displayError = 'Wrong network';
          setShowAddNetwork(true);
        }
      }
      
      setConnectionError(displayError);
      setConnectClicked(false);
      setConnectionStatus('');
    }
  };

  const addMonadNetwork = async () => {
    if (!window.ethereum) {
      return;
    }
    
    console.log('Attempting to add Monad Testnet to MetaMask');
    
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [monadTestnetChain],
      });
      console.log('Monad Testnet added successfully!');
      
      // Wait a moment for MetaMask to process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to connect again after adding network
      connect();
    } catch (error: any) {
      console.error('Error adding Monad Testnet to MetaMask:', error);
      setConnectionError('Network add failed');
    }
  };

  const openMetaMaskWebsite = () => {
    window.open('https://metamask.io/download/', '_blank');
  };

  if (isConnected && address)
    return (
      <div className="wallet-status">
        <div className="wallet-address">
          <div className="connection-indicator"></div>
          <span className="address-text">{formatAddress(address)}</span>
        </div>
        {chain && (
          <span className="chain-name">{chain.name || `Chain ID: ${chain.id}`}</span>
        )}
        <button 
          onClick={() => disconnect()}
          className="disconnect-button"
        >
          Disconnect
        </button>
      </div>
    );

  if (noMetaMask) {
    return (
      <button 
        onClick={openMetaMaskWebsite}
        className="wallet-connect-button install-metamask"
      >
        Install MetaMask
      </button>
    );
  }

  if (showAddNetwork && !connectClicked) {
    return (
      <button 
        onClick={addMonadNetwork}
        className="wallet-connect-button add-network"
      >
        Add Monad
      </button>
    );
  }

  return (
    <div className="wallet-connect-container">
      <button 
        onClick={handleConnect}
        className={`wallet-connect-button ${isLoading || connectClicked ? 'connecting' : ''}`}
        disabled={isLoading || connectClicked}
      >
        {connectionStatus || 'Connect'}
      </button>
      
      {connectionError && (
        <div className="connection-error">
          {connectionError}
        </div>
      )}
    </div>
  );
}
