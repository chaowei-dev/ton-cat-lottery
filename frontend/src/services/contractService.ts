// 簡化的合約服務，暫時使用模擬數據

// 合約狀態介面
export interface ContractInfo {
  owner: string;
  entryFee: string;
  maxParticipants: number;
  currentRound: number;
  lotteryActive: boolean;
  participantCount: number;
  nftContract: string | null;
}

// 參與者資訊介面
export interface Participant {
  address: string;
  amount: string;
  timestamp: number;
}

// 中獎記錄介面
export interface LotteryResult {
  winner: string;
  nftId: number;
  timestamp: number;
}

// 合約服務類別
export class ContractService {
  private contractAddress: string;

  constructor(contractAddress: string) {
    this.contractAddress = contractAddress;
  }

  // 獲取合約狀態
  async getContractInfo(): Promise<ContractInfo | null> {
    try {
      // 暫時返回模擬數據，實際實作需要通過 TON API 查詢
      return {
        owner: this.contractAddress,
        entryFee: '0.1',
        maxParticipants: 10,
        currentRound: 1,
        lotteryActive: true,
        participantCount: 3,
        nftContract: null,
      };
    } catch (error) {
      console.error('獲取合約狀態失敗:', error);
      return null;
    }
  }

  // 獲取合約餘額
  async getBalance(): Promise<string | null> {
    try {
      // 暫時返回模擬數據，實際實作需要通過 TON API 查詢
      return '1.5';
    } catch (error) {
      console.error('獲取合約餘額失敗:', error);
      return null;
    }
  }

  // 獲取參與者資訊
  async getParticipant(_index: number): Promise<Participant | null> {
    try {
      // 實作參與者查詢邏輯
      // 暫時返回 null，實際實作需要通過合約查詢
      return null;
    } catch (error) {
      console.error('獲取參與者資訊失敗:', error);
      return null;
    }
  }

  // 獲取中獎記錄
  async getWinner(_round: number): Promise<LotteryResult | null> {
    try {
      // 實作中獎記錄查詢邏輯
      // 暫時返回 null，實際實作需要通過合約查詢
      return null;
    } catch (error) {
      console.error('獲取中獎記錄失敗:', error);
      return null;
    }
  }

  // 格式化 TON 金額
  formatTON(amount: string): string {
    const tonAmount = parseFloat(amount);
    return `${tonAmount.toFixed(2)} TON`;
  }

  // 格式化地址
  formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  }
}

// 建立合約服務實例
export const createContractService = (
  contractAddress: string
): ContractService => {
  return new ContractService(contractAddress);
};
