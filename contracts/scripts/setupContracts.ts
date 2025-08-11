import { toNano, Address } from '@ton/core';
import { CatLottery } from '../build/CatLottery_CatLottery';
import { CatNFT } from '../build/CatNFT_CatNFT';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
  const ui = provider.ui();

  ui.write('🔧 Cat Lottery 合約整合設定工具');
  ui.write('='.repeat(50));

  // 獲取部署者地址
  const deployerAddress = provider.sender().address;
  if (!deployerAddress) {
    throw new Error('無法獲取部署者地址');
  }

  ui.write(`📦 部署者地址: ${deployerAddress}`);

  // 步驟 1: 選擇操作
  ui.write(`\n🛠️  可用操作:`);
  ui.write(`   1. 連接 CatLottery 和 CatNFT 合約`);
  ui.write(`   2. 檢查合約狀態`);
  ui.write(`   3. 測試 NFT 鑄造`);
  ui.write(`   4. 模擬抽獎流程`);
  ui.write(`   5. 退出`);

  const operation = await ui.choose(
    '請選擇操作',
    [
      '連接 CatLottery 和 CatNFT 合約',
      '檢查合約狀態',
      '測試 NFT 鑄造',
      '模擬抽獎流程',
      '退出'
    ],
    (c) => c
  );

  if (operation === '退出') {
    ui.write(`👋 退出設定工具`);
    return;
  }

  if (operation === '連接 CatLottery 和 CatNFT 合約') {
    await connectContracts(provider, ui, deployerAddress);
  } else if (operation === '檢查合約狀態') {
    await checkContractStatus(provider, ui, deployerAddress);
  } else if (operation === '測試 NFT 鑄造') {
    await testNFTMinting(provider, ui, deployerAddress);
  } else if (operation === '模擬抽獎流程') {
    await simulateLottery(provider, ui, deployerAddress);
  }
}

async function connectContracts(provider: NetworkProvider, ui: any, deployerAddress: Address) {
  ui.write(`\n🔗 連接 CatLottery 和 CatNFT 合約`);
  
  // 輸入合約地址
  const lotteryAddressStr = await ui.input('請輸入 CatLottery 合約地址: ');
  const nftAddressStr = await ui.input('請輸入 CatNFT 合約地址: ');

  try {
    const lotteryAddress = Address.parse(lotteryAddressStr);
    const nftAddress = Address.parse(nftAddressStr);

    // 連接合約
    const catLottery = provider.open(CatLottery.fromAddress(lotteryAddress));
    const catNFT = provider.open(CatNFT.fromAddress(nftAddress));

    ui.write(`\n1️⃣ 設定 CatNFT 的授權鑄造者為 CatLottery...`);
    
    // 設定 NFT 合約的授權鑄造者
    // 直接發送交易，不等待回應
    catNFT.send(
      provider.sender(),
      { value: toNano('0.05') },
      {
        $$type: 'SetAuthorizedMinter',
        minter: lotteryAddress,
      }
    );

    ui.write(`✅ 已設定 CatNFT 授權鑄造者`);
    ui.write(`🔨 請在錢包中確認交易...`);

    // 手動確認部署狀態
    ui.write(`\n❓ 請確認 CatNFT 授權狀態:`);
    ui.write(`   1. 授權成功 - 繼續`);
    ui.write(`   2. 授權失敗 - 退出`);

    const authorizedChoice = await ui.choose('授權狀態', ['授權成功', '授權失敗'], (c: string) => c);

    if (authorizedChoice === '授權失敗') {
      ui.write(`👋 退出設定工具`);
      return;
    }

    ui.write(`\n2️⃣ 設定 CatLottery 的 NFT 合約地址...`);

    // 設定 Lottery 合約的 NFT 地址
    catLottery.send(
      provider.sender(),
      { value: toNano('0.05') },
      {
        $$type: 'SetNFTContract',
        nftContract: nftAddress,
      }
    );

    ui.write(`✅ 已設定 CatLottery NFT 合約地址`);
    ui.write(`🔨 請在錢包中確認交易...`);

    // 手動確認交易狀態
    ui.write(`\n❓ 請確認 CatLottery NFT 合約地址設定狀態:`);
    ui.write(`   1. 設定成功 - 繼續`);
    ui.write(`   2. 設定失敗 - 退出`);

    const lotteryChoice = await ui.choose('設定狀態', ['設定成功', '設定失敗'], (c: string) => c);

    if (lotteryChoice === '設定失敗') {
      ui.write(`👋 退出設定工具`);
      return;
    }

    ui.write(`\n🎉 合約連接完成！`);
    ui.write(`📋 配置摘要:`);
    ui.write(`   - CatLottery 合約: ${lotteryAddress}`);
    ui.write(`   - CatLottery NFT 合約: ${nftAddress}`);
    ui.write(`   - CatNFT 授權鑄造者: ${lotteryAddress}`);

  } catch (error) {
    ui.write(`❌ 連接失敗: ${error}`);
  }
}

