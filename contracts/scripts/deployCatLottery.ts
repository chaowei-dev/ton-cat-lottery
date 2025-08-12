import { toNano } from '@ton/core';
import { CatLottery } from '../build/CatLottery_CatLottery';
import { NetworkProvider } from '@ton/blueprint';
import { 
  DeploymentValidator, 
  ContractChecker, 
  DeploymentLogger, 
  SafeDeployment 
} from './deploymentUtils';

export async function run(provider: NetworkProvider) {
  const ui = provider.ui();

  ui.write('🚀 正在部署 CatLottery 合約...');

  // 載入配置
  const config = DeploymentLogger.loadConfig();
  
  // 合約初始化參數 (固定參數，不再動態變化)
  const ENTRY_FEE = toNano(config.catLottery.entryFee);
  const MAX_PARTICIPANTS = config.catLottery.maxParticipants;
  const DEPLOYMENT_FEE = toNano(config.catLottery.deploymentFee);

  // 安全驗證
  await DeploymentValidator.validateNetwork(provider, config.network);
  await DeploymentValidator.validateBalance(provider, config.minBalance);

  // 獲取並驗證部署者地址
  const deployerAddress = DeploymentValidator.validateDeployerAddress(provider.sender().address);

  ui.write(`📦 部署者地址: ${deployerAddress}`);
  ui.write(`🔗 部署者 tonviewer：https://testnet.tonviewer.com/${deployerAddress}`);
  ui.write(`💰 參與費用: ${Number(ENTRY_FEE) / 1e9} TON`);
  ui.write(`👥 最大參與人數: ${MAX_PARTICIPANTS}`);

  // 創建合約實例，保持參數固定
  let catLottery = provider.open(
    await CatLottery.fromInit(
      deployerAddress,
      ENTRY_FEE,  // 固定參與費用
      BigInt(MAX_PARTICIPANTS)
    )
  );

  ui.write(`\n`);
  ui.write(`📍 預計合約地址: ${catLottery.address}`);
  ui.write(`🔗 合約 tonviewer: https://testnet.tonviewer.com/${catLottery.address}`);
  ui.write(`🔨 請記得在 Tonkeeper （https://wallet.tonkeeper.com/coins）中確認交易！`);
  ui.write(`\n`);

  // 檢查現有合約並獲取用戶選擇
  const choice = await ContractChecker.checkExistingContract(
    provider,
    catLottery.address,
    'CatLottery',
    async () => {
      const info = await catLottery.getGetContractInfo();
      return {
        '擁有者': info.owner,
        '參與費用': `${info.entryFee} nanoTON`,
        '最大參與人數': info.maxParticipants,
        '當前輪次': info.currentRound,
        '抽獎狀態': info.lotteryActive ? '活躍' : '非活躍',
        '參與者數量': info.participantCount
      };
    }
  );

  if (choice === 'use_existing') {
    ui.write(`\n💡 使用現有 CatLottery 合約: ${catLottery.address}`);
    return;
  } else if (choice === 'exit') {
    return;
  }

  // 需要部署新合約時，生成不同的參數組合
  if (choice === 'deploy_new') {
    ui.write(`🔄 生成新合約實例...`);
    ui.write(`⚠️ 注意：相同參數會產生相同地址，請修改參數或使用不同部署者地址`);
    
    catLottery = provider.open(
      await CatLottery.fromInit(
        deployerAddress,
        ENTRY_FEE,
        BigInt(MAX_PARTICIPANTS)
      )
    );
    
    ui.write(`📍 新合約地址: ${catLottery.address}`);
  }

  // 部署合約
  ui.write(`💸 發送部署交易...`);
  ui.write(`💰 部署費用: ${Number(DEPLOYMENT_FEE) / 1e9} TON`);
  ui.write(`📱 請在錢包中確認交易...`);
  
  // 直接發送交易，不等待回應
  catLottery.send(
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
  ui.write(`📍 合約地址: ${catLottery.address}`);
  ui.write(`🔗 TON Explorer: https://testnet.tonviewer.com/${catLottery.address}`);
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
    const contractInfo = await catLottery.getGetContractInfo();
    ui.write(`✅ 合約驗證成功:`);
    ui.write(`   - 擁有者: ${contractInfo.owner}`);
    ui.write(`   - 參與費用: ${contractInfo.entryFee} nanoTON`);
    ui.write(`   - 最大參與人數: ${contractInfo.maxParticipants}`);
    ui.write(`   - 當前輪次: ${contractInfo.currentRound}`);
    ui.write(
      `   - 抽獎狀態: ${contractInfo.lotteryActive ? '活躍' : '非活躍'}`
    );
    ui.write(`   - 參與者數量: ${contractInfo.participantCount}`);
  } catch (error) {
    ui.write(`⚠️ 無法驗證合約狀態: ${error}`);
  }

  ui.write(`\n✅ CatLottery 合約部署完成！`);
  ui.write(`🔗 合約 tonviewer: https://testnet.tonviewer.com/${catLottery.address}`);
  ui.write(`📍 合約地址: ${catLottery.address}`);

  // 保存部署資訊到文件
  const deploymentInfo = {
    network: config.network,
    contractAddress: catLottery.address.toString(),
    deployerAddress: deployerAddress.toString(),
    entryFee: ENTRY_FEE.toString(),
    maxParticipants: MAX_PARTICIPANTS,
    deployedAt: new Date().toISOString(),
    explorerUrl: `https://testnet.tonviewer.com/${catLottery.address}`,
  };

  await DeploymentLogger.saveDeploymentInfo('catLottery', deploymentInfo);
}
