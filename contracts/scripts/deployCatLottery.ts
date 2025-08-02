import { toNano } from '@ton/core';
import { CatLottery } from '../build/CatLottery_CatLottery';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
  const ui = provider.ui();

  ui.write('🚀 正在部署 CatLottery 合約...');

  // 合約初始化參數
  const ENTRY_FEE = toNano('0.01'); // 0.01 TON 參與費用 (降低費用)
  const MAX_PARTICIPANTS = 10; // 最大參與人數

  // 獲取部署者地址
  const deployerAddress = provider.sender().address;
  if (!deployerAddress) {
    throw new Error('無法獲取部署者地址');
  }

  ui.write(`📦 部署者地址: ${deployerAddress}`);
  ui.write(`💰 參與費用: ${Number(ENTRY_FEE) / 1e9} TON`);
  ui.write(`👥 最大參與人數: ${MAX_PARTICIPANTS}`);

  // 創建合約實例
  const catLottery = provider.open(
    await CatLottery.fromInit(
      deployerAddress,
      ENTRY_FEE,
      BigInt(MAX_PARTICIPANTS)
    )
  );

  // 檢查合約是否已部署
  if (await provider.isContractDeployed(catLottery.address)) {
    ui.write(`✅ 合約已部署在: ${catLottery.address}`);

    // 顯示合約信息
    try {
      const contractInfo = await catLottery.getGetContractInfo();
      ui.write(`\n📊 合約狀態:`);
      ui.write(`   - 擁有者: ${contractInfo.owner}`);
      ui.write(`   - 參與費用: ${contractInfo.entryFee} nanoTON`);
      ui.write(`   - 最大參與人數: ${contractInfo.maxParticipants}`);
      ui.write(`   - 當前輪次: ${contractInfo.currentRound}`);
      ui.write(
        `   - 抽獎狀態: ${contractInfo.lotteryActive ? '活躍' : '非活躍'}`
      );
      ui.write(`   - 參與者數量: ${contractInfo.participantCount}`);
    } catch (error) {
      ui.write(`⚠️ 無法獲取合約狀態: ${error}`);
    }

    return;
  }

  // 部署合約
  ui.write(`🔨 正在部署合約...`);

  await catLottery.send(
    provider.sender(),
    {
      value: toNano('0.2'), // 部署費用
    },
    {
      $$type: 'Deploy',
      queryId: 0n,
    }
  );

  // 等待部署完成
  await provider.waitForDeploy(catLottery.address);

  ui.write(`🎉 部署成功！`);
  ui.write(`📍 合約地址: ${catLottery.address}`);
  ui.write(
    `🔗 TON Explorer: https://testnet.tonviewer.com/${catLottery.address}`
  );

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

  // 提供後續操作建議
  ui.write(`\n📋 後續操作建議:`);
  ui.write(`1. 更新前端合約地址:`);
  ui.write(`   CONTRACT_ADDRESS = '${catLottery.address}'`);
  ui.write(`2. 設定 NFT 合約地址 (如果有):`);
  ui.write(`   使用 SetNFTContract 消息`);
  ui.write(`3. 開始接受參與者:`);
  ui.write(`   用戶可發送 "join" 消息並支付 ${Number(ENTRY_FEE) / 1e9} TON`);
  ui.write(`4. 進行抽獎:`);
  ui.write(`   部署者可發送 "drawWinner" 消息`);

  // 保存部署資訊到文件
  const deploymentInfo = {
    network: 'testnet',
    contractAddress: catLottery.address.toString(),
    deployerAddress: deployerAddress.toString(),
    entryFee: ENTRY_FEE.toString(),
    maxParticipants: MAX_PARTICIPANTS,
    deployedAt: new Date().toISOString(),
    explorerUrl: `https://testnet.tonviewer.com/${catLottery.address}`,
  };

  try {
    const fs = require('fs');
    const path = require('path');
    const deploymentsDir = path.join(__dirname, '../deployments');

    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = `catLottery-${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
    ui.write(`💾 部署資訊已保存至: ${filename}`);
  } catch (error) {
    ui.write(`⚠️ 保存部署資訊失敗: ${error}`);
  }
}
