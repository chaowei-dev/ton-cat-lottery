import WalletConnect from './components/WalletConnect';
import ContractStatus from './components/ContractStatus';
import './styles/App.css';

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>🐱 TON Cat Lottery 🎲</h1>
        <p>基於 TON 區塊鏈的貓咪 NFT 抽獎平台</p>
      </header>
      <main className="main-content">
        <div className="container">
          <WalletConnect />

          {/* 合約狀態組件 */}
          <ContractStatus contractAddress="EQCTPU-Wo7_2TDoi6Os3fy53iwIEG-3ZsNXYcAr0F_qWSoQY" />

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
