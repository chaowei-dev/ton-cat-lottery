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

            // Step 4: Verify lottery state reset
            const contractInfoAfterDraw = await catLottery.getGetContractInfo();
            expect(contractInfoAfterDraw.participantCount).toBe(0n);
            expect(contractInfoAfterDraw.lotteryActive).toBe(false);

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

                // Start next round (except for last iteration)
                if (round < 3) {
                    const startRoundResult = await catLottery.send(
                        context.deployer.getSender(),
                        { value: toNano('0.05') },
                        'startNewRound'
                    );

                    expect(startRoundResult.transactions).toHaveTransaction({
                        from: context.deployer.address,
                        to: catLottery.address,
                        success: true,
                    });

                    // Verify new round started
                    const contractInfo = await catLottery.getGetContractInfo();
                    expect(contractInfo.currentRound).toBe(BigInt(round + 1));
                    expect(contractInfo.lotteryActive).toBe(true);
                    expect(contractInfo.participantCount).toBe(0n);
                }
            }

            // Verify final state
            const finalContractInfo = await catLottery.getGetContractInfo();
            expect(finalContractInfo.currentRound).toBe(3n);
            
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
});