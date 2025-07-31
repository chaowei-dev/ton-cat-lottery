import { toNano, Address } from '@ton/core';
import { CatNFT } from '../build/CatNFT_CatNFT';

export async function run() {
  console.log('🚀 部署 CatNFT 合約...');

  // Example deployer address - using a dummy address for template
  // In production, get this from your wallet
  const deployerAddress = new Address(
    0,
    Buffer.from(
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      'hex'
    )
  );

  console.log(`📦 部署者地址: ${deployerAddress}`);
  console.log(
    '⚠️  這是一個模板腳本。實際部署需要整合 TonConnect 或使用 blueprint。'
  );

  // Create contract instance
  const nftContract = await CatNFT.fromInit(deployerAddress);

  console.log(`📍 合約地址: ${nftContract.address}`);
  console.log(
    `🔗 TON Explorer: https://testnet.tonviewer.com/${nftContract.address}`
  );

  // Deployment info
  const deploymentInfo = {
    network: 'testnet',
    nftContractAddress: nftContract.address.toString(),
    deployerAddress: deployerAddress.toString(),
    deployedAt: new Date().toISOString(),
    explorerUrl: `https://testnet.tonviewer.com/${nftContract.address}`,
    contractType: 'CatNFT',
  };

  console.log('\n💾 部署資訊:');
  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log('\n📋 後續步驟:');
  console.log('1. 使用 TonConnect 或錢包部署此合約');
  console.log('2. 將合約地址設定到 CatLottery 合約中');
  console.log('3. 測試 NFT 鑄造功能');

  return deploymentInfo;
}

// Run the script if called directly
if (require.main === module) {
  run().catch(console.error);
}
