import { toNano, Address } from '@ton/core';
import { CatLottery } from '../build/CatLottery/tact_CatLottery';
import { NetworkProvider, compile, sleep } from '@ton/blueprint';
import { mnemonicToWalletKey } from 'ton-crypto';
import { WalletContractV4 } from '@ton/ton';

export async function run(provider: NetworkProvider, args: string[]) {
  const ui = provider.ui();

  // 解析命令行參數
  const network = args.includes('--network')
    ? args[args.indexOf('--network') + 1]
    : 'testnet';

  ui.write(`🚀 正在部署 CatLottery 合約到 ${network}...`);

  // 合約初始化參數
  const ENTRY_FEE = toNano('0.01'); // 0.01 TON 參與費用 (降低費用)
  const MAX_PARTICIPANTS = 3; // 最大參與人數 (降低門檻便於測試)

  // 獲取部署者錢包
  const deployer = provider.sender();
  const deployerAddress = deployer.address;

  if (!deployerAddress) {
    throw new Error('無法獲取部署者地址');
  }

  ui.write(`📦 部署者地址: ${deployerAddress}`);
  ui.write(
    `💰 參與費用: ${ENTRY_FEE} nanoTON (${Number(ENTRY_FEE) / 1e9} TON)`
  );
  ui.write(`👥 最大參與人數: ${MAX_PARTICIPANTS}`);

  // 編譯並部署合約
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
    return;
  }

  // 部署合約
  ui.write(`🔨 正在部署合約...`);

  await catLottery.send(
    deployer,
    {
      value: toNano('1'), // 部署費用
    },
    {
      $$type: 'Deploy',
      queryId: 0n,
    }
  );

  // 等待部署完成
  ui.write(`⏳ 等待部署確認...`);
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    if (await provider.isContractDeployed(catLottery.address)) {
      break;
    }
    attempts++;
    await sleep(2000);
    ui.write(`🔄 檢查部署狀態 (${attempts}/${maxAttempts})...`);
  }

  if (attempts >= maxAttempts) {
    throw new Error('部署超時，請檢查網路狀況');
  }

  ui.write(`🎉 部署成功！`);
  ui.write(`📍 合約地址: ${catLottery.address}`);
  ui.write(
    `🔗 TON Explorer: https://${
      network === 'mainnet' ? '' : 'testnet.'
    }tonviewer.com/${catLottery.address}`
  );

  // 驗證合約狀態
  ui.write(`🔍 驗證合約狀態...`);

  try {
    const contractInfo = await catLottery.getContractInfo();

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
    ui.write(`⚠️  無法驗證合約狀態: ${error}`);
  }

  // 提供後續操作建議
  ui.write(`\n📋 後續操作建議:`);
  ui.write(`1. 設定 NFT 合約地址:`);
  ui.write(`   使用 SetNFTContract 消息設定 NFT 合約地址`);
  ui.write(`2. 開始接受參與者:`);
  ui.write(
    `   用戶可發送 "join" 消息並支付 ${Number(ENTRY_FEE) / 1e9} TON 參與抽獎`
  );
  ui.write(`3. 進行抽獎:`);
  ui.write(`   部署者可發送 "drawWinner" 消息進行抽獎`);

  // 保存部署資訊
  const deploymentInfo = {
    network: network,
    contractAddress: catLottery.address.toString(),
    deployerAddress: deployerAddress.toString(),
    entryFee: ENTRY_FEE.toString(),
    maxParticipants: MAX_PARTICIPANTS,
    deployedAt: new Date().toISOString(),
    explorerUrl: `https://${
      network === 'mainnet' ? '' : 'testnet.'
    }tonviewer.com/${catLottery.address}`,
  };

  ui.write(`\n💾 部署資訊已保存到控制台，請記錄以下資訊:`);
  ui.write(JSON.stringify(deploymentInfo, null, 2));
}
