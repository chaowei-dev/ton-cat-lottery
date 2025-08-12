import React, { useEffect, useState } from 'react';
import { createContractService, type ContractInfo, type LotteryResult } from '../services/contractService';
import type { useToast } from '../hooks/useToast';
import './WinnerHistory.css';

interface WinnerHistoryProps {
  contractAddress: string;
  contractInfo: ContractInfo | null;
  toast?: ReturnType<typeof useToast>;
}

interface WinnerWithRound extends LotteryResult {
  round: number;
}

const WinnerHistory: React.FC<WinnerHistoryProps> = ({ 
  contractAddress, 
  contractInfo,
  toast 
}) => {
  const [winners, setWinners] = useState<WinnerWithRound[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const contractService = createContractService(contractAddress);

  // 載入中獎記錄 - 使用批量請求
  const loadWinners = async () => {
    if (!contractInfo || contractInfo.currentRound <= 1) {
      setWinners([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const roundsToCheck = Math.min(10, contractInfo.currentRound - 1); // 查詢最近10輪
      const rounds: number[] = [];
      
      // 生成要查詢的輪次列表
      for (let round = contractInfo.currentRound - 1; round >= Math.max(1, contractInfo.currentRound - roundsToCheck); round--) {
        rounds.push(round);
      }
      
      console.log(`🏆 載入輪次 ${rounds.join(', ')} 的中獎記錄`);
      
      // 使用批量請求方法
      const validWinners = await contractService.getWinnersBatch(rounds);
      
      setWinners(validWinners);
      
      if (toast && validWinners.length > 0) {
        setLoaded(true);
        toast.success('載入成功', `成功載入 ${validWinners.length} 個中獎記錄`);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入中獎記錄失敗';
      setError(errorMessage);
      
      if (toast) {
        toast.error('載入失敗', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // 移除自動載入，改為手動查詢
  // useEffect(() => {
  //   if (contractInfo && contractInfo.currentRound > 1) {
  //     loadWinners();
  //   }
  // }, [contractInfo?.currentRound]);

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

  // 獲取稀有度文字和顏色
  const getRarityInfo = (nftId: number) => {
    const rarityMap = {
      0: { name: 'Common', color: '#6c757d', emoji: '🐱' },
      1: { name: 'Rare', color: '#007bff', emoji: '🐯' },
      2: { name: 'Epic', color: '#6f42c1', emoji: '🦁' },
      3: { name: 'Legendary', color: '#fd7e14', emoji: '🐅' }
    };
    
    const rarity = rarityMap[nftId as keyof typeof rarityMap];
    return rarity || { name: 'Unknown', color: '#6c757d', emoji: '❓' };
  };

  if (!contractInfo) {
    return null;
  }

  return (
    <div className="winner-history">
      <h3>🏆 中獎記錄</h3>
      
      <div className="history-summary">
        <span className="total-rounds">已完成輪次: {Math.max(0, contractInfo.currentRound - 1)}</span>
        {/* <span className="total-winners">中獎記錄: {winners.length}</span> */}
        {!loaded &&
          <button 
          onClick={loadWinners} 
          className="load-btn"
          disabled={loading || contractInfo.currentRound <= 1}
          >
          🏆 {loading ? '載入中...' : '查看中獎記錄'}
        </button>
        }
      </div>

      {loading && (
        <div className="loading">
          <span>載入中獎記錄中...</span>
        </div>
      )}

      {error && (
        <div className="error">
          <span>❌ {error}</span>
          <button onClick={loadWinners} className="retry-btn">
            重試
          </button>
        </div>
      )}

      {!loading && !error && contractInfo.currentRound <= 1 && (
        <div className="empty-state">
          <span>🎭 還沒有完成的抽獎輪次</span>
        </div>
      )}

      {!loading && !error && winners.length === 0 && contractInfo.currentRound > 1 && (
        <div className="empty-state">
          <span>📋 點擊「查看中獎記錄」按鈕載入歷史記錄</span>
        </div>
      )}

      {!loading && !error && winners.length > 0 && (
        <div className="winner-list">
          {winners.map((winner) => {
            const rarityInfo = getRarityInfo(winner.nftId);
            return (
              <div key={winner.round} className="winner-card">
                <div className="winner-header">
                  <div className="round-badge">輪次 #{winner.round}</div>
                  <div className="winner-time">{formatTime(winner.timestamp)}</div>
                </div>
                
                <div className="winner-content">
                  <div className="winner-address">
                    <span className="label">🏆 中獎者:</span>
                    <span className="value" title={winner.winner}>
                      {formatAddress(winner.winner)}
                    </span>
                  </div>
                  
                  <div className="winner-nft">
                    <span className="label">🎁 NFT:</span>
                    <span 
                      className="nft-info" 
                      style={{ color: rarityInfo.color }}
                    >
                      {rarityInfo.emoji} {rarityInfo.name} #{winner.nftId}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="refresh-section">
        <button 
          onClick={loadWinners} 
          className="refresh-btn"
          disabled={loading}
        >
          🔄 {loading ? '載入中...' : '刷新記錄'}
        </button>
      </div>
    </div>
  );
};

export default WinnerHistory;