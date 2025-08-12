import { tonApiManager } from './tonApiManager';

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
      console.log('📋 獲取合約狀態:', this.contractAddress);
      const data = await tonApiManager.getContractInfo(this.contractAddress);

      if (data.result) {
        // 解析合約返回的數據
        const stack = data.result.stack;
        if (stack && stack.length >= 9) {
          // ContractInfo 結構: owner, entryFee, maxParticipants, currentRound, lotteryActive, drawInProgress, drawStartTime, participantCount, nftContract
          const entryFeeNano = parseInt(stack[1][1], 16); 
          const maxParticipants = parseInt(stack[2][1], 16); 
          const currentRound = parseInt(stack[3][1], 16); 
          const lotteryActiveRaw = parseInt(stack[4][1], 16); 
          const participantCount = parseInt(stack[7][1], 16); // participantCount 在第8個位置 (index 7)

          // 轉換 entryFee 從 nanoTON 到 TON
          const entryFeeTON = (entryFeeNano / 1e9).toFixed(2);

          // 判斷抽獎是否活躍 (通常 -1 表示 true, 0 表示 false)
          const lotteryActive = lotteryActiveRaw !== 0;

          return {
            owner: this.contractAddress,
            entryFee: entryFeeTON,
            maxParticipants: maxParticipants,
            currentRound: currentRound,
            lotteryActive: lotteryActive,
            participantCount: participantCount,
            nftContract: null,
          };
        } else {
          throw new Error('合約返回數據格式不正確');
        }
      } else {
        throw new Error('合約查詢失敗');
      }
    } catch (error) {
      console.error('獲取合約狀態失敗:', error);
      return this.getFallbackData();
    }
  }

  // 獲取合約餘額
  async getBalance(): Promise<string | null> {
    try {
      console.log('💰 獲取合約餘額:', this.contractAddress);
      const data = await tonApiManager.getAddressBalance(this.contractAddress);
      
      if (data.result !== undefined) {
        // 將 nanoTON 轉換為 TON
        const balanceInTON = (parseInt(data.result) / 1e9).toFixed(4);
        return balanceInTON;
      } else {
        throw new Error('獲取餘額失敗');
      }
    } catch (error) {
      console.error('獲取合約餘額失敗:', error);
      return '0.0000';
    }
  }

  // 獲取參與者資訊
  async getParticipant(index: number): Promise<Participant | null> {
    try {
      console.log(`👥 獲取參與者 ${index}:`, this.contractAddress);
      const data = await tonApiManager.getParticipant(this.contractAddress, index);
      
      if (data.result?.stack && data.result.stack.length > 0) {
        const stack = data.result.stack;
        if (stack.length > 0 && stack[0][0] === 'tuple') {
          const tupleElements = stack[0][1].elements;
          if (tupleElements && tupleElements.length >= 3) {
            
            // 解析地址（簡化處理）
            const addressSlice = tupleElements[0].slice?.bytes;
            let parsedAddress = addressSlice || '';
            
            // 解析金額和時間戳
            const amount = parseInt(tupleElements[1].number?.number || '0');
            const timestamp = parseInt(tupleElements[2].number?.number || '0');
            
            return {
              address: parsedAddress,
              amount: (amount / 1e9).toFixed(4), // 轉換為 TON
              timestamp: timestamp
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error(`獲取參與者資訊失敗:`, error);
      return null;
    }
  }

  // 獲取中獎記錄
  async getWinner(round: number): Promise<LotteryResult | null> {
    try {
      console.log(`🏆 獲取中獎記錄 輪次 ${round}:`, this.contractAddress);
      const data = await tonApiManager.getWinner(this.contractAddress, round);
      
      if (data.result?.stack && data.result.stack.length > 0) {
        const stack = data.result.stack;
        if (stack.length > 0 && stack[0][0] === 'tuple') {
          const tupleElements = stack[0][1].elements;
          if (tupleElements && tupleElements.length >= 3) {
            // 解析中獎者地址（簡化處理）
            const winnerSlice = tupleElements[0].slice?.bytes;
            let parsedWinner = winnerSlice || '';
            
            // 解析 NFT ID 和時間戳
            const nftId = parseInt(tupleElements[1].number?.number || '0');
            const timestamp = parseInt(tupleElements[2].number?.number || '0');
            
            return {
              winner: parsedWinner,
              nftId: nftId,
              timestamp: timestamp
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('獲取中獎記錄失敗:', error);
      return null;
    }
  }

  // 批量獲取參與者資訊 - 使用統一管理器
  async getParticipantsBatch(count: number): Promise<Participant[]> {
    if (count === 0) return [];
    
    console.log(`📋 批量獲取 ${count} 個參與者`);
    const results = await tonApiManager.getParticipantsBatch(this.contractAddress, count);
    
    const participants: Participant[] = [];
    results.forEach((data, index) => {
      if (data?.result?.stack) {
        const stack = data.result.stack;
        if (stack.length > 0 && stack[0][0] === 'tuple') {
          const tupleElements = stack[0][1].elements;
          if (tupleElements && tupleElements.length >= 3) {
            const addressSlice = tupleElements[0].slice?.bytes;
            const amount = parseInt(tupleElements[1].number?.number || '0');
            const timestamp = parseInt(tupleElements[2].number?.number || '0');
            
            participants.push({
              address: addressSlice || '',
              amount: (amount / 1e9).toFixed(4),
              timestamp: timestamp
            });
          }
        }
      }
    });
    
    return participants;
  }

  // 批量獲取中獎記錄
  async getWinnersBatch(rounds: number[]): Promise<(LotteryResult & { round: number })[]> {
    if (rounds.length === 0) return [];
    
    console.log(`🏆 批量獲取 ${rounds.length} 個中獎記錄`);
    const results = await tonApiManager.getWinnersBatch(this.contractAddress, rounds);
    
    const winners: (LotteryResult & { round: number })[] = [];
    results.forEach((data, index) => {
      if (data?.result?.stack) {
        const stack = data.result.stack;
        if (stack.length > 0 && stack[0][0] === 'tuple') {
          const tupleElements = stack[0][1].elements;
          if (tupleElements && tupleElements.length >= 3) {
            const winnerSlice = tupleElements[0].slice?.bytes;
            const nftId = parseInt(tupleElements[1].number?.number || '0');
            const timestamp = parseInt(tupleElements[2].number?.number || '0');
            
            winners.push({
              winner: winnerSlice || '',
              nftId: nftId,
              timestamp: timestamp,
              round: rounds[index]
            });
          }
        }
      }
    });
    
    // 按輪次排序（最新在前）
    return winners.sort((a, b) => b.round - a.round);
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

  // 獲取後備數據
  private getFallbackData(): ContractInfo {
    return {
      owner: this.contractAddress,
      entryFee: '0.01', // 降低顯示費用
      maxParticipants: 3,
      currentRound: 1,
      lotteryActive: true,
      participantCount: 0,
      nftContract: null,
    };
  }
}

// 交易錯誤類型
export const TransactionError = {
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  USER_REJECTED: 'USER_REJECTED',
  CONTRACT_ERROR: 'CONTRACT_ERROR',
  LOTTERY_FULL: 'LOTTERY_FULL',
  LOTTERY_INACTIVE: 'LOTTERY_INACTIVE',
  ALREADY_PARTICIPATED: 'ALREADY_PARTICIPATED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type TransactionErrorType =
  (typeof TransactionError)[keyof typeof TransactionError];

// 錯誤訊息映射
export const ERROR_MESSAGES = {
  [TransactionError.INSUFFICIENT_BALANCE]: {
    title: '餘額不足',
    message: '您的錢包餘額不足以完成這筆交易，請充值後再試',
  },
  [TransactionError.NETWORK_ERROR]: {
    title: '網路錯誤',
    message: '網路連接異常，請檢查網路連接後重試',
  },
  [TransactionError.USER_REJECTED]: {
    title: '交易被拒絕',
    message: '您取消了交易，如需參加抽獎請重新嘗試',
  },
  [TransactionError.CONTRACT_ERROR]: {
    title: '合約錯誤',
    message: '智能合約執行失敗，請稍後重試',
  },
  [TransactionError.LOTTERY_FULL]: {
    title: '抽獎已滿',
    message: '當前抽獎參與人數已滿，請等待下一輪抽獎',
  },
  [TransactionError.LOTTERY_INACTIVE]: {
    title: '抽獎未開放',
    message: '當前抽獎未開放參與，請等待下一輪開始',
  },
  [TransactionError.ALREADY_PARTICIPATED]: {
    title: '已經參與',
    message: '您已經參與了當前輪次的抽獎，請等待抽獎結果',
  },
  [TransactionError.UNKNOWN_ERROR]: {
    title: '未知錯誤',
    message: '發生了未知錯誤，請稍後重試或聯繫客服',
  },
};

// 獲取錢包餘額服務
export class WalletService {
  // 獲取錢包 TON 餘額
  static async getWalletBalance(address: string): Promise<string | null> {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 秒
    const timeout = 10000; // 10 秒超時

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const url = new URL(
          'https://testnet.toncenter.com/api/v2/getAddressBalance'
        );
        url.searchParams.append('address', address);

        // 添加超時控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const balanceResponse = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        clearTimeout(timeoutId);

        if (!balanceResponse.ok) {
          throw new Error(`HTTP error! status: ${balanceResponse.status}, statusText: ${balanceResponse.statusText}`);
        }

        const balanceData = await balanceResponse.json();

        if (balanceData.ok && balanceData.result !== undefined) {
          // 處理可能的字符串結果
          const resultValue = typeof balanceData.result === 'string' 
            ? balanceData.result 
            : balanceData.result.toString();
          
          // 將 nanoTON 轉換為 TON
          const balanceInNano = parseInt(resultValue) || 0;
          const balanceInTON = (balanceInNano / 1e9).toFixed(4);
          
          console.log(`錢包餘額獲取成功: ${address} = ${balanceInTON} TON`);
          return balanceInTON;
        } else {
          throw new Error(`API 返回錯誤: ${JSON.stringify(balanceData)}`);
        }
      } catch (error: any) {
        console.error(`獲取錢包餘額失敗 (嘗試 ${attempt + 1}/${maxRetries}):`, {
          address,
          error: error.message,
          type: error.name,
        });

        // 如果是最後一次嘗試，拋出詳細錯誤
        if (attempt === maxRetries - 1) {
          console.error('所有重試都失敗，詳細錯誤信息:', error);
          return null;
        }

        // 對於某些錯誤類型，不需要重試
        if (error.name === 'AbortError') {
          console.warn('請求超時，將進行重試...');
        } else if (error.message.includes('400')) {
          console.error('地址格式錯誤，停止重試');
          return null;
        }

        // 等待後重試（指數退避）
        await new Promise(resolve => 
          setTimeout(resolve, retryDelay * Math.pow(2, attempt))
        );
      }
    }

    console.error('獲取錢包餘額的所有重試都失敗');
    return null;
  }

  // 檢查餘額是否足夠
  static async checkSufficientBalance(
    address: string,
    requiredAmount: number
  ): Promise<{ sufficient: boolean; balance: number; required: number }> {
    try {
      const balanceStr = await this.getWalletBalance(address);
      const balance = balanceStr ? parseFloat(balanceStr) : 0;

      return {
        sufficient: balance >= requiredAmount,
        balance,
        required: requiredAmount,
      };
    } catch (error) {
      console.error('檢查餘額失敗:', error);
      return {
        sufficient: false,
        balance: 0,
        required: requiredAmount,
      };
    }
  }

  // 分析交易錯誤
  static analyzeTransactionError(error: any): TransactionErrorType {
    if (!error) return TransactionError.UNKNOWN_ERROR;

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code;

    // 用戶拒絕交易
    if (errorCode === 4001 || errorMessage.includes('user rejected')) {
      return TransactionError.USER_REJECTED;
    }

    // 餘額不足
    if (
      errorMessage.includes('insufficient') ||
      errorMessage.includes('balance') ||
      errorCode === -32000
    ) {
      return TransactionError.INSUFFICIENT_BALANCE;
    }

    // 網路錯誤
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('timeout') ||
      errorCode === -32603
    ) {
      return TransactionError.NETWORK_ERROR;
    }

    // 合約錯誤
    if (
      errorMessage.includes('contract') ||
      errorMessage.includes('execution') ||
      errorCode === -32015
    ) {
      return TransactionError.CONTRACT_ERROR;
    }

    return TransactionError.UNKNOWN_ERROR;
  }

  // 格式化 TON 金額顯示
  static formatTON(amount: string | null): string {
    if (!amount) return '0.0000 TON';
    const tonAmount = parseFloat(amount);
    return `${tonAmount.toFixed(4)} TON`;
  }
}

// 建立合約服務實例
export const createContractService = (
  contractAddress: string
): ContractService => {
  return new ContractService(contractAddress);
};
