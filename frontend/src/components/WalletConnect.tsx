import {
  TonConnectButton,
  useTonAddress,
  useTonConnectUI,
  useTonWallet,
  useIsConnectionRestored,
} from '@tonconnect/ui-react';
import { useEffect, useState } from 'react';
import { WalletService } from '../services/contractService';
import './WalletConnect.css';

const WalletConnect: React.FC = () => {
  const address = useTonAddress();
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const connectionRestored = useIsConnectionRestored();
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [balanceRequested, setBalanceRequested] = useState(false);

  const handleDisconnect = async () => {
    try {
      await tonConnectUI.disconnect();
      // 清空餘額資訊
      setBalance(null);
      setBalanceError(null);
      setBalanceRequested(false);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  // 獲取錢包餘額
  const fetchBalance = async (walletAddress: string) => {
    if (!walletAddress) return;

    setBalanceLoading(true);
    setBalanceError(null);
    setBalanceRequested(true);

    try {
      const walletBalance = await WalletService.getWalletBalance(walletAddress);

      setBalance(walletBalance);
    } catch (error) {
      console.error('獲取餘額失敗:', error);
      setBalanceError('無法獲取餘額');
    } finally {
      setBalanceLoading(false);
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  // 監聽錢包狀態變化
  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      if (wallet) {
        setIsConnecting(false);
        console.log('錢包已連接:', wallet);
      } else {
        setIsConnecting(false);
        setBalance(null);
        setBalanceError(null);
        setBalanceRequested(false);
        console.log('錢包已斷開');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [tonConnectUI]);

  if (!connectionRestored) {
    return (
      <div className="wallet-connect">
        <div className="loading">
          <span>正在恢復連接...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      <h3>💰 錢包連接功能</h3>

      <div className="wallet-status">
        {address ? (
          <div className="wallet-connected">
            <div className="wallet-info">
              <div className="wallet-address">
                <span className="label">錢包地址:</span>
                <span className="address" title={address}>
                  {formatAddress(address)}
                </span>
              </div>

              <div className="wallet-balance">
                <span className="label">TON 餘額:</span>
                {!balanceRequested ? (
                  <button
                    className="show-balance-btn"
                    onClick={() => fetchBalance(address)}
                    disabled={balanceLoading}
                    title="點擊顯示餘額"
                  >
                    {balanceLoading ? '載入中...' : '顯示金額'}
                  </button>
                ) : (
                  <>
                    <span className="balance">
                      {balanceLoading ? (
                        <span className="loading-text">載入中...</span>
                      ) : balanceError ? (
                        <span className="error-text">{balanceError}</span>
                      ) : (
                        WalletService.formatTON(balance)
                      )}
                    </span>
                    {!balanceLoading && (
                      <button
                        className="refresh-btn"
                        onClick={() => fetchBalance(address)}
                        title="刷新餘額"
                      >
                        ↻
                      </button>
                    )}
                  </>
                )}
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
            <button className="disconnect-btn" onClick={handleDisconnect}>
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
  );
};

export default WalletConnect;
