import { toNano } from '@ton/core';
import { CatNFT } from '../build/CatNFT_CatNFT';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
  const ui = provider.ui();

  ui.write('🐱 正在部署 CatNFT 合約...');

  // 獲取部署者地址
  const deployerAddress = provider.sender().address;
  if (!deployerAddress) {
    throw new Error('無法獲取部署者地址');
  }

  ui.write(`📦 部署者地址: ${deployerAddress}`);
  ui.write(`🔗 部署者 tonviewer：https://testnet.tonviewer.com/${deployerAddress}`);

  // 創建合約實例
  const catNFT = provider.open(
    await CatNFT.fromInit(deployerAddress)
  );

  ui.write(`\n`);
  ui.write(`📍 預計合約地址: ${catNFT.address}`);
  ui.write(`🔗 合約 tonviewer: https://testnet.tonviewer.com/${catNFT.address}`);
  ui.write(`🔨 請記得在 Tonkeeper （https://wallet.tonkeeper.com/coins）中確認交易！`);
  ui.write(`\n`);

  // 檢查合約是否已部署
  if (await provider.isContractDeployed(catNFT.address)) {
    ui.write(`✅ 合約已部署在: ${catNFT.address}`);

    // 顯示合約信息
    try {
      const contractInfo = await catNFT.getGetContractInfo();
      ui.write(`\n📊 合約狀態:`);
      ui.write(`   - 擁有者: ${contractInfo.owner}`);
      ui.write(`   - 授權鑄造者: ${contractInfo.authorizedMinter || '未設定'}`);
      ui.write(`   - 下一個 NFT ID: ${contractInfo.nextTokenId}`);
      ui.write(`   - 總供應量: ${contractInfo.totalSupply}`);

      // 顯示貓咪模板
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
    } catch (error) {
      ui.write(`⚠️ 無法獲取合約狀態: ${error}`);
    }

    return;
  }

  // 部署合約
  ui.write(`🔨 正在部署合約...`);

  await catNFT.send(
    provider.sender(),
    {
      value: toNano('0.3'), // NFT 合約需要更多部署費用
    },
    {
      $$type: 'Deploy',
      queryId: 0n,
    }
  );

  // 等待部署完成
  await provider.waitForDeploy(catNFT.address);

  ui.write(`🎉 部署成功！`);
  ui.write(`📍 合約地址: ${catNFT.address}`);
  ui.write(
    `🔗 TON Explorer: https://testnet.tonviewer.com/${catNFT.address}`
  );

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

  // 提供後續操作建議
  ui.write(`\n📋 後續操作建議:`);
  ui.write(`1. 設定授權鑄造者 (CatLottery 合約地址):`);
  ui.write(`   使用 SetAuthorizedMinter 消息`);
  ui.write(`2. 在 CatLottery 合約中設定 NFT 合約地址:`);
  ui.write(`   CONTRACT_ADDRESS = '${catNFT.address}'`);
  ui.write(`3. 測試 NFT 鑄造:`);
  ui.write(`   從授權鑄造者發送 MintTo 消息`);

  // 保存部署資訊到文件
  const deploymentInfo = {
    network: 'testnet',
    contractAddress: catNFT.address.toString(),
    deployerAddress: deployerAddress.toString(),
    deployedAt: new Date().toISOString(),
    explorerUrl: `https://testnet.tonviewer.com/${catNFT.address}`,
    catTemplates: [
      'Tabby (Common)',
      'Siamese Princess (Rare)',
      'Maine Coon King (Epic)',
      'Cosmic Cat (Legendary)'
    ]
  };

  try {
    const fs = require('fs');
    const path = require('path');
    const deploymentsDir = path.join(__dirname, '../deployments');

    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = `catNFT-${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
    ui.write(`💾 部署資訊已保存至: ${filename}`);
  } catch (error) {
    ui.write(`⚠️ 保存部署資訊失敗: ${error}`);
  }
}