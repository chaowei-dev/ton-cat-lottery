import { Address, toNano } from '@ton/core';
import { CatLottery } from '../build/CatLottery_CatLottery';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
  const ui = provider.ui();

  // 從參數獲取合約地址
  const contractAddress = args[0];
  if (!contractAddress) {
    ui.write('❌ 請提供合約地址作為第一個參數');
    return;
  }

  // 連接到合約
  const catLottery = provider.open(
    CatLottery.fromAddress(Address.parse(contractAddress))
  );

  ui.write(`🔍 連接到合約: ${contractAddress}`);

  // 獲取並顯示合約狀態
  try {
    const contractInfo = await catLottery.getGetContractInfo();
    const balance = await catLottery.getGetBalance();

    ui.write(`\n📊 合約狀態:`);
    ui.write(`📍 地址: ${contractAddress}`);
    ui.write(`👤 擁有者: ${contractInfo.owner}`);
    ui.write(`💰 參與費用: ${Number(contractInfo.entryFee) / 1e9} TON`);
    ui.write(`👥 最大參與人數: ${contractInfo.maxParticipants}`);
    ui.write(`🔄 當前輪次: ${contractInfo.currentRound}`);
    ui.write(
      `🎯 抽獎狀態: ${contractInfo.lotteryActive ? '🟢 活躍' : '🔴 非活躍'}`
    );
    ui.write(`🙋‍♂️ 當前參與者: ${contractInfo.participantCount}`);
    ui.write(`🏦 合約餘額: ${Number(balance) / 1e9} TON`);
    ui.write(`🤖 NFT 合約: ${contractInfo.nftContract || '未設定'}`);

    // 顯示參與者列表
    if (contractInfo.participantCount > 0) {
      ui.write(`\n👥 參與者列表:`);
      for (let i = 0; i < Number(contractInfo.participantCount); i++) {
        try {
          const participant = await catLottery.getGetParticipant(BigInt(i));
          if (participant) {
            ui.write(
              `   ${i + 1}. ${participant.address} (${
                Number(participant.amount) / 1e9
              } TON)`
            );
          }
        } catch (error) {
          ui.write(`   ${i + 1}. 無法獲取參與者資訊`);
        }
      }
    }

    // 顯示中獎歷史
    ui.write(`\n🏆 查詢最近中獎記錄:`);
    for (
      let round = Math.max(1, Number(contractInfo.currentRound) - 3);
      round <= Number(contractInfo.currentRound);
      round++
    ) {
      try {
        const winner = await catLottery.getGetWinner(BigInt(round));
        if (winner) {
          const date = new Date(Number(winner.timestamp) * 1000);
          ui.write(
            `   第 ${round} 輪: ${winner.winner} (NFT #${
              winner.nftId
            }) - ${date.toLocaleString()}`
          );
        }
      } catch (error) {
        // 忽略查詢錯誤
      }
    }
  } catch (error) {
    ui.write(`❌ 無法獲取合約狀態: ${error}`);
    return;
  }

  // 互動選單
  ui.write(`\n🎮 可用操作:`);
  ui.write(`1. 參加抽獎 (join)`);
  ui.write(`2. 進行抽獎 (drawWinner) - 僅限擁有者`);
  ui.write(`3. 設定 NFT 合約 (setNFT) - 僅限擁有者`);
  ui.write(`4. 開始新輪次 (newRound) - 僅限擁有者`);
  ui.write(`5. 提取資金 (withdraw) - 僅限擁有者`);
  ui.write(`6. 退出`);

  const choice = await ui.input('請選擇操作 (1-6): ');

  switch (choice) {
    case '1':
      await joinLottery(catLottery, provider, ui);
      break;
    case '2':
      await drawWinner(catLottery, provider, ui);
      break;
    case '3':
      await setNFTContract(catLottery, provider, ui);
      break;
    case '4':
      await startNewRound(catLottery, provider, ui);
      break;
    case '5':
      await withdrawFunds(catLottery, provider, ui);
      break;
    case '6':
      ui.write('👋 再見！');
      break;
    default:
      ui.write('❌ 無效選擇');
  }
}

