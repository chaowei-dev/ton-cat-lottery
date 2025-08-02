import { useState, useEffect } from 'react';
import WalletConnect from './components/WalletConnect';
import ContractStatus from './components/ContractStatus';
import JoinLottery from './components/JoinLottery';
import { createContractService } from './services/contractService';
import type { ContractInfo } from './services/contractService';
import './styles/App.css';

function App() {
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const contractAddress = 'EQDUbgkuc2X3bbhzWXk8hn16JeG_qRsOrpv1h8DUkXf1XQO2';
  const contractService = createContractService(contractAddress);

  // 載入合約狀態
  const loadContractStatus = async () => {
    try {
      const info = await contractService.getContractInfo();
      setContractInfo(info);
    } catch (error) {
      console.error('載入合約狀態失敗:', error);
    }
  };

  // 初始載入
  useEffect(() => {
    loadContractStatus();
  }, []);

  // 定期刷新
  useEffect(() => {
    const interval = setInterval(loadContractStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>🐱 TON Cat Lottery 🎲</h1>
        <p>基於 TON 區塊鏈的貓咪 NFT 抽獎平台</p>
      </header>
      <main className="main-content">
        <div className="container">
          {/* 合約狀態組件 */}
          <ContractStatus contractAddress={contractAddress} />

          {/* 錢包連接組件 */}
          <WalletConnect />

          {/* 參加抽獎組件 */}
          {contractInfo ? (
            <JoinLottery
              contractAddress={contractAddress}
              entryFee={contractInfo.entryFee}
              maxParticipants={contractInfo.maxParticipants}
              currentParticipants={contractInfo.participantCount}
              lotteryActive={contractInfo.lotteryActive}
              onJoinSuccess={loadContractStatus}
            />
          ) : (
            <div className="card">
              <p>載入合約狀態中...</p>
            </div>
          )}

          <div className="card">
            <h2>錢包連接功能已完成 ✅</h2>
            <p>您現在可以連接 Tonkeeper 或其他支援的 TON 錢包！</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
