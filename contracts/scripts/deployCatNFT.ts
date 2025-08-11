import { toNano } from '@ton/core';
import { CatNFT } from '../build/CatNFT_CatNFT';
import { NetworkProvider } from '@ton/blueprint';
import { 
  DeploymentValidator, 
  ContractChecker, 
  DeploymentLogger, 
  SafeDeployment 
} from './deploymentUtils';

export async function run(provider: NetworkProvider) {
  const ui = provider.ui();

  ui.write('🐱 正在部署 CatNFT 合約...');

  // 載入配置
  const config = DeploymentLogger.loadConfig();
  const DEPLOYMENT_FEE = toNano(config.catNFT.deploymentFee);

  // 安全驗證
  await DeploymentValidator.validateNetwork(provider, config.network);
  await DeploymentValidator.validateBalance(provider, config.minBalance);

  // 獲取並驗證部署者地址
  const deployerAddress = DeploymentValidator.validateDeployerAddress(provider.sender().address);

  ui.write(`📦 部署者地址: ${deployerAddress}`);
  ui.write(`🔗 部署者 tonviewer：https://testnet.tonviewer.com/${deployerAddress}`);
  
  // 檢查錢包連接狀態
  ui.write(`🔍 檢查錢包連接狀態...`);
  try {
    const sender = provider.sender();
    if (!sender) {
      throw new Error('錢包未連接');
    }
    ui.write(`✅ 錢包連接正常`);
  } catch (error) {
    ui.write(`❌ 錢包連接問題: ${error}`);
    return;
  }

  // 使用配置的默認 salt 檢查預設合約
  let salt = BigInt(config.catNFT.defaultSalt);
  let catNFT = provider.open(
    await CatNFT.fromInit(deployerAddress, salt)
  );

  ui.write(`\n`);
  ui.write(`📍 預計合約地址: ${catNFT.address}`);
  ui.write(`🔗 合約 tonviewer: https://testnet.tonviewer.com/${catNFT.address}`);
  ui.write(`🔨 請記得在 Tonkeeper （https://wallet.tonkeeper.com/coins）中確認交易！`);
  ui.write(`\n`);

  // 檢查現有合約並獲取用戶選擇
  const choice = await ContractChecker.checkExistingContract(
    provider,
    catNFT.address,
    'CatNFT',
    async () => {
      const info = await catNFT.getGetContractInfo();
      const contractInfo: any = {
        '擁有者': info.owner,
        '授權鑄造者': info.authorizedMinter || '未設定',
        '下一個 NFT ID': info.nextTokenId,
        '總供應量': info.totalSupply
      };

      // 添加貓咪模板信息
      ui.write(`\n🐱 貓咪模板:`);
      for (let i = 0; i < 4; i++) {
        try {
          const template = await catNFT.getGetCatTemplate(BigInt(i));
          if (template) {
            ui.write(`   ${i}: ${template.name} (${template.rarity})`);
          }
        } catch (e) {
          // 忽略錯誤
        }
      }

      return contractInfo;
    }
  );

  if (choice === 'use_existing') {
    ui.write(`\n💡 使用現有 CatNFT 合約: ${catNFT.address}`);
    return;
  } else if (choice === 'exit') {
    return;
  }
    
  // 需要部署新合約時，生成新的 salt
  if (choice === 'deploy_new') {
    salt = SafeDeployment.generateUniqueSalt();
    ui.write(`🔄 將部署新的合約實例...`);
    ui.write(`🎲 使用 salt: ${salt}`);
    
    catNFT = provider.open(
      await CatNFT.fromInit(deployerAddress, salt)
    );
    
    ui.write(`📍 新合約地址: ${catNFT.address}`);
  }

  // 部署合約
  ui.write(`💸 發送部署交易...`);
  ui.write(`💰 部署費用: ${Number(DEPLOYMENT_FEE) / 1e9} TON`);
  ui.write(`📱 請在錢包中確認交易...`);
  
  // 直接發送交易，不等待回應
  catNFT.send(
    provider.sender(),
    {
      value: DEPLOYMENT_FEE,
    },
    {
      $$type: 'Deploy',
      queryId: BigInt(0),
    }
  );
  
  ui.write(`\n✅ 部署交易已發送！`);
  ui.write(`📍 合約地址: ${catNFT.address}`);
  ui.write(`🔗 TON Explorer: https://testnet.tonviewer.com/${catNFT.address}`);
  ui.write(`📝 注意：交易已發送到區塊鏈，請稍等幾分鐘讓交易確認`);
  ui.write(`\n⏳ 請在錢包中確認交易，然後等待幾分鐘讓交易確認...`);
  
  // 手動確認部署狀態
  ui.write(`\n❓ 請確認部署狀態:`);
  ui.write(`   1. 部署成功 - 繼續驗證合約`);
  ui.write(`   2. 部署失敗 - 退出腳本`);

  const deployChoice = await ui.choose('部署狀態', ['部署成功', '部署失敗'], (c) => c);

  if (deployChoice === '部署失敗') {
    ui.write(`👋 腳本已退出`);
    return;
  }

  ui.write(`🎉 繼續驗證合約狀態...`);

  // 驗證合約狀態
  ui.write(`🔍 驗證合約狀態...`);
  try {
    const contractInfo = await catNFT.getGetContractInfo();
    ui.write(`✅ 合約驗證成功:`);
    ui.write(`   - 擁有者: ${contractInfo.owner}`);
    ui.write(`   - 授權鑄造者: ${contractInfo.authorizedMinter || '未設定'}`);
    ui.write(`   - 下一個 NFT ID: ${contractInfo.nextTokenId}`);
    ui.write(`   - 總供應量: ${contractInfo.totalSupply}`);

    // 驗證貓咪模板
    ui.write(`\n🐱 驗證貓咪模板:`);
    for (let i = 0; i < 4; i++) {
      try {
        const template = await catNFT.getGetCatTemplate(BigInt(i));
        if (template) {
          ui.write(`   ✅ ${template.name} (${template.rarity}) - ${template.description}`);
        }
      } catch (error) {
        ui.write(`   ❌ 模板 ${i} 獲取失敗: ${error}`);
      }
    }
  } catch (error) {
    ui.write(`⚠️ 無法驗證合約狀態: ${error}`);
  }

  ui.write(`\n✅ CatNFT 合約部署完成！`);
  ui.write(`📍 合約地址: ${catNFT.address}`);

  // 保存部署資訊到文件
  const deploymentInfo = {
    network: config.network,
    contractAddress: catNFT.address.toString(),
    deployerAddress: deployerAddress.toString(),
    salt: salt.toString(),
    deployedAt: new Date().toISOString(),
    explorerUrl: `https://testnet.tonviewer.com/${catNFT.address}`,
    catTemplates: [
      'Tabby (Common)',
      'Siamese Princess (Rare)',
      'Maine Coon King (Epic)',
      'Cosmic Cat (Legendary)'
    ]
  };

  await DeploymentLogger.saveDeploymentInfo('catNFT', deploymentInfo);
}