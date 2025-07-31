import { readFile } from 'fs/promises';

async function main() {
  console.log('🔍 驗證 CatLottery 合約編譯結果...\n');

  try {
    // 檢查編譯生成的文件
    const tsFile = await readFile('./build/CatLottery_CatLottery.ts', 'utf8');
    const abiFile = await readFile('./build/CatLottery_CatLottery.abi', 'utf8');

    console.log('✅ TypeScript 綁定文件存在');
    console.log('✅ ABI 文件存在');

    // 解析 ABI
    const abi = JSON.parse(abiFile);
    console.log('\n📋 合約 ABI 信息:');
    console.log(`   - 類型: ${abi.name}`);
    console.log(`   - 接收器數量: ${abi.receivers?.length || 0}`);
    console.log(`   - Getter 數量: ${abi.getters?.length || 0}`);

    if (abi.getters) {
      console.log('\n🔍 可用的查詢方法:');
      abi.getters.forEach((getter: any) => {
        console.log(
          `   - ${getter.name}(): ${getter.returnType?.type || 'unknown'}`
        );
      });
    }

    if (abi.receivers) {
      console.log('\n📨 可接收的消息:');
      abi.receivers.forEach((receiver: any) => {
        if (typeof receiver.message === 'string') {
          console.log(`   - "${receiver.message}"`);
        } else if (receiver.message?.type) {
          console.log(`   - ${receiver.message.type}`);
        }
      });
    }

    // 檢查合約大小
    const tsFileSize = (tsFile.length / 1024).toFixed(2);
    const codeLines = tsFile.split('\n').length;

    console.log(`\n📊 編譯統計:`);
    console.log(`   - TypeScript 綁定大小: ${tsFileSize} KB`);
    console.log(`   - 代碼行數: ${codeLines} 行`);

    // 檢查重要的導出
    const hasContractClass = tsFile.includes('export class CatLottery');
    const hasFromInit = tsFile.includes('fromInit');
    const hasGetters = tsFile.includes('getGetContractInfo');

    console.log('\n🔍 關鍵功能檢查:');
    console.log(`   - CatLottery 類: ${hasContractClass ? '✅' : '❌'}`);
    console.log(`   - fromInit 方法: ${hasFromInit ? '✅' : '❌'}`);
    console.log(`   - Getter 方法: ${hasGetters ? '✅' : '❌'}`);

    console.log('\n🎉 合約編譯驗證完成！');
    console.log('\n📝 下一步操作:');
    console.log('   1. 運行測試: npm run test');
    console.log('   2. 驗證基本功能: npx jest tests/CatLottery.test.ts');
    console.log('   3. 開始開發 NFT 合約或前端');
  } catch (error) {
    console.error('❌ 驗證失敗:', error);
    process.exit(1);
  }
}

main();
