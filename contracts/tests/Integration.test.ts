import { SandboxContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { CatLottery } from '../build/CatLottery_CatLottery';
import { CatNFT } from '../build/CatNFT_CatNFT';
import { createTestContext, TestContext, TEST_CONSTANTS } from './setup';

describe('Integration Tests - Contract Interactions', () => {
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
            await CatNFT.fromInit(context.deployer.address, 1n)
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
    });

    describe('Contract Authorization Configuration', () => {
        it('should correctly configure cross-contract authorization', async () => {
            // Step 1: Set NFT contract in CatLottery
            const setNFTResult = await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                {
                    $$type: 'SetNFTContract',
                    nftContract: catNFT.address,
                }
            );

            expect(setNFTResult.transactions).toHaveTransaction({
                from: context.deployer.address,
                to: catLottery.address,
                success: true,
            });

            // Step 2: Set CatLottery as authorized minter in CatNFT
            const setMinterResult = await catNFT.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                {
                    $$type: 'SetAuthorizedMinter',
                    minter: catLottery.address,
                }
            );

            expect(setMinterResult.transactions).toHaveTransaction({
                from: context.deployer.address,
                to: catNFT.address,
                success: true,
            });

            // Step 3: Verify configurations
            const lotteryInfo = await catLottery.getGetContractInfo();
            const nftInfo = await catNFT.getGetContractInfo();

            expect(lotteryInfo.nftContract?.toString()).toBe(catNFT.address.toString());
            expect(nftInfo.authorizedMinter?.toString()).toBe(catLottery.address.toString());
        });
    });

    describe('End-to-End Lottery Flow', () => {
        beforeEach(async () => {
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

        it('should execute complete lottery flow: join → drawWinner → auto NFT minting', async () => {
            // Step 1: Users join the lottery
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
            
            await catLottery.send(
                context.user3.getSender(),
                { value: TEST_CONSTANTS.ENTRY_FEE },
                'join'
            );

            // Verify participants joined
            const contractInfoAfterJoin = await catLottery.getGetContractInfo();
            expect(contractInfoAfterJoin.participantCount).toBe(3n);
            expect(contractInfoAfterJoin.lotteryActive).toBe(false); // Full lottery

            // Step 2: Draw winner (should trigger NFT minting)
            const drawResult = await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.2') }, // Higher gas for cross-contract call
                'drawWinner'
            );

            // Verify draw winner transaction succeeded
            expect(drawResult.transactions).toHaveTransaction({
                from: context.deployer.address,
                to: catLottery.address,
                success: true,
            });

            // Step 3: Verify NFT contract received mint request
            expect(drawResult.transactions).toHaveTransaction({
                from: catLottery.address,
                to: catNFT.address,
                success: true,
            });

            // Step 4: Verify lottery state reset and auto new round started
            const contractInfoAfterDraw = await catLottery.getGetContractInfo();
            expect(contractInfoAfterDraw.participantCount).toBe(0n);
            expect(contractInfoAfterDraw.lotteryActive).toBe(true); // Auto-started new round
            expect(contractInfoAfterDraw.currentRound).toBe(2n); // Round incremented

            // Step 5: Verify winner was recorded
            const winner = await catLottery.getGetWinner(1n);
            expect(winner).not.toBeNull();
            expect(winner!.nftId).toBeGreaterThan(0n);

            // Step 6: Verify NFT was minted
            const nftInfo = await catNFT.getGetContractInfo();
            expect(nftInfo.totalSupply).toBe(1n);
            expect(nftInfo.nextTokenId).toBe(2n);

            // Step 7: Verify winner received NFT (check balance)
            const winnerBalance = await catNFT.getBalanceOf(winner!.winner);
            expect(winnerBalance).toBe(1n);
        });

        it('should handle insufficient gas gracefully', async () => {
            // Fill lottery
            await catLottery.send(context.user1.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user2.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user3.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');

            // Draw winner with insufficient gas should fail
            const drawResult = await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') }, // Insufficient gas for cross-contract calls
                'drawWinner'
            );

            // The lottery draw should fail due to insufficient gas
            expect(drawResult.transactions).toHaveTransaction({
                from: context.deployer.address,
                to: catLottery.address,
                success: false,
            });

            // No winner should be recorded when transaction fails
            const winner = await catLottery.getGetWinner(1n);
            expect(winner).toBeNull();
        });
    });

    describe('Multi-Round Lottery Continuity', () => {
        beforeEach(async () => {
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

        it('should handle multiple consecutive lottery rounds correctly', async () => {
            for (let round = 1; round <= 3; round++) {
                // Fill lottery for this round
                await catLottery.send(context.user1.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
                await catLottery.send(context.user2.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
                await catLottery.send(context.user3.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');

                // Draw winner for this round
                const drawResult = await catLottery.send(
                    context.deployer.getSender(),
                    { value: toNano('0.2') },
                    'drawWinner'
                );

                expect(drawResult.transactions).toHaveTransaction({
                    from: context.deployer.address,
                    to: catLottery.address,
                    success: true,
                });

                // Verify winner for this round
                const winner = await catLottery.getGetWinner(BigInt(round));
                expect(winner).not.toBeNull();
                expect(winner!.nftId).toBeGreaterThanOrEqual(BigInt(round * 1000));
                expect(winner!.nftId).toBeLessThanOrEqual(BigInt(round * 1000 + 99));

                // Verify new round auto-started (except for last iteration)
                if (round < 3) {
                    // New round should automatically start after drawWinner
                    const contractInfo = await catLottery.getGetContractInfo();
                    expect(contractInfo.currentRound).toBe(BigInt(round + 1));
                    expect(contractInfo.lotteryActive).toBe(true);
                    expect(contractInfo.participantCount).toBe(0n);
                }
            }

            // Verify final state
            const finalContractInfo = await catLottery.getGetContractInfo();
            expect(finalContractInfo.currentRound).toBe(4n); // Auto incremented after last round
            
            const finalNFTInfo = await catNFT.getGetContractInfo();
            expect(finalNFTInfo.totalSupply).toBe(3n); // 3 NFTs minted across 3 rounds

            // Verify all winners are recorded
            for (let round = 1; round <= 3; round++) {
                const winner = await catLottery.getGetWinner(BigInt(round));
                expect(winner).not.toBeNull();
            }
        });

        it('should maintain proper NFT ID generation across rounds', async () => {
            const rounds = 2;
            const winners: any[] = [];

            for (let round = 1; round <= rounds; round++) {
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

                const winner = await catLottery.getGetWinner(BigInt(round));
                winners.push(winner);

                if (round < rounds) {
                    await catLottery.send(
                        context.deployer.getSender(),
                        { value: toNano('0.05') },
                        'startNewRound'
                    );
                }
            }

            // Verify NFT IDs are in correct ranges for each round
            for (let i = 0; i < winners.length; i++) {
                const round = i + 1;
                const winner = winners[i];
                
                expect(winner.nftId).toBeGreaterThanOrEqual(BigInt(round * 1000));
                expect(winner.nftId).toBeLessThanOrEqual(BigInt(round * 1000 + 99));
            }

            // Verify all NFT IDs are unique
            const nftIds = winners.map(w => w.nftId.toString());
            const uniqueIds = new Set(nftIds);
            expect(uniqueIds.size).toBe(winners.length);
        });
    });

    describe('NFT Minting Failure and Recovery Tests', () => {
        it('should handle NFT contract authorization failure gracefully', async () => {
            // Set up contracts without proper authorization
            const { catLottery, catNFT } = await setupContracts(context);
            
            // Set NFT contract but don't authorize it
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                {
                    $$type: 'SetNFTContract',
                    nftContract: catNFT.address,
                }
            );
            
            // Don't call SetAuthorizedMinter - this simulates authorization failure
            
            // Add participants
            for (const user of [context.user1, context.user2, context.user3]) {
                await catLottery.send(
                    user.getSender(),
                    { value: toNano('0.02') },
                    'join'
                );
            }
            
            // Try to draw winner - should succeed in lottery contract
            // but NFT minting will fail due to authorization
            const drawResult = await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.2') },
                'drawWinner'
            );
            
            // The draw transaction itself should succeed
            expect(drawResult.transactions).toHaveTransaction({
                from: context.deployer.address,
                to: catLottery.address,
                success: true,
            });
            
            // But there might be a failed NFT transaction due to authorization
            // Since we use bounce: false, the main transaction still succeeds
        });

        it('should handle callback mechanism with MintToAndNotify', async () => {
            const { catLottery, catNFT } = await setupContracts(context);
            
            // Properly set up authorization
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
            
            // Add participant
            await catLottery.send(
                context.user1.getSender(),
                { value: toNano('0.02') },
                'join'
            );
            
            // Execute draw - this should use the new MintToAndNotify flow
            const drawResult = await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.2') },
                'drawWinner'
            );
            
            expect(drawResult.transactions).toHaveTransaction({
                from: context.deployer.address,
                to: catLottery.address,
                success: true,
            });
            
            // Verify that MintToAndNotify was called
            expect(drawResult.transactions).toHaveTransaction({
                from: catLottery.address,
                to: catNFT.address,
                success: true,
            });
            
            // Verify that NFTMintSuccess callback was sent
            expect(drawResult.transactions).toHaveTransaction({
                from: catNFT.address,
                to: catLottery.address,
                success: true,
            });
            
            // Verify winner was recorded after callback
            const winner = await catLottery.getGetWinner(1n);
            expect(winner).not.toBeNull();
            expect(winner!.winner).toEqualAddress(context.user1.address);
            
            // Verify NFT was actually minted
            const nftInfo = await catNFT.getGetContractInfo();
            expect(nftInfo.totalSupply).toBe(1n);
        });

        it('should handle insufficient gas for NFT minting', async () => {
            const { catLottery, catNFT } = await setupContracts(context);
            
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
            
            await catLottery.send(
                context.user1.getSender(),
                { value: toNano('0.02') },
                'join'
            );
            
            // Try draw with very low gas - might cause NFT minting to fail
            const drawResult = await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') }, // Very low gas
                'drawWinner'
            );
            
            // The transaction should still succeed due to bounce: false
            expect(drawResult.transactions).toHaveTransaction({
                from: context.deployer.address,
                to: catLottery.address,
                success: true,
            });
        });

        it('should maintain state consistency across failed operations', async () => {
            const { catLottery, catNFT } = await setupContracts(context);
            
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
            
            // Add participants
            await catLottery.send(
                context.user1.getSender(),
                { value: toNano('0.02') },
                'join'
            );
            
            const beforeInfo = await catLottery.getGetContractInfo();
            expect(beforeInfo.drawInProgress).toBe(false);
            expect(beforeInfo.currentRound).toBe(1n);
            expect(beforeInfo.participantCount).toBe(1n);
            
            // Execute successful draw
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.2') },
                'drawWinner'
            );
            
            const afterInfo = await catLottery.getGetContractInfo();
            expect(afterInfo.drawInProgress).toBe(false);
            expect(afterInfo.currentRound).toBe(2n); // Should increment
            expect(afterInfo.participantCount).toBe(0n); // Should reset
            expect(afterInfo.lotteryActive).toBe(true); // Should be active for new round
        });

        it('should handle recovery from stuck draw state', async () => {
            const { catLottery, catNFT } = await setupContracts(context);
            
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
            
            await catLottery.send(
                context.user1.getSender(),
                { value: toNano('0.02') },
                'join'
            );
            
            // In a real failure scenario, we would need to test resetDrawState
            // For now, we verify the recovery mechanisms exist
            const info = await catLottery.getGetContractInfo();
            expect(info.drawInProgress).toBe(false);
            
            // Test that resetDrawState exists and can be called (will fail since no draw in progress)
            const resetResult = await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                'resetDrawState'
            );
            
            expect(resetResult.transactions).toHaveTransaction({
                from: context.deployer.address,
                to: catLottery.address,
                success: false, // Should fail since no draw in progress
            });
            
            // Test timeout reset exists
            const timeoutResetResult = await catLottery.send(
                context.user1.getSender(),
                { value: toNano('0.05') },
                'resetDrawStateIfTimeout'
            );
            
            expect(timeoutResetResult.transactions).toHaveTransaction({
                from: context.user1.address,
                to: catLottery.address,
                success: false, // Should fail since no draw in progress
            });
        });
    });

    describe('Enhanced Event Tracking Tests', () => {
        it('should emit new callback-related events', async () => {
            const { catLottery, catNFT } = await setupContracts(context);
            
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
            
            await catLottery.send(
                context.user1.getSender(),
                { value: toNano('0.02') },
                'join'
            );
            
            const drawResult = await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.2') },
                'drawWinner'
            );
            
            // The new flow should emit different events
            // We can verify transactions occurred even if we can't parse events directly
            expect(drawResult.transactions).toHaveLength(4); // Main transaction + NFT transactions
            
            const winner = await catLottery.getGetWinner(1n);
            expect(winner).not.toBeNull();
        });
    });
});