import React, { useEffect, useState } from 'react';
import { createContractService } from '../services/contractService.js';
import type { ContractInfo } from '../services/contractService.js';
import './ContractStatus.css';

interface ContractStatusProps {
  contractAddress: string;
}

const ContractStatus: React.FC<ContractStatusProps> = ({ contractAddress }) => {
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contractService = createContractService(contractAddress);

  // 載入合約狀態
  const loadContractStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const [info, balanceData] = await Promise.all([
        contractService.getContractInfo(),
        contractService.getBalance(),
      ]);

      setContractInfo(info);
      setBalance(balanceData);
    } catch (err) {
      setError('載入合約狀態失敗');
      console.error('載入合約狀態失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  // 初始載入
  useEffect(() => {
    loadContractStatus();
  }, [contractAddress]);

  // 定期刷新（每 30 秒）
  useEffect(() => {
    const interval = setInterval(loadContractStatus, 30000);
    return () => clearInterval(interval);
  }, [contractAddress]);

  if (loading) {
    return (
      <div className="contract-status">
        <div className="loading">
          <span>載入合約狀態中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="contract-status">
        <div className="error">
          <span>❌ {error}</span>
          <button onClick={loadContractStatus} className="retry-btn">
            重試
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
            <span className="balance">
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
        <button onClick={loadContractStatus} className="refresh-btn">
          🔄 刷新狀態
        </button>
      </div>
    </div>
  );
};

export default ContractStatus;
