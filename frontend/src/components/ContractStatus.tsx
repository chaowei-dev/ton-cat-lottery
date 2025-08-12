import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTonAddress } from '@tonconnect/ui-react';
import { createContractService } from '../services/contractService.js';
import type { ContractInfo } from '../services/contractService.js';
import type { useToast } from '../hooks/useToast.js';
import './ContractStatus.css';

interface ContractStatusProps {
  contractAddress: string;
  onContractInfoUpdate?: (info: ContractInfo | null) => void;
  toast?: ReturnType<typeof useToast>;
  refreshTrigger?: number; // 用於外部觸發刷新的 prop
}

const ContractStatus: React.FC<ContractStatusProps> = ({ 
  contractAddress, 
  onContractInfoUpdate,
  toast,
  refreshTrigger 
}) => {
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const address = useTonAddress(); // 監聽錢包連接狀態
  const contractService = createContractService(contractAddress);
  const loadingTimeoutRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  
  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 2000; // 2秒後重試

  // 載入合約狀態
  const loadContractStatus = useCallback(async (isRetry = false, currentRetryCount = 0) => {
    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
        setRetryCount(0);
      }

      // 清除之前的超時
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      // 設置載入超時（30秒）
      const timeoutPromise = new Promise((_, reject) => {
        loadingTimeoutRef.current = setTimeout(() => {
          reject(new Error('載入超時'));
        }, 30000);
      });

      const dataPromise = Promise.all([
        contractService.getContractInfo(),
        contractService.getBalance(),
      ]);

      const [info, balanceData] = await Promise.race([dataPromise, timeoutPromise]) as [ContractInfo | null, string | null];

      // 清除超時
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      setContractInfo(info);
      setBalance(balanceData);
      setError(null);
      setRetryCount(0);
      
      // 通知父組件狀態更新
      if (onContractInfoUpdate) {
        onContractInfoUpdate(info);
      }

    } catch (err) {
      console.error('載入合約狀態失敗:', err);
      
      const errorMessage = err instanceof Error ? err.message : '載入合約狀態失敗';
      const retryCountToUse = isRetry ? currentRetryCount : retryCount;
      
      if (retryCountToUse < MAX_RETRY_ATTEMPTS && !isRetry) {
        // 自動重試
        const newRetryCount = retryCountToUse + 1;
        setRetryCount(newRetryCount);
        
        if (toast) {
          toast.warning('重試中', `載入失敗，正在進行第 ${newRetryCount} 次重試...`);
        }
        
        retryTimeoutRef.current = setTimeout(() => {
          loadContractStatus(true, newRetryCount);
        }, RETRY_DELAY);
        
      } else {
        // 重試次數用盡，顯示錯誤
        setError(errorMessage);
        if (toast) {
          toast.error('載入失敗', '無法載入合約狀態，請檢查網路連接並手動重試');
        }
      }
    } finally {
      if (!isRetry || currentRetryCount >= MAX_RETRY_ATTEMPTS) {
        setLoading(false);
      }
    }
  }, [contractService, onContractInfoUpdate, toast]);

  // 初始載入和地址變化時重新載入
  useEffect(() => {
    // 延遲載入以確保組件完全掛載
    const timer = setTimeout(() => {
      loadContractStatus();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [contractAddress]); // 只依賴 contractAddress 變化

  // 錢包連接狀態變化時刷新數據（僅在錢包剛連接時）
  useEffect(() => {
    if (address) {
      // 錢包連接後，刷新合約狀態以獲取最新數據
      const timer = setTimeout(() => {
        loadContractStatus();
      }, 1000); // 延遲1秒以確保連接穩定
      
      return () => clearTimeout(timer);
    }
  }, [address]); // 只依賴 address 變化

  // 外部觸發刷新
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      // 延遲刷新以確保區塊鏈狀態已更新
      const timer = setTimeout(() => {
        loadContractStatus();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [refreshTrigger, loadContractStatus]);

  // 定期刷新（每 30 秒）
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     loadContractStatus();
  //   }, 30000);
    
  //   return () => clearInterval(interval);
  // }, []); // 移除 loadContractStatus 依賴，避免重複設置定時器

  // 清理函數
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="contract-status">
        <div className="loading">
          <span>
            載入合約狀態中...
            {retryCount > 0 && ` (第 ${retryCount} 次重試)`}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="contract-status">
        <div className="error">
          <span>❌ {error}</span>
          {retryCount >= MAX_RETRY_ATTEMPTS && (
            <p className="retry-info">已重試 {MAX_RETRY_ATTEMPTS} 次，請檢查網路連接</p>
          )}
          <button 
            onClick={() => loadContractStatus()} 
            className="retry-btn"
            disabled={loading}
          >
            {loading ? '重試中...' : '手動重試'}
          </button>
        </div>
      </div>
    );
  }

  if (!contractInfo) {
    return (
      <div className="contract-status">
        <div className="error">
          <span>無法獲取合約資訊</span>
        </div>
      </div>
    );
  }

  return (
    <div className="contract-status">
      <h3>🎲 抽獎合約狀態</h3>

      <div className="status-grid">
        {/* 抽獎狀態 */}
        <div className="status-item">
          <div className="status-label">抽獎狀態</div>
          <div
            className={`status-value ${
              contractInfo.lotteryActive ? 'active' : 'inactive'
            }`}
          >
            <span className="status-indicator"></span>
            {contractInfo.lotteryActive ? '活躍' : '非活躍'}
          </div>
        </div>

        {/* 當前輪次 */}
        <div className="status-item">
          <div className="status-label">當前輪次</div>
          <div className="status-value">
            <span className="round-number">#{contractInfo.currentRound}</span>
          </div>
        </div>

        {/* 參與人數 */}
        <div className="status-item">
          <div className="status-label">參與人數</div>
          <div className="status-value">
            <span className="participant-count">
              {contractInfo.participantCount} / {contractInfo.maxParticipants}
            </span>
          </div>
        </div>

        {/* 參與費用 */}
        <div className="status-item">
          <div className="status-label">參與費用</div>
          <div className="status-value">
            <span className="entry-fee">
              {contractService.formatTON(contractInfo.entryFee)}
            </span>
          </div>
        </div>

        {/* 合約餘額 */}
        <div className="status-item">
          <div className="status-label">合約餘額</div>
          <div className="status-value">
            <span className="contract-balance">
              {balance ? `${balance} TON` : '載入中...'}
            </span>
          </div>
        </div>

        {/* 合約地址 */}
        <div className="status-item full-width">
          <div className="status-label">合約地址</div>
          <div className="status-value">
            <span className="contract-address">{contractAddress}</span>
          </div>
        </div>
      </div>

      {/* 進度條 */}
      <div className="progress-section">
        <div className="progress-label">
          參與進度 ({contractInfo.participantCount}/
          {contractInfo.maxParticipants})
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${
                (contractInfo.participantCount / contractInfo.maxParticipants) *
                100
              }%`,
            }}
          ></div>
        </div>
      </div>

      {/* 刷新按鈕 */}
      <div className="refresh-section">
        <button 
          onClick={() => loadContractStatus()} 
          className="refresh-btn"
          disabled={loading}
        >
          🔄 {loading ? '載入中...' : '刷新狀態'}
        </button>
        {retryCount > 0 && !loading && (
          <span className="retry-status">
            已自動重試 {retryCount} 次
          </span>
        )}
      </div>
    </div>
  );
};

export default ContractStatus;
