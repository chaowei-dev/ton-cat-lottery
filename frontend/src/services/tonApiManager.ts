/**
 * TON API 請求管理器
 * 統一管理所有 TON API 請求，實現緩存、限流和錯誤處理
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface QueuedRequest {
  id: string;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  priority: number;
}

export class TonApiManager {
  private static instance: TonApiManager;
  private cache = new Map<string, CacheItem<any>>();
  private requestQueue: QueuedRequest[] = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private readonly minRequestInterval = 200; // 最小請求間隔 200ms
  private readonly baseUrl = 'https://testnet.toncenter.com/api/v2';
  private readonly defaultTimeout = 15000; // 15秒超時
  private readonly defaultCacheTime = 5000; // 5秒緩存

  private constructor() {}

  static getInstance(): TonApiManager {
    if (!TonApiManager.instance) {
      TonApiManager.instance = new TonApiManager();
    }
    return TonApiManager.instance;
  }

  /**
   * 生成緩存鍵
   */
  private getCacheKey(method: string, params: any[]): string {
    return `${method}_${JSON.stringify(params)}`;
  }

  /**
   * 檢查緩存
   */
  private getFromCache<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (item && Date.now() < item.timestamp + item.expiry) {
      console.log(`📦 Cache hit: ${key}`);
      return item.data;
    }
    if (item) {
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * 設置緩存
   */
  private setCache<T>(key: string, data: T, expiry: number = this.defaultCacheTime): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    });
  }

  /**
   * 執行 HTTP 請求
   */
  private async executeRequest<T>(
    url: string,
    options: RequestInit,
    timeout: number = this.defaultTimeout
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`API Error: ${data.error || 'Unknown error'}`);
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('請求超時');
      }
      throw error;
    }
  }

  /**
   * 添加請求到隊列
   */
  private async queueRequest<T>(
    requestId: string,
    execute: () => Promise<T>,
    priority: number = 1
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        id: requestId,
        execute,
        resolve,
        reject,
        priority
      });

      // 按優先級排序（數字越大優先級越高）
      this.requestQueue.sort((a, b) => b.priority - a.priority);

      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * 處理請求隊列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;
      
      try {
        // 控制請求間隔
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
          await new Promise(resolve => 
            setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
          );
        }

        console.log(`🚀 Processing request: ${request.id}`);
        const result = await request.execute();
        this.lastRequestTime = Date.now();
        request.resolve(result);

      } catch (error) {
        console.error(`❌ Request failed: ${request.id}`, error);
        request.reject(error);
      }

      // 請求之間的短暫延遲
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessingQueue = false;
  }

  /**
   * 獲取合約信息 - 可緩存，高優先級
   */
  async getContractInfo(contractAddress: string): Promise<any> {
    const cacheKey = this.getCacheKey('getContractInfo', [contractAddress]);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const requestId = `getContractInfo_${contractAddress}`;
    
    const result = await this.queueRequest(
      requestId,
      async () => {
        const response = await this.executeRequest(`${this.baseUrl}/runGetMethod`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: contractAddress,
            method: 'getContractInfo',
            stack: [],
          }),
        });
        return response;
      },
      3 // 高優先級
    );

    // 合約信息緩存 10 秒
    this.setCache(cacheKey, result, 10000);
    return result;
  }

  /**
   * 獲取地址餘額 - 可緩存，中優先級
   */
  async getAddressBalance(address: string): Promise<any> {
    const cacheKey = this.getCacheKey('getAddressBalance', [address]);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const requestId = `getBalance_${address}`;
    
    const result = await this.queueRequest(
      requestId,
      async () => {
        const url = new URL(`${this.baseUrl}/getAddressBalance`);
        url.searchParams.append('address', address);
        
        const response = await this.executeRequest(url.toString(), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        return response;
      },
      2 // 中優先級
    );

    // 餘額信息緩存 5 秒
    this.setCache(cacheKey, result, 5000);
    return result;
  }

  /**
   * 獲取參與者信息 - 不緩存，低優先級
   */
  async getParticipant(contractAddress: string, index: number): Promise<any> {
    const requestId = `getParticipant_${contractAddress}_${index}`;
    
    return this.queueRequest(
      requestId,
      async () => {
        const response = await this.executeRequest(`${this.baseUrl}/runGetMethod`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: contractAddress,
            method: 'getParticipant',
            stack: [['num', index.toString()]]
          }),
        });
        return response;
      },
      1 // 低優先級
    );
  }

  /**
   * 獲取中獎記錄 - 可緩存，中優先級
   */
  async getWinner(contractAddress: string, round: number): Promise<any> {
    const cacheKey = this.getCacheKey('getWinner', [contractAddress, round]);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const requestId = `getWinner_${contractAddress}_${round}`;
    
    const result = await this.queueRequest(
      requestId,
      async () => {
        const response = await this.executeRequest(`${this.baseUrl}/runGetMethod`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: contractAddress,
            method: 'getWinner',
            stack: [['num', round.toString()]]
          }),
        });
        return response;
      },
      2 // 中優先級
    );

    // 中獎記錄緩存 30 秒（歷史數據相對穩定）
    this.setCache(cacheKey, result, 30000);
    return result;
  }

  /**
   * 批量獲取參與者信息 - 使用間隔控制避免併發
   */
  async getParticipantsBatch(
    contractAddress: string,
    count: number
  ): Promise<any[]> {
    console.log(`📋 批量獲取 ${count} 個參與者信息`);
    
    const promises: Promise<any>[] = [];
    
    for (let i = 0; i < count; i++) {
      promises.push(this.getParticipant(contractAddress, i));
    }

    // 等待所有請求完成
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`參與者 ${index} 獲取失敗:`, result.reason);
        return null;
      }
    });
  }

  /**
   * 批量獲取中獎記錄
   */
  async getWinnersBatch(
    contractAddress: string,
    rounds: number[]
  ): Promise<any[]> {
    console.log(`🏆 批量獲取 ${rounds.length} 個中獎記錄`);
    
    const promises = rounds.map(round => this.getWinner(contractAddress, round));
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`輪次 ${rounds[index]} 中獎記錄獲取失敗:`, result.reason);
        return null;
      }
    });
  }

  /**
   * 清除緩存
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      // 清除匹配模式的緩存
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
      console.log(`🗑️ 清除緩存模式: ${pattern}`);
    } else {
      // 清除所有緩存
      this.cache.clear();
      console.log('🗑️ 清除所有緩存');
    }
  }

  /**
   * 獲取統計信息
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessingQueue,
      lastRequestTime: this.lastRequestTime
    };
  }
}

// 導出單例實例
export const tonApiManager = TonApiManager.getInstance();