async function checkContractStatus(provider: NetworkProvider, ui: any, deployerAddress: Address) {
  ui.write(`\n📊 檢查合約狀態`);
  
  const lotteryAddressStr = await ui.input('請輸入 CatLottery 合約地址: ');
  const nftAddressStr = await ui.input('請輸入 CatNFT 合約地址: ');

  try {
    const lotteryAddress = Address.parse(lotteryAddressStr);
    const nftAddress = Address.parse(nftAddressStr);

    const catLottery = provider.open(CatLottery.fromAddress(lotteryAddress));
    const catNFT = provider.open(CatNFT.fromAddress(nftAddress));

    // 檢查 CatLottery 狀態
    ui.write(`\n🎰 CatLottery 合約狀態:`);
    try {
      const lotteryInfo = await catLottery.getGetContractInfo();
      ui.write(`   - 擁有者: ${lotteryInfo.owner}`);
      ui.write(`   - 參與費用: ${lotteryInfo.entryFee} nanoTON`);
      ui.write(`   - 最大參與人數: ${lotteryInfo.maxParticipants}`);
      ui.write(`   - 當前輪次: ${lotteryInfo.currentRound}`);
      ui.write(`   - 抽獎狀態: ${lotteryInfo.lotteryActive ? '活躍' : '非活躍'}`);
      ui.write(`   - 參與者數量: ${lotteryInfo.participantCount}`);
    } catch (e) {
      ui.write(`   ❌ 無法獲取狀態: ${e}`);
    }

    // 檢查 CatNFT 狀態
    ui.write(`\n🐱 CatNFT 合約狀態:`);
    
    // 先嘗試最基本的 owner getter
    try {
      const owner = await catNFT.getOwner();
      ui.write(`   - 擁有者: ${owner}`);
    } catch (e) {
      ui.write(`   ❌ 無法獲取擁有者: ${e}`);
      ui.write(`   💡 這可能表示合約地址錯誤或合約未正確初始化`);
      return;
    }

    // 嘗試獲取完整合約資訊
    try {
      const nftInfo = await catNFT.getGetContractInfo();
      ui.write(`   - 授權鑄造者: ${nftInfo.authorizedMinter || '未設定'}`);
      ui.write(`   - 下一個 NFT ID: ${nftInfo.nextTokenId}`);
      ui.write(`   - 總供應量: ${nftInfo.totalSupply}`);

      // 檢查貓咪模板
      ui.write(`\n🐾 貓咪模板:`);
      for (let i = 0; i < 4; i++) {
        try {
          const template = await catNFT.getGetCatTemplate(BigInt(i));
          if (template) {
            ui.write(`   ${i}: ${template.name} (${template.rarity})`);
          }
        } catch (e) {
          ui.write(`   ${i}: 模板讀取失敗 - ${e}`);
        }
      }
    } catch (e) {
      ui.write(`   ❌ 無法獲取完整合約資訊: ${e}`);
      ui.write(`   💡 合約可能需要重新初始化或等待網路同步`);
    }

  } catch (error) {
    ui.write(`❌ 檢查失敗: ${error}`);
  }
}

