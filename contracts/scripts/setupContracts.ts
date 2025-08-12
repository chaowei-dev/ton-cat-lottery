import { toNano, Address, Cell } from '@ton/core';
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
  ui.write(`   4. 執行抽獎（滿3人）`);
  ui.write(`   5. 抽獎管理中心`);
  ui.write(`   6. 退出`);

  const operation = await ui.choose(
    '請選擇操作',
    [
      '連接 CatLottery 和 CatNFT 合約',
      '檢查合約狀態',
      '測試 NFT 鑄造',
      '執行抽獎（滿3人）',
      '抽獎管理中心',
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
  } else if (operation === '執行抽獎（滿3人）') {
    await drawLottery(provider, ui, deployerAddress);
  } else if (operation === '抽獎管理中心') {
    await getLotteryResults(provider, ui);
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
  
  const lotteryAddressStr = await ui.input('請輸入 CatLottery 合約地址: ');
  const nftAddressStr = await ui.input('請輸入 CatNFT 合約地址: ');
  
  try {
    const lotteryAddress = Address.parse(lotteryAddressStr);
    const nftAddress = Address.parse(nftAddressStr);

    const catLottery = provider.open(CatLottery.fromAddress(lotteryAddress));
    const catNFT = provider.open(CatNFT.fromAddress(nftAddress));

    ui.write(`\n📊 檢查當前狀態...`);
    ui.write(`🔍 連接到合約:`);
    ui.write(`   - CatLottery: ${lotteryAddress}`);
    ui.write(`   - CatNFT: ${nftAddress}`);
    
    // 檢查抽獎合約狀態
    ui.write(`\n⏳ 正在查詢抽獎合約狀態...`);
    const lotteryInfo = await catLottery.getGetContractInfo();
    ui.write(`🎰 抽獎合約狀態:`);
    ui.write(`   - 當前輪次: ${lotteryInfo.currentRound}`);
    ui.write(`   - 參與者數量: ${lotteryInfo.participantCount}`);
    ui.write(`   - 抽獎狀態: ${lotteryInfo.lotteryActive ? '活躍' : '非活躍'}`);
    ui.write(`   - 抽獎進行中: ${lotteryInfo.drawInProgress ? '是' : '否'}`);

    // 檢查 NFT 合約狀態
    ui.write(`\n⏳ 正在查詢NFT合約狀態...`);
    const nftInfo = await catNFT.getGetContractInfo();
    ui.write(`\n🐱 NFT 合約狀態:`);
    ui.write(`   - 已鑄造 NFT 數量: ${nftInfo.totalSupply}`);
    ui.write(`   - 下一個 NFT ID: ${nftInfo.nextTokenId}`);
    ui.write(`   - 授權鑄造者: ${nftInfo.authorizedMinter || '未設定'}`);

    // 檢查是否有足夠參與者
    if (lotteryInfo.participantCount === BigInt(0)) {
      ui.write(`\n❌ 當前輪次沒有參與者，無法測試 NFT 鑄造`);
      ui.write(`💡 請先讓用戶參與抽獎，然後再執行此測試`);
      return;
    }

    if (lotteryInfo.drawInProgress) {
      ui.write(`\n⚠️ 抽獎正在進行中，請稍後再試`);
      return;
    }

    // 選擇測試方式
    const testOption = await ui.choose(
      '選擇 NFT 鑄造測試方式',
      [
        '執行完整抽獎流程 (推薦)',
        '查看現有 NFT',
        '檢查 NFT 模板',
        '返回'
      ],
      (c: string) => c
    );

    if (testOption === '返回') {
      return;
    }

    if (testOption === '執行完整抽獎流程 (推薦)') {
      ui.write(`\n🎲 執行完整抽獎流程以測試 NFT 鑄造...`);
      
      // 記錄抽獎前的 NFT 數量
      const beforeNFTCount = nftInfo.totalSupply;
      ui.write(`📊 抽獎前 NFT 總數: ${beforeNFTCount}`);

      ui.write(`\n🚀 發送 drawWinner 交易...`);
      ui.write(`💰 交易費用: 0.1 TON (包含 NFT 鑄造 gas 費)`);

      // 發送抽獎交易
      await catLottery.send(
        provider.sender(),
        { value: toNano('0.1') },
        'drawWinner'
      );

      ui.write(`✅ drawWinner 交易已發送`);
      ui.write(`🔨 請在錢包中確認交易...`);

      // 等待用戶確認
      const confirmResult = await ui.choose(
        '交易是否成功確認？',
        ['交易成功，檢查結果', '交易失敗', '取消'],
        (c: string) => c
      );

      if (confirmResult === '交易成功，檢查結果') {
        ui.write(`\n🔍 檢查抽獎和 NFT 鑄造結果...`);
        
        try {
          // 檢查新的合約狀態
          const newLotteryInfo = await catLottery.getGetContractInfo();
          const newNFTInfo = await catNFT.getGetContractInfo();

          ui.write(`\n📊 抽獎後狀態:`);
          ui.write(`🎰 抽獎合約:`);
          ui.write(`   - 當前輪次: ${newLotteryInfo.currentRound} (應該增加了)`);
          ui.write(`   - 參與者數量: ${newLotteryInfo.participantCount} (應該重置為 0)`);
          ui.write(`   - 抽獎狀態: ${newLotteryInfo.lotteryActive ? '活躍' : '非活躍'}`);
          ui.write(`   - 抽獎進行中: ${newLotteryInfo.drawInProgress ? '是' : '否'}`);

          ui.write(`\n🐱 NFT 合約:`);
          ui.write(`   - 已鑄造 NFT 數量: ${newNFTInfo.totalSupply} (應該增加了)`);
          ui.write(`   - 下一個 NFT ID: ${newNFTInfo.nextTokenId}`);

          // 檢查是否成功鑄造了新 NFT
          const nftIncreased = newNFTInfo.totalSupply > beforeNFTCount;
          const roundIncreased = newLotteryInfo.currentRound > lotteryInfo.currentRound;
          const participantsReset = newLotteryInfo.participantCount === BigInt(0);

          if (nftIncreased && roundIncreased && participantsReset) {
            ui.write(`\n🎉 NFT 鑄造測試成功！`);
            ui.write(`✅ 新 NFT 已鑄造`);
            ui.write(`✅ 輪次已遞增`);
            ui.write(`✅ 參與者已重置`);

            // 嘗試查看中獎記錄
            try {
              const previousRound = lotteryInfo.currentRound;
              const winner = await catLottery.getGetWinner(previousRound);
              if (winner) {
                ui.write(`\n🏆 中獎記錄 (輪次 ${previousRound}):`);
                ui.write(`   - 中獎者: ${winner.winner}`);
                ui.write(`   - NFT ID: ${winner.nftId}`);
                ui.write(`   - 中獎時間: ${new Date(Number(winner.timestamp) * 1000).toLocaleString()}`);

                // 檢查 NFT 詳細資料
                const nftData = await catNFT.getGetNft(newNFTInfo.nextTokenId - BigInt(1));
                if (nftData) {
                  ui.write(`\n🎁 鑄造的 NFT 詳細資料:`);
                  ui.write(`   - Token ID: ${nftData.tokenId}`);
                  ui.write(`   - 擁有者: ${nftData.owner}`);
                  ui.write(`   - 貓咪名稱: ${nftData.metadata.name}`);
                  ui.write(`   - 稀有度: ${nftData.metadata.rarity}`);
                  ui.write(`   - 描述: ${nftData.metadata.description}`);
                }
              }
            } catch (e) {
              ui.write(`⚠️ 無法獲取中獎記錄: ${e}`);
            }

          } else {
            ui.write(`\n⚠️ NFT 鑄造可能未完全成功:`);
            ui.write(`   - NFT 數量增加: ${nftIncreased ? '✅' : '❌'}`);
            ui.write(`   - 輪次遞增: ${roundIncreased ? '✅' : '❌'}`);
            ui.write(`   - 參與者重置: ${participantsReset ? '✅' : '❌'}`);
            ui.write(`💡 可能需要等待更長時間或檢查交易狀態`);
          }

        } catch (e) {
          ui.write(`❌ 檢查結果失敗: ${e}`);
        }

      } else if (confirmResult === '交易失敗') {
        ui.write(`❌ 交易失敗，NFT 鑄造測試未完成`);
        ui.write(`💡 請檢查:`);
        ui.write(`   - 錢包餘額是否足夠`);
        ui.write(`   - 合約授權是否正確設定`);
        ui.write(`   - 網路連接是否正常`);
      }

    } else if (testOption === '查看現有 NFT') {
      ui.write(`\n🖼️ 查看現有 NFT...`);
      
      if (nftInfo.totalSupply === BigInt(0)) {
        ui.write(`   ❌ 目前沒有已鑄造的 NFT`);
      } else {
        ui.write(`   📊 總共有 ${nftInfo.totalSupply} 個 NFT`);
        
        // 顯示最近幾個 NFT
        const maxShow = Math.min(5, Number(nftInfo.totalSupply));
        ui.write(`\n🎁 最近鑄造的 ${maxShow} 個 NFT:`);
        
        for (let i = Number(nftInfo.nextTokenId) - maxShow; i < Number(nftInfo.nextTokenId); i++) {
          try {
            const nftData = await catNFT.getGetNft(BigInt(i));
            if (nftData) {
              ui.write(`\n   NFT #${i}:`);
              ui.write(`   - 擁有者: ${nftData.owner}`);
              ui.write(`   - 貓咪名稱: ${nftData.metadata.name}`);
              ui.write(`   - 稀有度: ${nftData.metadata.rarity}`);
              ui.write(`   - 鑄造時間: ${new Date(Number(nftData.mintTimestamp) * 1000).toLocaleString()}`);
            }
          } catch (e) {
            ui.write(`   ❌ NFT #${i} 讀取失敗: ${e}`);
          }
        }
      }

    } else if (testOption === '檢查 NFT 模板') {
      ui.write(`\n🐾 檢查 NFT 貓咪模板...`);
      
      const rarities = ['Common', 'Rare', 'Epic', 'Legendary'];
      
      for (let i = 0; i < 4; i++) {
        try {
          const template = await catNFT.getGetCatTemplate(BigInt(i));
          if (template) {
            ui.write(`\n   模板 ${i} - ${rarities[i]}:`);
            ui.write(`   - 名稱: ${template.name}`);
            ui.write(`   - 稀有度: ${template.rarity}`);
            ui.write(`   - 描述: ${template.description}`);
            ui.write(`   - 屬性: ${template.attributes}`);
          }
        } catch (e) {
          ui.write(`   ❌ 模板 ${i} 讀取失敗: ${e}`);
        }
      }
    }

  } catch (error) {
    ui.write(`❌ NFT 鑄造測試失敗: ${error}`);
  }
}

async function drawLottery(provider: NetworkProvider, ui: any, deployerAddress: Address) {
  ui.write(`\n🎰 執行抽獎...`);

  const lotteryAddressStr = await ui.input('請輸入 CatLottery 合約地址: ');

  // 檢查當前狀態
  try {
    const lotteryAddress = Address.parse(lotteryAddressStr);
    const catLottery = provider.open(CatLottery.fromAddress(lotteryAddress));

    ui.write(`\n🔍 連接到合約: ${lotteryAddress}`);
    ui.write(`⏳ 正在查詢合約狀態...`);

    // 檢查當前狀態
    const lotteryInfo = await catLottery.getGetContractInfo();
    ui.write(`\n📊 當前抽獎狀態:`);
    ui.write(`   - 當前輪次: ${lotteryInfo.currentRound}`);
    ui.write(`   - 參與者數量: ${lotteryInfo.participantCount}/${lotteryInfo.maxParticipants}`);
    ui.write(`   - 抽獎狀態: ${lotteryInfo.lotteryActive ? '活躍' : '非活躍'}`);
    ui.write(`   - 參與費用: ${Number(lotteryInfo.entryFee) / 1e9} TON`);

    // 當參與者 >= 3 人時，才可以執行抽獎
    if (lotteryInfo.participantCount < 3) {
      ui.write(`❌ 參與者不足 3 人，無法執行抽獎`);
      return;
    }

    // 執行抽獎
    ui.write(`\n🎰 執行抽獎...`);
    ui.write(`🔨 請在錢包中確認交易...`);

    // 直接發送抽獎請求
    catLottery.send(
      provider.sender(),
      { value: toNano('0.1') },
      'drawWinner'
    );

    const lotteryConfirm = await ui.choose(
      '確認抽獎請求',
      ['確認', '取消'],
      (c: string) => c
    );

    if (lotteryConfirm === '確認') {
      ui.write(`✅ 抽獎請求已確認`);
      ui.write(`💡 請等待交易確認後重新查詢狀態查看結果`);
    } else {
      ui.write(`❌ 抽獎請求已取消`);
    }


  } catch (error) {
    ui.write(`❌ 查詢合約狀態失敗: ${error}`);
    return;
  }

}

async function getLotteryResults(provider: NetworkProvider, ui: any) {
  ui.write(`\n🎲 抽獎管理中心`);
  
  const lotteryAddressStr = await ui.input('請輸入 CatLottery 合約地址: ');
  
  try {
    const lotteryAddress = Address.parse(lotteryAddressStr);
    const catLottery = provider.open(CatLottery.fromAddress(lotteryAddress));

    ui.write(`\n🔍 連接到合約: ${lotteryAddress}`);
    ui.write(`⏳ 正在查詢合約狀態...`);

    // 檢查當前狀態
    const lotteryInfo = await catLottery.getGetContractInfo();
    ui.write(`\n📊 當前抽獎狀態:`);
    ui.write(`   - 當前輪次: ${lotteryInfo.currentRound}`);
    ui.write(`   - 參與者數量: ${lotteryInfo.participantCount}/${lotteryInfo.maxParticipants}`);
    ui.write(`   - 抽獎狀態: ${lotteryInfo.lotteryActive ? '活躍' : '非活躍'}`);
    ui.write(`   - 參與費用: ${Number(lotteryInfo.entryFee) / 1e9} TON`);

    const action = await ui.choose(
      '選擇操作',
      ['確認抽獎清單', '檢查最近中獎記錄', '返回'],
      (c: string) => c
    );

    if (action === '返回') {
      return;
    }

    if (action === '確認抽獎清單') {
      ui.write(`\n📋 確認抽獎清單...`);
      
      if (lotteryInfo.participantCount === BigInt(0)) {
        ui.write(`   ❌ 當前輪次沒有參與者`);
      } else {
        ui.write(`\n👥 當前輪次參與者概況 (輪次 ${lotteryInfo.currentRound}):`);
        ui.write(`   總參與人數: ${lotteryInfo.participantCount}`);
        ui.write(`   參與費用: ${Number(lotteryInfo.entryFee) / 1e9} TON`);
        ui.write(`   總獎池金額: ${Number(lotteryInfo.participantCount) * Number(lotteryInfo.entryFee) / 1e9} TON`);
        
        // 查詢參與者詳細資訊 (TON Center API)
        ui.write(`\n🔍 查詢參與者詳細資訊...`);
        
        try {
          for (let i = 0; i < Math.min(Number(lotteryInfo.participantCount), 3); i++) {
            try {
              ui.write(`\n📋 查詢參與者 #${i}...`);
              
              const response = await fetch('https://testnet.toncenter.com/api/v2/runGetMethod', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  address: lotteryAddress.toString(),
                  method: 'getParticipant',
                  stack: [['num', i.toString()]]
                })
              });

              if (response.ok) {
                const data = await response.json() as any;
                
                if (data.ok && data.result?.stack && data.result.stack.length > 0) {
                  // 解析 stack 數據 (TON API 返回的是 tuple 結構)
                  const stack = data.result.stack;
                  if (stack.length > 0 && stack[0][0] === 'tuple') {
                    const tupleElements = stack[0][1].elements;
                    if (tupleElements && tupleElements.length >= 3) {
                      // 解析地址 (slice 需要特殊處理)
                      const addressSlice = tupleElements[0].slice?.bytes;
                      let parsedAddress = 'N/A';
                      
                      try {
                        if (addressSlice) {
                          const cell = Cell.fromBase64(addressSlice);
                          const slice = cell.beginParse();
                          const addr = slice.loadAddress();
                          parsedAddress = addr.toString();
                        }
                      } catch (e) {
                        parsedAddress = `解析失敗: ${addressSlice}`;
                      }
                      
                      // 解析金額
                      const amount = parseInt(tupleElements[1].number?.number || '0');
                      // 解析時間戳
                      const timestamp = parseInt(tupleElements[2].number?.number || '0');
                      
                      ui.write(`   ✅ 參與者 #${i}:`);
                      ui.write(`      地址: ${parsedAddress}`);
                      ui.write(`      金額: ${amount / 1e9} TON`);
                      ui.write(`      時間: ${new Date(timestamp * 1000).toLocaleString()}`);
                    } else {
                      ui.write(`   ⚠️ 參與者 #${i}: 數據結構異常`);
                    }
                  } else {
                    ui.write(`   ⚠️ 參與者 #${i}: 非預期的數據格式`);
                  }
                } else {
                  ui.write(`   ❌ 參與者 #${i}: 無數據或查詢錯誤`);
                }
              } else {
                ui.write(`   ❌ 參與者 #${i}: HTTP 錯誤 ${response.status}`);
              }
            } catch (e) {
              ui.write(`   ❌ 參與者 #${i} 查詢失敗: ${e}`);
            }
          }
        } catch (e) {
          ui.write(`   ❌ 參與者查詢測試失敗: ${e}`);
        }
      }

    // 檢查最近中獎記錄 (使用 TON Center API)
    } else if (action === '檢查最近中獎記錄') {
      ui.write(`\n🏆 最近中獎記錄 (最近5輪):`);
      const currentRound = Number(lotteryInfo.currentRound);
      
      const maxRounds = Math.min(5, currentRound);
      let foundWinners = 0;
      
      for (let round = currentRound - 1; round >= Math.max(1, currentRound - maxRounds); round--) {
        try {
          ui.write(`\n🔍 查詢輪次 ${round}...`);
          
          const response = await fetch('https://testnet.toncenter.com/api/v2/runGetMethod', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: lotteryAddress.toString(),
              method: 'getWinner',
              stack: [['num', round.toString()]]
            })
          });

          if (response.ok) {
            const data = await response.json() as any;
            
            if (data.ok && data.result?.stack && data.result.stack.length > 0) {
              const stack = data.result.stack;
              if (stack.length > 0 && stack[0][0] === 'tuple') {
                const tupleElements = stack[0][1].elements;
                if (tupleElements && tupleElements.length >= 3) {
                  // 解析中獎者地址
                  const winnerSlice = tupleElements[0].slice?.bytes;
                  let parsedWinner = 'N/A';
                  
                  try {
                    if (winnerSlice) {
                      const cell = Cell.fromBase64(winnerSlice);
                      const slice = cell.beginParse();
                      const addr = slice.loadAddress();
                      parsedWinner = addr.toString();
                    }
                  } catch (e) {
                    parsedWinner = `解析失敗: ${winnerSlice}`;
                  }
                  
                  // 解析 NFT ID
                  const nftId = parseInt(tupleElements[1].number?.number || '0');
                  // 解析時間戳
                  const timestamp = parseInt(tupleElements[2].number?.number || '0');
                  
                  foundWinners++;
                  ui.write(`   ✅ 輪次 ${round}:`);
                  ui.write(`      🏆 中獎者: ${parsedWinner}`);
                  ui.write(`      🎁 NFT ID: ${nftId}`);
                  ui.write(`      📅 中獎時間: ${new Date(timestamp * 1000).toLocaleString()}`);
                  ui.write(`      ────────────────────────────`);
                } else {
                  ui.write(`   ⚠️ 輪次 ${round}: 數據結構異常`);
                }
              } else {
                ui.write(`   ⚠️ 輪次 ${round}: 非預期的數據格式`);
              }
            } else {
              ui.write(`   ❌ 輪次 ${round}: 無中獎記錄`);
            }
          } else {
            ui.write(`   ❌ 輪次 ${round}: HTTP 錯誤 ${response.status}`);
          }
        } catch (e) {
          ui.write(`   ❌ 輪次 ${round} 查詢失敗: ${e}`);
        }
      }
      
      if (foundWinners === 0) {
        ui.write(`\n❌ 沒有找到最近的中獎記錄`);
        ui.write(`💡 可能需要等待抽獎交易確認或檢查合約狀態`);
      } else {
        ui.write(`\n📊 共找到 ${foundWinners} 個中獎記錄`);
      }
    }

  } catch (error) {
    ui.write(`❌ 操作失敗: ${error}`);
    return;
  }
}

