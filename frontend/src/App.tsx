import { useState, useCallback } from 'react';
import WalletConnect from './components/WalletConnect';
import ContractStatus from './components/ContractStatus';
import JoinLottery from './components/JoinLottery';
import { ToastContainer } from './components/Toast';
import { useToast } from './hooks/useToast';
import type { ContractInfo } from './services/contractService';
import './styles/App.css';

function App() {
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const contractAddress = 'EQC0482t814YivoEaIea43khv6jo4Mp_sXtx0eOIgtzUsl13';
  const toast = useToast();

  // 合約狀態更新回調函數
  const handleContractInfoUpdate = useCallback((info: ContractInfo | null) => {
    setContractInfo(info);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>🐱 TON Cat Lottery 🎲</h1>
        <p>基於 TON 區塊鏈的貓咪 NFT 抽獎平台</p>
        {/* CI/CD Test Version: 2025-08-05-v1 */}
      </header>
      <main className="main-content">
        <div className="container">
          {/* 合約狀態組件 */}
          <ContractStatus 
            contractAddress={contractAddress} 
            onContractInfoUpdate={handleContractInfoUpdate}
            toast={toast}
          />

          {/* 錢包連接組件 */}
          <WalletConnect />

          {/* 參加抽獎組件 */}
          {contractInfo ? (
            <JoinLottery
              contractAddress={contractAddress}
              contractInfo={contractInfo}
              onJoinSuccess={() => {
                // 觸發合約狀態重新載入
                // ContractStatus 組件會處理這個更新
              }}
              toast={toast}
            />
          ) : null}

          <div className="card">
            <h2>智能合約模組（區塊鏈上的核心邏輯）</h2>
            <p>
              <span>✅</span> 定義抽獎規則 (3人滿員抽獎)
            </p>
            <p>
              <span>✅</span> 管理參與者資料 (地址、費用、時間)
            </p>
            <p>
              <span>✅</span> 執行隨機抽獎 (基於區塊鏈隨機性)
            </p>
            <p>
              <span>✅</span> 發送 NFT 給中獎者
            </p>
            <p>
              <span>✅</span> 管理合約狀態 (活躍/非活躍)
            </p>

            <h2>前端 dApp 模組（用戶界面與錢包互動）</h2>
            <p>
              <span>✅</span> 錢包連接 (TonConnect SDK)
            </p>
            <p>
              <span>✅</span> 顯示合約狀態 (參與人數、費用、輪次)
            </p>
            <p>
              <span>✅</span> 參與抽獎功能 (發送 join 交易)
            </p>
            <p>
              <span>✅</span> 交易狀態提示 (成功/失敗通知)
            </p>
            <p>
              <span>✅</span> 用戶體驗優化 (響應式設計)
            </p>

            <h3>後端自動化模組（自動抽獎機器人）</h3>
            <p>
              <span>✅</span> 定時檢查合約狀態 (每30分鐘)
            </p>
            <p>
              <span>✅</span> 自動觸發抽獎 (當人數達到3人)
            </p>
            <p>
              <span>✅</span> 發送 drawWinner 交易
            </p>
            <p>
              <span>✅</span> 監控交易結果
            </p>
            <p>
              <span>✅</span> 記錄抽獎歷史
            </p>

            <h2>完整抽獎流程：</h2>
            <p>1. 用戶操作 (前端)</p>
            <p>2. 發送 join 交易到合約</p>
            <p>3. 合約記錄參與者</p>
            <p>4. 後端檢測到人數達到3人</p>
            <p>5. 後端發送 drawWinner 交易</p>
            <p>6. 合約執行抽獎並發送 NFT</p>
            <p>7. 前端更新顯示結果</p>

            <h2>技術分工：</h2>
            <p>智能合約: 確保公平性和不可篡改性</p>
            <p>前端: 提供友好的用戶界面</p>
            <p>後端: 實現自動化運營，減少人工干預</p>

            <h4>這樣的架構確保了：</h4>
            <p>
              <span>✅</span> 去中心化: 核心邏輯在區塊鏈上
            </p>
            <p>
              <span>✅</span> 用戶友好: 前端提供直觀界面
            </p>
            <p>
              <span>✅</span> 自動化: 後端處理重複性工作
            </p>
          </div>
        </div>
      </main>

      {/* Toast 通知容器 */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}

export default App;
