
import { TonConnectButton, useTonAddress, useTonConnectUI, useTonWallet, useIsConnectionRestored } from '@tonconnect/ui-react'
import { useEffect, useState } from 'react'
import './WalletConnect.css'

const WalletConnect: React.FC = () => {
  const address = useTonAddress()
  const wallet = useTonWallet()
  const [tonConnectUI] = useTonConnectUI()
  const connectionRestored = useIsConnectionRestored()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleDisconnect = async () => {
    try {
      await tonConnectUI.disconnect()
    } catch (error) {
      console.error('Disconnect error:', error)
    }
  }

  const formatAddress = (addr: string) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`
  }

  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      if (wallet) {
        setIsConnecting(false)
        console.log('錢包已連接:', wallet)
      } else {
        setIsConnecting(false)
        console.log('錢包已斷開')
      }
    })

    return () => {
      unsubscribe()
    }
  }, [tonConnectUI])

  if (!connectionRestored) {
    return (
      <div className="wallet-connect">
        <div className="loading">
          <span>正在恢復連接...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="wallet-connect">
      <div className="wallet-status">
        {address ? (
          <div className="wallet-connected">
            <div className="wallet-info">
              <div className="wallet-address">
                <span className="label">錢包地址:</span>
                <span className="address">{formatAddress(address)}</span>
              </div>
              {wallet && (
                <div className="wallet-details">
                  <span className="wallet-name">{wallet.device.appName}</span>
                  <span className="device-name">{wallet.provider}</span>
                </div>
              )}
              <div className="connection-status">
                <span className="status-indicator connected"></span>
                <span className="status-text">已連接</span>
              </div>
            </div>
            <button 
              className="disconnect-btn"
              onClick={handleDisconnect}
            >
              斷開連接
            </button>
          </div>
        ) : (
          <div className="wallet-disconnected">
            <div className="connection-status">
              <span className="status-indicator disconnected"></span>
              <span className="status-text">未連接</span>
            </div>
            <p className="connect-prompt">請連接您的 TON 錢包以參與抽獎</p>
          </div>
        )}
      </div>
      
      <div className="connect-button-container">
        <TonConnectButton />
      </div>
      
      {isConnecting && (
        <div className="connecting-overlay">
          <span>正在連接錢包...</span>
        </div>
      )}
    </div>
  )
}

export default WalletConnect