async function testNFTMinting(provider: NetworkProvider, ui: any, deployerAddress: Address) {
  ui.write(`\n🎨 測試 NFT 鑄造`);
  ui.write(`ℹ️ NFT 只能通過抽獎獲得，此功能將模擬完整抽獎流程`);
  
  const lotteryAddressStr = await ui.input('請輸入 CatLottery 合約地址: ');
  
  try {
    const lotteryAddress = Address.parse(lotteryAddressStr);
    const catLottery = provider.open(CatLottery.fromAddress(lotteryAddress));

    // 檢查當前狀態
    const lotteryInfo = await catLottery.getGetContractInfo();
    ui.write(`\n📊 當前抽獎狀態:`);
    ui.write(`   - 參與者數量: ${lotteryInfo.participantCount}/${lotteryInfo.maxParticipants}`);
    ui.write(`   - 抽獎狀態: ${lotteryInfo.lotteryActive ? '活躍' : '非活躍'}`);

    if (lotteryInfo.participantCount === BigInt(0)) {
      ui.write(`\n⚠️ 當前沒有參與者，需要先參與抽獎`);
      ui.write(`💡 建議操作流程:`);
      ui.write(`   1. 使用 '模擬抽獎流程' -> '參與抽獎'`);
      ui.write(`   2. 等其他人參與或使用其他錢包參與`);
      ui.write(`   3. 使用 '模擬抽獎流程' -> '執行抽獎'`);
      return;
    }

    ui.write(`\n🎰 執行抽獎以鑄造 NFT 給中獎者...`);
    
    // 執行抽獎
    await catLottery.send(
      provider.sender(),
      { value: toNano('0.1') },
      'drawWinner'
    );

    ui.write(`✅ 抽獎請求已發送`);
    ui.write(`🔨 請在錢包中確認交易...`);
    ui.write(`🏆 中獎者將自動獲得 NFT`);
    ui.write(`📋 請等待幾秒後檢查抽獎結果`);

  } catch (error) {
    ui.write(`❌ 抽獎失敗: ${error}`);
  }
}

async function simulateLottery(provider: NetworkProvider, ui: any, deployerAddress: Address) {
  ui.write(`\n🎲 模擬抽獎流程`);
  
  const lotteryAddressStr = await ui.input('請輸入 CatLottery 合約地址: ');
  
  try {
    const lotteryAddress = Address.parse(lotteryAddressStr);
    const catLottery = provider.open(CatLottery.fromAddress(lotteryAddress));

    // 檢查當前狀態
    const lotteryInfo = await catLottery.getGetContractInfo();
    ui.write(`\n📊 當前抽獎狀態:`);
    ui.write(`   - 參與者數量: ${lotteryInfo.participantCount}/${lotteryInfo.maxParticipants}`);
    ui.write(`   - 抽獎狀態: ${lotteryInfo.lotteryActive ? '活躍' : '非活躍'}`);
    ui.write(`   - 參與費用: ${Number(lotteryInfo.entryFee) / 1e9} TON`);

    const action = await ui.choose(
      '選擇操作',
      ['執行抽獎 (僅擁有者)', '確認抽獎清單', '檢查中獎記錄', '返回'],
      (c: string) => c
    );

    if (action === '執行抽獎 (僅擁有者)') {
      ui.write(`\n🎰 執行抽獎...`);

      ui.write(`🔨 請在錢包中確認交易...`);

      ui.write(`\n請確認交易狀態`);
      ui.write(`   1. 確認抽獎請求 - 繼續`);
      ui.write(`   2. 取消抽獎請求 - 返回`);

      // 直接發送抽獎請求
      catLottery.send(
        provider.sender(),
        { value: toNano('0.1') },
        'drawWinner'
      );

      // 手動確認
      const lotteryConfirm = await ui.choose(
        '確認抽獎請求',
        ['確認', '取消'],
        (c: string) => c
      );

      if (lotteryConfirm === '確認') {
        ui.write(`✅ 抽獎請求已確認`);
      } else {
        ui.write(`❌ 抽獎請求已取消`);
        return;
      }

    // TODO: 確認抽獎清單
    } else if (action === '確認抽獎清單') {
      ui.write(`\n📋 確認抽獎清單...`);


    // TODO: 檢查中獎記錄
    } else if (action === '檢查中獎記錄') {
      ui.write(`\n🏆 檢查中獎記錄...`);
      
    
    } 

  } catch (error) {
    ui.write(`❌ 操作失敗: ${error}`);
  }
}