import React, { useState } from 'react';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import './JoinLottery.css';

interface JoinLotteryProps {
  contractAddress: string;
  entryFee: string;
  maxParticipants: number;
  currentParticipants: number;
  lotteryActive: boolean;
  onJoinSuccess?: () => void;
}

const JoinLottery: React.FC<JoinLotteryProps> = ({
  contractAddress,
  entryFee,
  maxParticipants,
  currentParticipants,
  lotteryActive,
  onJoinSuccess,
}) => {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 檢查用戶是否已連接錢包
  const isWalletConnected = !!address;

  // 檢查是否可以參加
  const canJoin =
    isWalletConnected && lotteryActive && currentParticipants < maxParticipants;

  // 參加抽獎
  const handleJoinLottery = async () => {
    if (!canJoin) return;

    try {
      setIsJoining(true);
      setError(null);
      setSuccess(false);

      // 準備交易消息
      const message = {
        address: contractAddress,
        amount: (parseFloat(entryFee) * 1e9).toString(), // 轉換為 nanoTON
        payload: '', // 空 payload，先測試基本交易
        // payload: 'join', // 當合約部署完成後，使用 "join" 消息
      };

      // 發送交易
      const result = await tonConnectUI.sendTransaction({
        messages: [message],
        validUntil: Date.now() + 5 * 60 * 1000, // 5分鐘有效期
      });

      console.log('交易已發送:', result);
      setSuccess(true);

      // 觸發成功回調
      if (onJoinSuccess) {
        onJoinSuccess();
      }

      // 3秒後重置成功狀態
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('參加抽獎失敗:', err);
      setError('參加抽獎失敗，請檢查錢包餘額或稍後重試');
    } finally {
      setIsJoining(false);
    }
  };

  // 格式化地址
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  return (
    <div className="join-lottery">
      <h3>🎯 參加抽獎</h3>

      {/* 狀態顯示 */}
      <div className="lottery-status">
        <div className="status-item">
          <span className="label">參與費用:</span>
          <span className="value">{entryFee} TON</span>
        </div>
        <div className="status-item">
          <span className="label">參與進度:</span>
          <span className="value">
            {currentParticipants} / {maxParticipants}
          </span>
        </div>
        <div className="status-item">
          <span className="label">抽獎狀態:</span>
          <span className={`value ${lotteryActive ? 'active' : 'inactive'}`}>
            {lotteryActive ? '🟢 活躍' : '🔴 非活躍'}
          </span>
        </div>
      </div>

      {/* 錢包連接狀態 */}
      {!isWalletConnected ? (
        <div className="wallet-notice">
          <p>🔗 請先連接您的 TON 錢包以參加抽獎</p>
        </div>
      ) : (
        <div className="wallet-info">
          <p>✅ 已連接錢包: {formatAddress(address)}</p>
        </div>
      )}

      {/* 參加按鈕 */}
      <div className="join-section">
        {!lotteryActive ? (
          <div className="lottery-closed">
            <p>❌ 當前抽獎已結束，請等待下一輪</p>
          </div>
        ) : currentParticipants >= maxParticipants ? (
          <div className="lottery-full">
            <p>🎉 抽獎已滿員！請等待抽獎結果</p>
          </div>
        ) : (
          <button
            className={`join-btn ${!canJoin ? 'disabled' : ''}`}
            onClick={handleJoinLottery}
            disabled={!canJoin || isJoining}
          >
            {isJoining ? (
              <>
                <span className="loading-spinner"></span>
                正在參加...
              </>
            ) : (
              <>🎲 參加抽獎 ({entryFee} TON)</>
            )}
          </button>
        )}
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)} className="close-btn">
            ✕
          </button>
        </div>
      )}

      {/* 成功訊息 */}
      {success && (
        <div className="success-message">
          <span>✅ 交易已發送！請等待區塊鏈確認</span>
        </div>
      )}

      {/* 說明文字 */}
      <div className="instructions">
        <h4>📋 參加說明</h4>
        <ul>
          <li>• 每次參加需要支付 {entryFee} TON 參與費用</li>
          <li>• 每個錢包地址只能參加一次</li>
          <li>• 當參與人數達到 {maxParticipants} 人時，抽獎將自動開始</li>
          <li>• 中獎者將獲得限量版貓咪 NFT</li>
        </ul>
      </div>
    </div>
  );
};

export default JoinLottery;
