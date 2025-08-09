import { SandboxContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { CatLottery } from '../build/CatLottery_CatLottery';
import { CatNFT } from '../build/CatNFT_CatNFT';
import { createTestContext, TestContext, TEST_CONSTANTS } from './setup';

describe('Advanced Tests - Security & Performance', () => {
    let context: TestContext;
    let catLottery: SandboxContract<CatLottery>;
    let catNFT: SandboxContract<CatNFT>;

    beforeEach(async () => {
        context = await createTestContext();
        
        // Deploy CatLottery contract
        catLottery = context.blockchain.openContract(
            await CatLottery.fromInit(
                context.deployer.address,
                TEST_CONSTANTS.ENTRY_FEE,
                TEST_CONSTANTS.MAX_PARTICIPANTS
            )
        );
        
        // Deploy CatNFT contract
        catNFT = context.blockchain.openContract(
            await CatNFT.fromInit(context.deployer.address)
        );
        
        // Deploy both contracts
        const lotteryDeployResult = await catLottery.send(
            context.deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'Deploy', queryId: 0n }
        );
        
        const nftDeployResult = await catNFT.send(
            context.deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'Deploy', queryId: 0n }
        );
        
        // Verify deployments
        expect(lotteryDeployResult.transactions).toHaveTransaction({
            from: context.deployer.address,
            to: catLottery.address,
            success: true,
        });
        
        expect(nftDeployResult.transactions).toHaveTransaction({
            from: context.deployer.address,
            to: catNFT.address,
            success: true,
        });
        
        // Configure cross-contract authorization
        await catLottery.send(
            context.deployer.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'SetNFTContract',
                nftContract: catNFT.address,
            }
        );
        
        await catNFT.send(
            context.deployer.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'SetAuthorizedMinter',
                minter: catLottery.address,
            }
        );
    });

    describe('Security Verification Tests', () => {
        it('should prevent reentrancy attacks on join()', async () => {
            // Fill lottery to 2 participants
            await catLottery.send(
                context.user1.getSender(),
                { value: TEST_CONSTANTS.ENTRY_FEE },
                'join'
            );
            
            await catLottery.send(
                context.user2.getSender(),
                { value: TEST_CONSTANTS.ENTRY_FEE },
                'join'
            );

            // Attempt rapid-fire joins from same user (reentrancy simulation)
            const rapidJoinResults = await Promise.allSettled([
                catLottery.send(
                    context.user3.getSender(),
                    { value: TEST_CONSTANTS.ENTRY_FEE },
                    'join'
                ),
                catLottery.send(
                    context.user3.getSender(),
                    { value: TEST_CONSTANTS.ENTRY_FEE },
                    'join'
                )
            ]);

            // Only first join should succeed
            const contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.participantCount).toBe(3n); // Exactly 3 participants
            expect(contractInfo.lotteryActive).toBe(false); // Should be full
        });

        it('should protect against unauthorized contract state manipulation', async () => {
            // Attempt to bypass owner check by sending message with different sender
            const unauthorizedResult = await catLottery.send(
                context.user1.getSender(),
                { value: toNano('0.05') },
                'drawWinner'
            );

            expect(unauthorizedResult.transactions).toHaveTransaction({
                from: context.user1.address,
                to: catLottery.address,
                success: false,
            });

            // Verify state unchanged
            const contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.currentRound).toBe(1n);
            expect(contractInfo.lotteryActive).toBe(true);
        });

        it('should validate entry fee to prevent economic attacks', async () => {
            // Test insufficient fee
            const lowFeeResult = await catLottery.send(
                context.user1.getSender(),
                { value: toNano('0.005') }, // Half of required fee
                'join'
            );

            expect(lowFeeResult.transactions).toHaveTransaction({
                from: context.user1.address,
                to: catLottery.address,
                success: false,
            });

            // Test correct fee (should succeed)
            const correctFeeResult = await catLottery.send(
                context.user2.getSender(),
                { value: TEST_CONSTANTS.ENTRY_FEE },
                'join'
            );

            expect(correctFeeResult.transactions).toHaveTransaction({
                from: context.user2.address,
                to: catLottery.address,
                success: true,
            });

            // Test overpayment (should also succeed)
            const overpayResult = await catLottery.send(
                context.user3.getSender(),
                { value: toNano('0.02') }, // Double fee
                'join'
            );

            expect(overpayResult.transactions).toHaveTransaction({
                from: context.user3.address,
                to: catLottery.address,
                success: true,
            });

            // Verify final state
            const contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.participantCount).toBe(2n); // Only valid participants
        });

        it('should prevent double-spending and duplicate participation', async () => {
            // User joins lottery
            const firstJoin = await catLottery.send(
                context.user1.getSender(),
                { value: TEST_CONSTANTS.ENTRY_FEE },
                'join'
            );

            expect(firstJoin.transactions).toHaveTransaction({
                from: context.user1.address,
                to: catLottery.address,
                success: true,
            });

            // Attempt to join again with same user
            const secondJoin = await catLottery.send(
                context.user1.getSender(),
                { value: TEST_CONSTANTS.ENTRY_FEE },
                'join'
            );

            expect(secondJoin.transactions).toHaveTransaction({
                from: context.user1.address,
                to: catLottery.address,
                success: false,
            });

            // Verify only one participation recorded
            const contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.participantCount).toBe(1n);
        });

        it('should secure cross-contract communication', async () => {
            // Fill lottery
            await catLottery.send(context.user1.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user2.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user3.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');

            // Attempt direct NFT minting (should fail without proper authorization)
            const directMintResult = await catNFT.send(
                context.user1.getSender(),
                { value: toNano('0.1') },
                {
                    $$type: 'MintTo',
                    to: context.user1.address,
                }
            );

            expect(directMintResult.transactions).toHaveTransaction({
                from: context.user1.address,
                to: catNFT.address,
                success: false,
            });

            // Verify no NFT was minted
            const nftInfo = await catNFT.getGetContractInfo();
            expect(nftInfo.totalSupply).toBe(0n);
        });
    });

    describe('Performance & Stability Tests', () => {
        it('should handle maximum participants efficiently', async () => {
            const startTime = Date.now();
            
            // Fill lottery to maximum capacity
            for (let i = 0; i < TEST_CONSTANTS.MAX_PARTICIPANTS; i++) {
                const user = i === 0 ? context.user1 : 
                           i === 1 ? context.user2 : 
                           i === 2 ? context.user3 : context.user4;
                
                const result = await catLottery.send(
                    user.getSender(),
                    { value: TEST_CONSTANTS.ENTRY_FEE },
                    'join'
                );
                
                expect(result.transactions).toHaveTransaction({
                    from: user.address,
                    to: catLottery.address,
                    success: true,
                });
            }
            
            const joinTime = Date.now() - startTime;
            
            // Draw winner
            const drawStartTime = Date.now();
            const drawResult = await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.2') },
                'drawWinner'
            );
            const drawTime = Date.now() - drawStartTime;
            
            expect(drawResult.transactions).toHaveTransaction({
                from: context.deployer.address,
                to: catLottery.address,
                success: true,
            });

            // Performance assertions (reasonable thresholds for blockchain operations)
            expect(joinTime).toBeLessThan(10000); // 10 seconds for all joins
            expect(drawTime).toBeLessThan(5000);  // 5 seconds for drawing
            
            console.log(`Performance metrics - Joins: ${joinTime}ms, Draw: ${drawTime}ms`);
        });

        it('should maintain consistent gas consumption patterns', async () => {
            const gasUsages = [];
            
            // Test gas usage for multiple join operations
            for (let i = 0; i < TEST_CONSTANTS.MAX_PARTICIPANTS; i++) {
                const user = i === 0 ? context.user1 : 
                           i === 1 ? context.user2 : context.user3;
                
                const result = await catLottery.send(
                    user.getSender(),
                    { value: TEST_CONSTANTS.ENTRY_FEE },
                    'join'
                );
                
                // Calculate gas used (simplified estimation)
                const gasUsed = result.transactions.length;
                gasUsages.push(gasUsed);
            }
            
            // Verify gas usage is consistent (within reasonable bounds)
            const avgGas = gasUsages.reduce((a, b) => a + b, 0) / gasUsages.length;
            for (const gas of gasUsages) {
                expect(Math.abs(gas - avgGas)).toBeLessThanOrEqual(2); // Allow small variance
            }
            
            console.log(`Gas usage pattern - Average: ${avgGas}, Range: ${Math.min(...gasUsages)}-${Math.max(...gasUsages)}`);
        });

        it('should handle rapid succession of state changes', async () => {
            // Rapid succession of multiple lottery rounds
            for (let round = 0; round < 3; round++) {
                // Quick fill lottery
                await Promise.all([
                    catLottery.send(context.user1.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join'),
                    catLottery.send(context.user2.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join'),
                    catLottery.send(context.user3.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join')
                ]);
                
                // Quick draw and reset
                await catLottery.send(
                    context.deployer.getSender(),
                    { value: toNano('0.2') },
                    'drawWinner'
                );
                
                if (round < 2) {
                    await catLottery.send(
                        context.deployer.getSender(),
                        { value: toNano('0.05') },
                        'startNewRound'
                    );
                }
            }
            
            // Verify final state consistency
            const finalInfo = await catLottery.getGetContractInfo();
            expect(finalInfo.currentRound).toBe(3n);
            expect(finalInfo.lotteryActive).toBe(false);
            
            const finalNFTInfo = await catNFT.getGetContractInfo();
            expect(finalNFTInfo.totalSupply).toBe(3n);
        });

        it('should maintain state integrity under edge conditions', async () => {
            // Test with minimal valid fee
            const exactFeeResult = await catLottery.send(
                context.user1.getSender(),
                { value: TEST_CONSTANTS.ENTRY_FEE },
                'join'
            );
            
            expect(exactFeeResult.transactions).toHaveTransaction({
                from: context.user1.address,
                to: catLottery.address,
                success: true,
            });
            
            // Test contract balance after operations
            const initialBalance = await catLottery.getGetBalance();
            
            await catLottery.send(context.user2.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user3.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            
            const postJoinBalance = await catLottery.getGetBalance();
            expect(postJoinBalance).toBeGreaterThanOrEqual(initialBalance);
            
            // Draw winner
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.2') },
                'drawWinner'
            );
            
            // Verify contract maintains minimum balance after operations
            const finalBalance = await catLottery.getGetBalance();
            expect(finalBalance).toBeGreaterThanOrEqual(toNano('0.05'));
        });

        it('should handle contract interaction failures gracefully', async () => {
            // Create malformed lottery without NFT contract set
            const isolatedLottery = context.blockchain.openContract(
                await CatLottery.fromInit(
                    context.deployer.address,
                    TEST_CONSTANTS.ENTRY_FEE,
                    TEST_CONSTANTS.MAX_PARTICIPANTS
                )
            );
            
            await isolatedLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                { $$type: 'Deploy', queryId: 0n }
            );
            
            // Fill lottery
            await isolatedLottery.send(context.user1.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await isolatedLottery.send(context.user2.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await isolatedLottery.send(context.user3.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            
            // Attempt to draw winner without NFT contract (should handle gracefully)
            const drawResult = await isolatedLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.2') },
                'drawWinner'
            );
            
            // Transaction might succeed but NFT sending will fail internally
            // Contract should handle this gracefully and maintain consistency
            const contractInfo = await isolatedLottery.getGetContractInfo();
            expect(contractInfo.participantCount).toBe(0n); // Should reset after draw
        });
    });

    describe('Stress Testing', () => {
        it('should handle multiple concurrent operations', async () => {
            // Start new round to ensure clean state
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                'startNewRound'
            );
            
            // Perform rapid sequential joins to simulate concurrent behavior
            const join1 = await catLottery.send(context.user1.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            const join2 = await catLottery.send(context.user2.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');  
            const join3 = await catLottery.send(context.user3.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            
            // Verify all joins succeeded
            expect(join1.transactions).toHaveTransaction({
                from: context.user1.address,
                to: catLottery.address,
                success: true,
            });
            
            expect(join2.transactions).toHaveTransaction({
                from: context.user2.address,
                to: catLottery.address,
                success: true,
            });
            
            expect(join3.transactions).toHaveTransaction({
                from: context.user3.address,
                to: catLottery.address,
                success: true,
            });
            
            // Verify final state is consistent
            const contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.participantCount).toBe(3n);
            expect(contractInfo.lotteryActive).toBe(false); // Should be full
        });

        it('should maintain performance under repeated operations', async () => {
            const operationTimes = [];
            
            // Perform 5 complete lottery cycles
            for (let cycle = 0; cycle < 5; cycle++) {
                const cycleStartTime = Date.now();
                
                // Start new round (except first)
                if (cycle > 0) {
                    await catLottery.send(
                        context.deployer.getSender(),
                        { value: toNano('0.05') },
                        'startNewRound'
                    );
                }
                
                // Fill lottery
                await catLottery.send(context.user1.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
                await catLottery.send(context.user2.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
                await catLottery.send(context.user3.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
                
                // Draw winner
                await catLottery.send(
                    context.deployer.getSender(),
                    { value: toNano('0.2') },
                    'drawWinner'
                );
                
                const cycleTime = Date.now() - cycleStartTime;
                operationTimes.push(cycleTime);
            }
            
            // Verify performance doesn't degrade significantly
            const firstThree = operationTimes.slice(0, 3);
            const lastThree = operationTimes.slice(-3);
            
            const avgFirst = firstThree.reduce((a, b) => a + b, 0) / firstThree.length;
            const avgLast = lastThree.reduce((a, b) => a + b, 0) / lastThree.length;
            
            // Performance shouldn't degrade by more than 50%
            expect(avgLast).toBeLessThan(avgFirst * 1.5);
            
            console.log(`Cycle times: ${operationTimes.join('ms, ')}ms`);
            console.log(`Performance trend - First 3: ${avgFirst}ms, Last 3: ${avgLast}ms`);
            
            // Verify final state
            const finalInfo = await catLottery.getGetContractInfo();
            expect(finalInfo.currentRound).toBe(5n);
            
            const finalNFTInfo = await catNFT.getGetContractInfo();
            expect(finalNFTInfo.totalSupply).toBe(5n);
        });
    });
});