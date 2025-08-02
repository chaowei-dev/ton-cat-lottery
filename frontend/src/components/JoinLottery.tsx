import React, { useState, useEffect } from 'react';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import {
  WalletService,
  TransactionError,
  ERROR_MESSAGES,
} from '../services/contractService';
import type { useToast } from '../hooks/useToast';
import './JoinLottery.css';

interface JoinLotteryProps {
  contractAddress: string;
  entryFee: string;
  maxParticipants: number;
  currentParticipants: number;
  lotteryActive: boolean;
  onJoinSuccess?: () => void;
  toast: ReturnType<typeof useToast>;
}

const JoinLottery: React.FC<JoinLotteryProps> = ({
  contractAddress,
  entryFee,
  maxParticipants,
  currentParticipants,
  lotteryActive,
  onJoinSuccess,
  toast,
}) => {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();
  const [isJoining, setIsJoining] = useState(false);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // 交易狀態
  const TransactionStatus = {
    IDLE: 'IDLE',
    CHECKING_BALANCE: 'CHECKING_BALANCE',
    PREPARING: 'PREPARING',
    SENDING: 'SENDING',
    WAITING_CONFIRMATION: 'WAITING_CONFIRMATION',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
  } as const;

  type TransactionStatusType =
    (typeof TransactionStatus)[keyof typeof TransactionStatus];

  const [transactionStatus, setTransactionStatus] =
    useState<TransactionStatusType>(TransactionStatus.IDLE);

  // 檢查用戶是否已連接錢包
  const isWalletConnected = !!address;

  // 載入錢包餘額
  const loadWalletBalance = async () => {
    if (!address) return;

    setIsLoadingBalance(true);
    try {
      const balance = await WalletService.getWalletBalance(address);
      setWalletBalance(balance);
    } catch (error) {
      console.error('載入錢包餘額失敗:', error);
      toast.error('餘額載入失敗', '無法獲取錢包餘額，請重新整理頁面');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // 當錢包連接時載入餘額
  useEffect(() => {
    if (address) {
      loadWalletBalance();
    } else {
      setWalletBalance(null);
    }
  }, [address]);

  // 檢查是否可以參加
  const requiredAmount = 0.02; // 0.02 TON (包含參與費 + gas 費用)
  const hasEnoughBalance = walletBalance
    ? parseFloat(walletBalance) >= requiredAmount
    : false;

  const canJoin =
    isWalletConnected &&
    lotteryActive &&
    currentParticipants < maxParticipants &&
    hasEnoughBalance &&
    transactionStatus === TransactionStatus.IDLE;

  // 參加抽獎
  const handleJoinLottery = async () => {
    if (!address) {
      toast.error('錢包未連接', '請先連接您的 TON 錢包');
      return;
    }

    // 預檢查抽獎狀態
    if (!lotteryActive) {
      const errorInfo = ERROR_MESSAGES[TransactionError.LOTTERY_INACTIVE];
      toast.error(errorInfo.title, errorInfo.message);
      return;
    }

    if (currentParticipants >= maxParticipants) {
      const errorInfo = ERROR_MESSAGES[TransactionError.LOTTERY_FULL];
      toast.error(errorInfo.title, errorInfo.message);
      return;
    }

    try {
      setIsJoining(true);
      setTransactionStatus(TransactionStatus.CHECKING_BALANCE);

      // 第一步：檢查餘額
      toast.info('檢查餘額', '正在檢查您的錢包餘額...');

      const balanceCheck = await WalletService.checkSufficientBalance(
        address,
        requiredAmount
      );

      if (!balanceCheck.sufficient) {
        setTransactionStatus(TransactionStatus.FAILED);
        const errorInfo = ERROR_MESSAGES[TransactionError.INSUFFICIENT_BALANCE];
        toast.error(
          errorInfo.title,
          `${errorInfo.message}\n當前餘額: ${balanceCheck.balance.toFixed(
            4
          )} TON\n需要: ${balanceCheck.required.toFixed(4)} TON`
        );
        return;
      }

      // 第二步：準備交易
      setTransactionStatus(TransactionStatus.PREPARING);
      toast.info('準備交易', '正在準備交易參數...');

      const message = {
        address: contractAddress,
        amount: '20000000', // 0.02 TON (包含參與費 + gas 費，確保足夠)
        payload: 'te6cckEBAQEACgAAEAAAAABqb2lukPEtIw==', // 正確的 "join" 文字消息 BOC
      };

      // 第三步：發送交易
      setTransactionStatus(TransactionStatus.SENDING);
      toast.info('發送交易', '正在發送交易到區塊鏈...');

      const result = await tonConnectUI.sendTransaction({
        messages: [message],
        validUntil: Date.now() + 5 * 60 * 1000, // 5分鐘有效期
      });

      console.log('交易已發送:', result);

      // 第四步：等待確認
      setTransactionStatus(TransactionStatus.WAITING_CONFIRMATION);
      toast.success('交易已發送', '正在等待區塊鏈確認，預計需要 1-2 分鐘');

      // 等待區塊鏈確認後再刷新狀態
      if (onJoinSuccess) {
        setTimeout(() => {
          onJoinSuccess();
          loadWalletBalance(); // 重新載入餘額
        }, 5000);
      }

      // 標記為成功
      setTimeout(() => {
        setTransactionStatus(TransactionStatus.SUCCESS);
        toast.success('參加成功', '您已成功參加抽獎！請等待抽獎結果');
      }, 5000);

      // 重置狀態
      setTimeout(() => {
        setTransactionStatus(TransactionStatus.IDLE);
      }, 10000);
    } catch (error: any) {
      console.error('參加抽獎失敗:', error);
      setTransactionStatus(TransactionStatus.FAILED);

      // 分析錯誤類型並顯示相應訊息
      const errorType = WalletService.analyzeTransactionError(error);
      const errorInfo = ERROR_MESSAGES[errorType];

      toast.error(errorInfo.title, errorInfo.message);

      // 重置狀態
      setTimeout(() => {
        setTransactionStatus(TransactionStatus.IDLE);
      }, 3000);
    } finally {
      setIsJoining(false);
    }
  };

  // 格式化地址
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  // 獲取交易狀態顯示文字
  const getTransactionStatusText = () => {
    switch (transactionStatus) {
      case TransactionStatus.CHECKING_BALANCE:
        return '正在檢查餘額...';
      case TransactionStatus.PREPARING:
        return '正在準備交易...';
      case TransactionStatus.SENDING:
        return '正在發送交易...';
      case TransactionStatus.WAITING_CONFIRMATION:
        return '等待區塊鏈確認...';
      case TransactionStatus.SUCCESS:
        return '交易成功！';
      case TransactionStatus.FAILED:
        return '交易失敗';
      default:
        return '🎲 參加抽獎 (0.02 TON)';
    }
  };

  // 獲取進度步驟狀態
  const getStepStatus = (step: string) => {
    const steps = [
      'CHECKING_BALANCE',
      'PREPARING',
      'SENDING',
      'WAITING_CONFIRMATION',
      'SUCCESS',
    ];
    const currentIndex = steps.indexOf(transactionStatus);
    const stepIndex = steps.indexOf(step);

    if (stepIndex === currentIndex) return 'active';
    if (stepIndex < currentIndex) return 'completed';
    return '';
  };

  // 獲取按鈕禁用原因
  const getDisabledReason = () => {
    if (!isWalletConnected) return '請先連接錢包';
    if (!lotteryActive) return '抽獎未開放';
    if (currentParticipants >= maxParticipants) return '抽獎已滿員';
    if (isLoadingBalance) return '正在載入餘額...';
    if (!hasEnoughBalance) return `餘額不足 (需要 ${requiredAmount} TON)`;
    if (transactionStatus !== TransactionStatus.IDLE) return '交易進行中...';
    return null;
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

      {/* 錢包連接狀態與餘額 */}
      {!isWalletConnected ? (
        <div className="wallet-notice">
          <p>🔗 請先連接您的 TON 錢包以參加抽獎</p>
        </div>
      ) : (
        <div className="wallet-info">
          <div className="wallet-connect-address">
            <span>✅ 已連接錢包: {formatAddress(address)}</span>
          </div>
          <div className="wallet-balance">
            {isLoadingBalance ? (
              <span className="loading-balance">🔄 載入餘額中...</span>
            ) : walletBalance ? (
              <span
                className={`join-lottery-balance ${
                  hasEnoughBalance ? 'sufficient' : 'insufficient'
                }`}
              >
                💰 餘額: {WalletService.formatTON(walletBalance)}
                {!hasEnoughBalance && (
                  <span className="insufficient-notice">
                    (不足 {requiredAmount} TON)
                  </span>
                )}
              </span>
            ) : (
              <span className="balance-error">❌ 無法載入餘額</span>
            )}
          </div>
        </div>
      )}

      {/* 參加按鈕 */}
      <div className="join-section">
        {getDisabledReason() && !isJoining ? (
          <div
            className={`lottery-disabled ${
              getDisabledReason()?.includes('餘額')
                ? 'insufficient-balance'
                : ''
            }`}
          >
            <p>⚠️ {getDisabledReason()}</p>
            {getDisabledReason()?.includes('餘額') && (
              <button
                className="refresh-balance-btn"
                onClick={loadWalletBalance}
                disabled={isLoadingBalance}
              >
                {isLoadingBalance ? '🔄 刷新中...' : '🔄 刷新餘額'}
              </button>
            )}
          </div>
        ) : (
          <button
            className={`join-btn ${!canJoin || isJoining ? 'disabled' : ''} ${
              transactionStatus !== TransactionStatus.IDLE ? 'processing' : ''
            }`}
            onClick={handleJoinLottery}
            disabled={!canJoin || isJoining}
          >
            {isJoining ? (
              <>
                <span className="loading-spinner"></span>
                {getTransactionStatusText()}
              </>
            ) : (
              <>{getTransactionStatusText()}</>
            )}
          </button>
        )}

        {/* 交易狀態進度 */}
        {transactionStatus !== TransactionStatus.IDLE && (
          <div className="transaction-progress">
            <div
              className={`progress-step ${getStepStatus('CHECKING_BALANCE')}`}
            >
              檢查餘額
            </div>
            <div className={`progress-step ${getStepStatus('PREPARING')}`}>
              準備交易
            </div>
            <div className={`progress-step ${getStepStatus('SENDING')}`}>
              發送交易
            </div>
            <div
              className={`progress-step ${getStepStatus(
                'WAITING_CONFIRMATION'
              )}`}
            >
              等待確認
            </div>
            <div className={`progress-step ${getStepStatus('SUCCESS')}`}>
              完成
            </div>
          </div>
        )}
      </div>

      {/* 狀態提示 */}
      {transactionStatus === TransactionStatus.FAILED && (
        <div className="error-message">
          <span>❌ 交易失敗，請重試</span>
        </div>
      )}

      {transactionStatus === TransactionStatus.SUCCESS && (
        <div className="success-message">
          <span>✅ 參加成功！請等待抽獎結果</span>
        </div>
      )}

      {/* 說明文字 */}
      <div className="instructions">
        <h4>📋 參加說明</h4>
        <ul>
          <li>• 每次參加需要支付 0.02 TON (包含參與費和 gas 費用)</li>
          <li>• 每個錢包地址只能參加一次</li>
          <li>• 當參與人數達到 {maxParticipants} 人時，抽獎將自動開始</li>
          <li>• 中獎者將獲得限量版貓咪 NFT</li>
        </ul>
      </div>
    </div>
  );
};

export default JoinLottery;