async function joinLottery(
  catLottery: any,
  provider: NetworkProvider,
  ui: any
) {
  try {
    const contractInfo = await catLottery.getContractInfo();

    if (!contractInfo.lotteryActive) {
      ui.write('❌ 抽獎目前不活躍');
      return;
    }

    ui.write(`💰 需要支付: ${Number(contractInfo.entryFee) / 1e9} TON`);
    const confirm = await ui.input('確認參加抽獎? (y/N): ');

    if (confirm.toLowerCase() !== 'y') {
      ui.write('❌ 已取消');
      return;
    }

    ui.write('📤 發送交易中...');

    await catLottery.send(
      provider.sender(),
      {
        value: contractInfo.entryFee + toNano('0.05'), // 加上 gas 費用
      },
      'join'
    );

    ui.write('✅ 交易已發送！請等待確認...');
  } catch (error) {
    ui.write(`❌ 參加失敗: ${error}`);
  }
}

async function drawWinner(catLottery: any, provider: NetworkProvider, ui: any) {
  try {
    const confirm = await ui.input('確認進行抽獎? (y/N): ');

    if (confirm.toLowerCase() !== 'y') {
      ui.write('❌ 已取消');
      return;
    }

    ui.write('🎲 進行抽獎中...');

    await catLottery.send(
      provider.sender(),
      {
        value: toNano('0.1'),
      },
      'drawWinner'
    );

    ui.write('✅ 抽獎交易已發送！請等待確認...');
  } catch (error) {
    ui.write(`❌ 抽獎失敗: ${error}`);
  }
}

async function setNFTContract(
  catLottery: any,
  provider: NetworkProvider,
  ui: any
) {
  try {
    const nftAddress = await ui.input('請輸入 NFT 合約地址: ');

    if (!nftAddress) {
      ui.write('❌ 地址不能為空');
      return;
    }

    ui.write('📤 設定 NFT 合約中...');

    await catLottery.send(
      provider.sender(),
      {
        value: toNano('0.05'),
      },
      {
        $$type: 'SetNFTContract',
        nftContract: Address.parse(nftAddress),
      }
    );

    ui.write('✅ NFT 合約設定交易已發送！');
  } catch (error) {
    ui.write(`❌ 設定失敗: ${error}`);
  }
}

async function startNewRound(
  catLottery: any,
  provider: NetworkProvider,
  ui: any
) {
  try {
    const confirm = await ui.input('確認開始新輪次? (y/N): ');

    if (confirm.toLowerCase() !== 'y') {
      ui.write('❌ 已取消');
      return;
    }

    ui.write('🔄 開始新輪次中...');

    await catLottery.send(
      provider.sender(),
      {
        value: toNano('0.05'),
      },
      'startNewRound'
    );

    ui.write('✅ 新輪次交易已發送！');
  } catch (error) {
    ui.write(`❌ 開始新輪次失敗: ${error}`);
  }
}

async function withdrawFunds(
  catLottery: any,
  provider: NetworkProvider,
  ui: any
) {
  try {
    const balance = await catLottery.getBalance();
    ui.write(`💰 合約餘額: ${Number(balance) / 1e9} TON`);

    const confirm = await ui.input('確認提取資金? (y/N): ');

    if (confirm.toLowerCase() !== 'y') {
      ui.write('❌ 已取消');
      return;
    }

    ui.write('💸 提取資金中...');

    await catLottery.send(
      provider.sender(),
      {
        value: toNano('0.05'),
      },
      'withdraw'
    );

    ui.write('✅ 提取交易已發送！');
  } catch (error) {
    ui.write(`❌ 提取失敗: ${error}`);
  }
}
