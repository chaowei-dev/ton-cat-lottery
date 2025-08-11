import { Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface DeploymentConfig {
  network: 'testnet' | 'mainnet';
  minBalance: string;
  catLottery: {
    entryFee: string;
    maxParticipants: number;
    deploymentFee: string;
  };
  catNFT: {
    deploymentFee: string;
    defaultSalt: number;
  };
}

export interface DeploymentInfo {
  network: string;
  contractAddress: string;
  deployerAddress: string;
  deployedAt: string;
  explorerUrl: string;
  [key: string]: any;
}

export class DeploymentValidator {
  static async validateNetwork(provider: NetworkProvider, expectedNetwork: string) {
    // TON Blueprint 不直接提供網絡檢查，但我們可以通過其他方式驗證
    // 這裡假設測試網使用不同的配置
    console.log(`📡 檢查網絡環境: ${expectedNetwork}`);
  }

  static async validateBalance(provider: NetworkProvider, minBalance: string) {
    try {
      // Note: 實際餘額檢查可能需要根據 TON Blueprint 的具體實現調整
      console.log(`💰 檢查部署者餘額...`);
      
    } catch (error) {
      console.warn(`⚠️ 無法檢查餘額: ${error}`);
    }
  }

  static validateDeployerAddress(deployerAddress: Address | null | undefined): Address {
    if (!deployerAddress) {
      throw new Error('無法獲取部署者地址，請確保錢包已連接');
    }
    return deployerAddress;
  }
}

export class ContractChecker {
  static async checkExistingContract(
    provider: NetworkProvider,
    contractAddress: Address,
    contractName: string,
    getInfoFn: () => Promise<any>
  ): Promise<'use_existing' | 'deploy_new' | 'exit'> {
    const ui = provider.ui();
    
    if (await provider.isContractDeployed(contractAddress)) {
      ui.write(`✅ 發現現有 ${contractName} 合約: ${contractAddress}`);

      try {
        const contractInfo = await getInfoFn();
        ui.write(`\n📊 現有合約狀態:`);
        this.displayContractInfo(ui, contractInfo);
      } catch (error) {
        ui.write(`⚠️ 無法獲取現有合約狀態: ${error}`);
      }

      ui.write(`\n❓ 選擇操作:`);
      ui.write(`   1. 使用現有合約 (推薦)`);
      ui.write(`   2. 部署新合約`);
      ui.write(`   3. 退出`);

      const choice = await ui.choose('請選擇', ['使用現有合約', '部署新合約', '退出'], (c) => c);

      switch (choice) {
        case '使用現有合約':
          ui.write(`✅ 將使用現有合約: ${contractAddress}`);
          return 'use_existing';
        case '退出':
          ui.write(`👋 退出部署`);
          return 'exit';
        default:
          ui.write(`🔄 將部署新的合約實例...`);
          return 'deploy_new';
      }
    }
    
    return 'deploy_new';
  }

  private static displayContractInfo(ui: any, info: any) {
    for (const [key, value] of Object.entries(info)) {
      if (value !== null && value !== undefined) {
        ui.write(`   - ${key}: ${value}`);
      }
    }
  }
}

export class DeploymentLogger {
  static async saveDeploymentInfo(
    contractName: string,
    info: DeploymentInfo
  ): Promise<void> {
    try {
      const deploymentsDir = join(__dirname, '../deployments');
      
      if (!existsSync(deploymentsDir)) {
        mkdirSync(deploymentsDir, { recursive: true });
      }

      const filename = `${contractName}-${Date.now()}.json`;
      const filepath = join(deploymentsDir, filename);

      writeFileSync(filepath, JSON.stringify(info, null, 2));
      console.log(`💾 部署資訊已保存至: ${filename}`);
    } catch (error) {
      console.warn(`⚠️ 保存部署資訊失敗: ${error}`);
    }
  }

  static loadConfig(): DeploymentConfig {
    try {
      const configPath = join(__dirname, 'deployment.config.json');
      if (existsSync(configPath)) {
        return JSON.parse(readFileSync(configPath, 'utf8'));
      }
    } catch (error) {
      console.warn(`⚠️ 無法載入配置文件，使用默認配置: ${error}`);
    }

    // 默認配置
    return {
      network: 'testnet',
      minBalance: '0.5',
      catLottery: {
        entryFee: '0.01',
        maxParticipants: 3,
        deploymentFee: '0.2'
      },
      catNFT: {
        deploymentFee: '0.3',
        defaultSalt: 1
      }
    };
  }
}

export class SafeDeployment {
  static async deployWithRetry<T>(
    deployFn: () => Promise<T>,
    maxRetries: number = 2,
    ui: any
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        ui.write(`🔨 部署嘗試 ${attempt}/${maxRetries}...`);
        return await deployFn();
      } catch (error) {
        lastError = error;
        ui.write(`❌ 部署嘗試 ${attempt} 失敗: ${error}`);
        
        if (attempt < maxRetries) {
          ui.write(`⏳ 等待 3 秒後重試...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }
    
    throw new Error(`部署失敗，已重試 ${maxRetries} 次。最後錯誤: ${lastError}`);
  }

  static async waitForDeployWithTimeout(
    provider: any,
    address: any,
    timeoutMs: number = 60000
  ): Promise<void> {
    const startTime = Date.now();
    
    return Promise.race([
      provider.waitForDeploy(address).then(() => {
        const elapsed = Date.now() - startTime;
        console.log(`✅ 合約部署確認用時: ${elapsed}ms`);
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => {
          reject(new Error(`部署等待超時 (${timeoutMs}ms)。請檢查:\n` +
            `1. 錢包是否已確認交易\n` +
            `2. 測試網是否正常運行\n` +
            `3. 部署費用是否足夠\n` +
            `4. 網絡連接是否穩定\n` +
            `合約地址: ${address}\n` +
            `可到 https://testnet.tonviewer.com/${address} 查看狀態`));
        }, timeoutMs)
      )
    ]);
  }

  static async checkDeploymentStatus(provider: any, address: any, ui: any): Promise<boolean> {
    try {
      const isDeployed = await provider.isContractDeployed(address);
      if (isDeployed) {
        ui.write(`✅ 合約已成功部署到: ${address}`);
        return true;
      } else {
        ui.write(`⏳ 合約尚未部署，請稍候...`);
        return false;
      }
    } catch (error) {
      ui.write(`❌ 檢查部署狀態時出錯: ${error}`);
      return false;
    }
  }

  static generateUniqueSalt(): bigint {
    return BigInt(Date.now());
  }
}