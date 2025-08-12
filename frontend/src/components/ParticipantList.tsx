import React, { useEffect, useState } from 'react';
import { createContractService, type ContractInfo, type Participant } from '../services/contractService';
import type { useToast } from '../hooks/useToast';
import './ParticipantList.css';

interface ParticipantListProps {
  contractAddress: string;
  contractInfo: ContractInfo | null;
  toast?: ReturnType<typeof useToast>;
}

const ParticipantList: React.FC<ParticipantListProps> = ({ 
  contractAddress, 
  contractInfo,
  toast 
}) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const contractService = createContractService(contractAddress);

  // 載入參與者清單
  const loadParticipants = async () => {
    if (!contractInfo || contractInfo.participantCount === 0) {
      setParticipants([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const participantPromises: Promise<Participant | null>[] = [];
      
      // 查詢所有參與者
      for (let i = 0; i < contractInfo.participantCount; i++) {
        participantPromises.push(contractService.getParticipant(i));
      }
      
      const participantResults = await Promise.all(participantPromises);
      const validParticipants = participantResults.filter((p): p is Participant => p !== null);
      
      setParticipants(validParticipants);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入參與者失敗';
      setError(errorMessage);
      
      if (toast) {
        toast.error('載入失敗', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // 當合約資訊變化時重新載入
  useEffect(() => {
    if (contractInfo) {
      loadParticipants();
    }
  }, [contractInfo?.currentRound, contractInfo?.participantCount]);

  // 格式化時間
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // 格式化地址
  const formatAddress = (address: string) => {
    if (address.length > 20) {
      return `${address.slice(0, 6)}...${address.slice(-6)}`;
    }
    return address;
  };

  if (!contractInfo) {
    return null;
  }

  return (
    <div className="participant-list">
      <h3>👥 當前輪次參與者</h3>
      
      <div className="participant-summary">
        <span className="round-info">輪次 #{contractInfo.currentRound}</span>
        <span className="count-info">
          {contractInfo.participantCount} / {contractInfo.maxParticipants} 人
        </span>
      </div>

      {loading && (
        <div className="loading">
          <span>載入參與者清單中...</span>
        </div>
      )}

      {error && (
        <div className="error">
          <span>❌ {error}</span>
          <button onClick={loadParticipants} className="retry-btn">
            重試
          </button>
        </div>
      )}

      {!loading && !error && contractInfo.participantCount === 0 && (
        <div className="empty-state">
          <span>🎭 還沒有人參與此輪抽獎</span>
        </div>
      )}

      {!loading && !error && participants.length > 0 && (
        <div className="participant-grid">
          {participants.map((participant, index) => (
            <div key={index} className="participant-card">
              <div className="participant-number">#{index + 1}</div>
              <div className="participant-address">
                <span className="label">地址:</span>
                <span className="value" title={participant.address}>
                  {formatAddress(participant.address)}
                </span>
              </div>
              <div className="participant-amount">
                <span className="label">金額:</span>
                <span className="value">{participant.amount} TON</span>
              </div>
              <div className="participant-time">
                <span className="label">時間:</span>
                <span className="value">{formatTime(participant.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="refresh-section">
        <button 
          onClick={loadParticipants} 
          className="refresh-btn"
          disabled={loading}
        >
          🔄 {loading ? '載入中...' : '刷新清單'}
        </button>
      </div>
    </div>
  );
};

export default ParticipantList;