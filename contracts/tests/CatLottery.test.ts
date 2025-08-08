import { SandboxContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { CatLottery } from '../build/CatLottery_CatLottery';
import { createTestContext, TestContext, TEST_CONSTANTS } from './setup';

describe('CatLottery Contract Tests', () => {
    let context: TestContext;
    let catLottery: SandboxContract<CatLottery>;

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
        
        const deployResult = await catLottery.send(
            context.deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );
        
        expect(deployResult.transactions).toHaveTransaction({
            from: context.deployer.address,
            to: catLottery.address,
            success: true,
        });
    });

    describe('Contract Initialization', () => {
        it('should initialize contract with correct parameters', async () => {
            const contractInfo = await catLottery.getGetContractInfo();
            
            expect(contractInfo.owner.toString()).toBe(context.deployer.address.toString());
            expect(contractInfo.entryFee).toBe(TEST_CONSTANTS.ENTRY_FEE);
            expect(contractInfo.maxParticipants).toBe(BigInt(TEST_CONSTANTS.MAX_PARTICIPANTS));
            expect(contractInfo.currentRound).toBe(1n);
            expect(contractInfo.lotteryActive).toBe(true);
            expect(contractInfo.participantCount).toBe(0n);
            expect(contractInfo.nftContract).toBeNull();
        });
    });

    describe('join() Method Tests', () => {
        it('should allow user to join lottery with correct entry fee', async () => {
            const result = await catLottery.send(
                context.user1.getSender(),
                {
                    value: TEST_CONSTANTS.ENTRY_FEE,
                },
                'join'
            );

            expect(result.transactions).toHaveTransaction({
                from: context.user1.address,
                to: catLottery.address,
                success: true,
            });

            // Check contract state
            const contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.participantCount).toBe(1n);
            expect(contractInfo.lotteryActive).toBe(true);

            // Check participant data
            const participant = await catLottery.getGetParticipant(0n);
            expect(participant).not.toBeNull();
            expect(participant!.address.toString()).toBe(context.user1.address.toString());
            expect(participant!.amount).toBe(TEST_CONSTANTS.ENTRY_FEE);
        });

        it('should reject entry with insufficient fee', async () => {
            const insufficientFee = toNano('0.005'); // Less than required 0.01 TON
            
            const result = await catLottery.send(
                context.user1.getSender(),
                {
                    value: insufficientFee,
                },
                'join'
            );

            expect(result.transactions).toHaveTransaction({
                from: context.user1.address,
                to: catLottery.address,
                success: false,
            });

            // Contract state should remain unchanged
            const contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.participantCount).toBe(0n);
        });

        it('should reject duplicate participation from same address', async () => {
            // First participation should succeed
            const firstResult = await catLottery.send(
                context.user1.getSender(),
                {
                    value: TEST_CONSTANTS.ENTRY_FEE,
                },
                'join'
            );

            expect(firstResult.transactions).toHaveTransaction({
                from: context.user1.address,
                to: catLottery.address,
                success: true,
            });

            // Second participation from same address should fail
            const secondResult = await catLottery.send(
                context.user1.getSender(),
                {
                    value: TEST_CONSTANTS.ENTRY_FEE,
                },
                'join'
            );

            expect(secondResult.transactions).toHaveTransaction({
                from: context.user1.address,
                to: catLottery.address,
                success: false,
            });

            // Participant count should remain 1
            const contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.participantCount).toBe(1n);
        });

        it('should allow multiple different users to join', async () => {
            // User1 joins
            await catLottery.send(
                context.user1.getSender(),
                { value: TEST_CONSTANTS.ENTRY_FEE },
                'join'
            );

            // User2 joins
            await catLottery.send(
                context.user2.getSender(),
                { value: TEST_CONSTANTS.ENTRY_FEE },
                'join'
            );

            const contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.participantCount).toBe(2n);

            // Check both participants
            const participant1 = await catLottery.getGetParticipant(0n);
            const participant2 = await catLottery.getGetParticipant(1n);

            expect(participant1!.address.toString()).toBe(context.user1.address.toString());
            expect(participant2!.address.toString()).toBe(context.user2.address.toString());
        });

        it('should deactivate lottery when maximum participants reached', async () => {
            // Fill lottery to capacity (3 participants)
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

            const thirdJoinResult = await catLottery.send(
                context.user3.getSender(),
                { value: TEST_CONSTANTS.ENTRY_FEE },
                'join'
            );

            expect(thirdJoinResult.transactions).toHaveTransaction({
                from: context.user3.address,
                to: catLottery.address,
                success: true,
            });

            // Lottery should now be inactive
            const contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.participantCount).toBe(BigInt(TEST_CONSTANTS.MAX_PARTICIPANTS));
            expect(contractInfo.lotteryActive).toBe(false);
        });

        it('should reject participation when lottery is inactive', async () => {
            // Fill lottery to capacity first
            await catLottery.send(context.user1.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user2.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user3.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');

            // Now lottery should be inactive, 4th user should be rejected
            const fourthJoinResult = await catLottery.send(
                context.user4.getSender(),
                { value: TEST_CONSTANTS.ENTRY_FEE },
                'join'
            );

            expect(fourthJoinResult.transactions).toHaveTransaction({
                from: context.user4.address,
                to: catLottery.address,
                success: false,
            });

            // Participant count should remain at max
            const contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.participantCount).toBe(BigInt(TEST_CONSTANTS.MAX_PARTICIPANTS));
        });
    });

    describe('drawWinner() Method Tests', () => {
        beforeEach(async () => {
            // Set a mock NFT contract address (using user4's address as mock)
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                {
                    $$type: 'SetNFTContract',
                    nftContract: context.user4.address,
                }
            );

            // Fill lottery with participants for drawWinner tests
            await catLottery.send(context.user1.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user2.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user3.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
        });

        it('should allow only owner to draw winner', async () => {
            const result = await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.15') }, // Increased to cover NFT gas fees
                'drawWinner'
            );

            expect(result.transactions).toHaveTransaction({
                from: context.deployer.address,
                to: catLottery.address,
                success: true,
            });
        });

        it('should reject drawWinner from non-owner', async () => {
            const result = await catLottery.send(
                context.user1.getSender(),
                { value: toNano('0.15') },
                'drawWinner'
            );

            expect(result.transactions).toHaveTransaction({
                from: context.user1.address,
                to: catLottery.address,
                success: false,
            });
        });

        it('should select a winner and create lottery result', async () => {
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.15') },
                'drawWinner'
            );

            // Check that a winner was recorded
            const winner = await catLottery.getGetWinner(1n);
            expect(winner).not.toBeNull();
            expect(winner!.nftId).toBeGreaterThan(0n);
            expect(winner!.timestamp).toBeGreaterThan(0n);

            // Winner should be one of the participants
            const winnerAddress = winner!.winner.toString();
            const validAddresses = [
                context.user1.address.toString(),
                context.user2.address.toString(),
                context.user3.address.toString(),
            ];
            expect(validAddresses).toContain(winnerAddress);
        });

        it('should reset lottery state after drawing winner', async () => {
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.15') },
                'drawWinner'
            );

            const contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.lotteryActive).toBe(false);
            expect(contractInfo.participantCount).toBe(0n);

            // Check that participants are cleared
            const participant1 = await catLottery.getGetParticipant(0n);
            const participant2 = await catLottery.getGetParticipant(1n);
            const participant3 = await catLottery.getGetParticipant(2n);
            expect(participant1).toBeNull();
            expect(participant2).toBeNull();
            expect(participant3).toBeNull();
        });

        it('should fail when no participants exist', async () => {
            // Create a completely fresh context to avoid state pollution
            const freshContext = await createTestContext();
            
            // Create a new empty lottery
            const emptyLottery = freshContext.blockchain.openContract(
                await CatLottery.fromInit(
                    freshContext.deployer.address,
                    TEST_CONSTANTS.ENTRY_FEE,
                    TEST_CONSTANTS.MAX_PARTICIPANTS
                )
            );

            // Deploy the empty lottery
            await emptyLottery.send(
                freshContext.deployer.getSender(),
                { value: toNano('0.05') },
                { $$type: 'Deploy', queryId: 0n }
            );

            // Set NFT contract for empty lottery
            await emptyLottery.send(
                freshContext.deployer.getSender(),
                { value: toNano('0.05') },
                {
                    $$type: 'SetNFTContract',
                    nftContract: freshContext.user4.address,
                }
            );

            // Verify lottery is empty
            const contractInfo = await emptyLottery.getGetContractInfo();
            expect(contractInfo.participantCount).toBe(0n);

            // Try to draw winner with no participants - should fail
            const result = await emptyLottery.send(
                freshContext.deployer.getSender(),
                { value: toNano('0.15') },
                'drawWinner'
            );

            expect(result.transactions).toHaveTransaction({
                from: freshContext.deployer.address,
                to: emptyLottery.address,
                success: false,
            });
        });

        it('should generate valid NFT ID', async () => {
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.15') },
                'drawWinner'
            );

            const winner = await catLottery.getGetWinner(1n);
            expect(winner).not.toBeNull();

            const nftId = winner!.nftId;
            expect(nftId).toBeGreaterThanOrEqual(1000n); // Round 1 * 1000 + random
            expect(nftId).toBeLessThanOrEqual(1099n);    // Round 1 * 1000 + 99 max
        });
    });
});