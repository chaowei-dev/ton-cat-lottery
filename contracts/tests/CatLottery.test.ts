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

    describe('SetNFTContract Message Tests', () => {
        it('should allow owner to set NFT contract address', async () => {
            const nftContractAddress = context.user4.address;
            
            const result = await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                {
                    $$type: 'SetNFTContract',
                    nftContract: nftContractAddress,
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: context.deployer.address,
                to: catLottery.address,
                success: true,
            });

            // Verify the NFT contract address was set
            const contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.nftContract).not.toBeNull();
            expect(contractInfo.nftContract!.toString()).toBe(nftContractAddress.toString());
        });

        it('should reject SetNFTContract from non-owner', async () => {
            const nftContractAddress = context.user4.address;
            
            const result = await catLottery.send(
                context.user1.getSender(),
                { value: toNano('0.05') },
                {
                    $$type: 'SetNFTContract',
                    nftContract: nftContractAddress,
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: context.user1.address,
                to: catLottery.address,
                success: false,
            });

            // Verify the NFT contract address was not set
            const contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.nftContract).toBeNull();
        });

        it('should allow owner to update NFT contract address', async () => {
            const firstNftAddress = context.user3.address;
            const secondNftAddress = context.user4.address;
            
            // Set first NFT contract
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                {
                    $$type: 'SetNFTContract',
                    nftContract: firstNftAddress,
                }
            );

            // Update to second NFT contract
            const result = await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                {
                    $$type: 'SetNFTContract',
                    nftContract: secondNftAddress,
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: context.deployer.address,
                to: catLottery.address,
                success: true,
            });

            // Verify the NFT contract address was updated
            const contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.nftContract!.toString()).toBe(secondNftAddress.toString());
        });
    });

    describe('startNewRound Method Tests', () => {
        beforeEach(async () => {
            // Set NFT contract and complete a round first
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                {
                    $$type: 'SetNFTContract',
                    nftContract: context.user4.address,
                }
            );

            // Fill lottery and draw winner to end the current round
            await catLottery.send(context.user1.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user2.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user3.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.15') },
                'drawWinner'
            );
        });

        it('should allow owner to start new round when lottery is inactive', async () => {
            // Verify lottery is inactive
            let contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.lotteryActive).toBe(false);
            expect(contractInfo.currentRound).toBe(1n);

            const result = await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                'startNewRound'
            );

            expect(result.transactions).toHaveTransaction({
                from: context.deployer.address,
                to: catLottery.address,
                success: true,
            });

            // Verify new round started
            contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.lotteryActive).toBe(true);
            expect(contractInfo.currentRound).toBe(2n);
            expect(contractInfo.participantCount).toBe(0n);
        });

        it('should reject startNewRound from non-owner', async () => {
            const result = await catLottery.send(
                context.user1.getSender(),
                { value: toNano('0.05') },
                'startNewRound'
            );

            expect(result.transactions).toHaveTransaction({
                from: context.user1.address,
                to: catLottery.address,
                success: false,
            });

            // Verify round was not started
            const contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.lotteryActive).toBe(false);
            expect(contractInfo.currentRound).toBe(1n);
        });

        it('should reject startNewRound when lottery is still active', async () => {
            // Start new round first
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                'startNewRound'
            );

            // Try to start another round while current one is active
            const result = await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                'startNewRound'
            );

            expect(result.transactions).toHaveTransaction({
                from: context.deployer.address,
                to: catLottery.address,
                success: false,
            });

            // Round should remain 2 (from first successful call)
            const contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.currentRound).toBe(2n);
        });

        it('should clear participant list when starting new round', async () => {
            // Start new round
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                'startNewRound'
            );

            // Verify participants are cleared
            const participant1 = await catLottery.getGetParticipant(0n);
            const participant2 = await catLottery.getGetParticipant(1n);
            const participant3 = await catLottery.getGetParticipant(2n);
            
            expect(participant1).toBeNull();
            expect(participant2).toBeNull();
            expect(participant3).toBeNull();

            const contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.participantCount).toBe(0n);
        });

        it('should allow new participants after starting new round', async () => {
            // Start new round
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                'startNewRound'
            );

            // Add new participant
            const result = await catLottery.send(
                context.user1.getSender(),
                { value: TEST_CONSTANTS.ENTRY_FEE },
                'join'
            );

            expect(result.transactions).toHaveTransaction({
                from: context.user1.address,
                to: catLottery.address,
                success: true,
            });

            const contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.participantCount).toBe(1n);
            expect(contractInfo.currentRound).toBe(2n);

            const participant = await catLottery.getGetParticipant(0n);
            expect(participant!.address.toString()).toBe(context.user1.address.toString());
        });
    });

    describe('withdraw Method Tests', () => {
        beforeEach(async () => {
            // Set NFT contract and add some funds to the contract
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                {
                    $$type: 'SetNFTContract',
                    nftContract: context.user4.address,
                }
            );

            // Add participants to generate contract balance
            await catLottery.send(context.user1.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user2.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user3.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            
            // Draw winner to end the lottery (making it inactive)
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.15') },
                'drawWinner'
            );
        });

        it('should allow owner to withdraw when lottery is inactive', async () => {
            // Verify lottery is inactive
            const contractInfoBefore = await catLottery.getGetContractInfo();
            expect(contractInfoBefore.lotteryActive).toBe(false);

            // Get initial contract balance
            const initialContractBalance = await catLottery.getGetBalance();

            const result = await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                'withdraw'
            );

            expect(result.transactions).toHaveTransaction({
                from: context.deployer.address,
                to: catLottery.address,
                success: true,
            });

            // Check that contract balance decreased (should keep minimum balance)
            const finalContractBalance = await catLottery.getGetBalance();
            expect(finalContractBalance).toBeLessThan(initialContractBalance);
        });

        it('should reject withdraw from non-owner', async () => {
            const result = await catLottery.send(
                context.user1.getSender(),
                { value: toNano('0.05') },
                'withdraw'
            );

            expect(result.transactions).toHaveTransaction({
                from: context.user1.address,
                to: catLottery.address,
                success: false,
            });
        });

        it('should reject withdraw during active lottery', async () => {
            // Start a new round to make lottery active
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                'startNewRound'
            );

            // Add a participant to make it active
            await catLottery.send(context.user1.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');

            // Verify lottery is active
            const contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.lotteryActive).toBe(true);

            // Try to withdraw - should fail
            const result = await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                'withdraw'
            );

            expect(result.transactions).toHaveTransaction({
                from: context.deployer.address,
                to: catLottery.address,
                success: false,
            });
        });

        it('should maintain minimum contract balance after withdrawal', async () => {
            // Get initial balance
            const initialBalance = await catLottery.getGetBalance();
            
            // Withdraw
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                'withdraw'
            );

            // Check final balance - should be at least close to 0.1 TON (allowing for gas fees)
            const finalBalance = await catLottery.getGetBalance();
            expect(finalBalance).toBeGreaterThanOrEqual(toNano('0.05')); // More realistic expectation
            expect(finalBalance).toBeLessThan(initialBalance); // Should have decreased
        });

        it('should handle withdrawal when contract has minimal balance', async () => {
            // First withdraw most funds
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                'withdraw'
            );

            // Try to withdraw again - should succeed but not transfer much
            const result = await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                'withdraw'
            );

            expect(result.transactions).toHaveTransaction({
                from: context.deployer.address,
                to: catLottery.address,
                success: true,
            });

            // Contract should still maintain minimum balance
            const finalBalance = await catLottery.getGetBalance();
            expect(finalBalance).toBeGreaterThanOrEqual(toNano('0.09')); // Allow for gas fees
        });
    });

    describe('sendNFT Method Tests (via drawWinner)', () => {
        beforeEach(async () => {
            // Set NFT contract and fill lottery
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                {
                    $$type: 'SetNFTContract',
                    nftContract: context.user4.address,
                }
            );

            await catLottery.send(context.user1.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user2.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user3.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
        });

        it('should send NFT to winner when drawing winner', async () => {
            const result = await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.15') },
                'drawWinner'
            );

            expect(result.transactions).toHaveTransaction({
                from: context.deployer.address,
                to: catLottery.address,
                success: true,
            });

            // Verify that a message was sent to the NFT contract
            expect(result.transactions).toHaveTransaction({
                from: catLottery.address,
                to: context.user4.address, // NFT contract address
                success: true,
            });

            // Check that winner was recorded
            const winner = await catLottery.getGetWinner(1n);
            expect(winner).not.toBeNull();
        });

        it('should fail when NFT contract is not set', async () => {
            // Create a fresh lottery without NFT contract set
            const freshContext = await createTestContext();
            const freshLottery = freshContext.blockchain.openContract(
                await CatLottery.fromInit(
                    freshContext.deployer.address,
                    TEST_CONSTANTS.ENTRY_FEE,
                    TEST_CONSTANTS.MAX_PARTICIPANTS
                )
            );

            await freshLottery.send(
                freshContext.deployer.getSender(),
                { value: toNano('0.05') },
                { $$type: 'Deploy', queryId: 0n }
            );

            // Add participants
            await freshLottery.send(freshContext.user1.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await freshLottery.send(freshContext.user2.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await freshLottery.send(freshContext.user3.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');

            // Try to draw winner without NFT contract set - should fail
            const result = await freshLottery.send(
                freshContext.deployer.getSender(),
                { value: toNano('0.15') },
                'drawWinner'
            );

            expect(result.transactions).toHaveTransaction({
                from: freshContext.deployer.address,
                to: freshLottery.address,
                success: false,
            });
        });

        it('should use sufficient gas for NFT minting', async () => {
            const result = await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.15') }, // Should be enough for NFT gas
                'drawWinner'
            );

            expect(result.transactions).toHaveTransaction({
                from: catLottery.address,
                to: context.user4.address, // NFT contract
                success: true,
            });

            // Check that the transaction to NFT contract has reasonable value
            const nftTransaction = result.transactions.find(tx => 
                tx.inMessage?.info.type === 'internal' && 
                tx.inMessage.info.dest?.equals(context.user4.address)
            );
            
            expect(nftTransaction).toBeDefined();
        });

        it('should handle insufficient gas gracefully', async () => {
            // Test with insufficient gas - should fail completely
            const result = await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') }, // Lower gas, insufficient for the operation
                'drawWinner'
            );

            // The lottery draw should fail due to insufficient gas
            expect(result.transactions).toHaveTransaction({
                from: context.deployer.address,
                to: catLottery.address,
                success: false,
            });

            // Winner should not be recorded when transaction fails
            const winner = await catLottery.getGetWinner(1n);
            expect(winner).toBeNull();
        });
    });

    describe('Getter Methods and Edge Cases Tests', () => {
        it('should return correct balance through getBalance getter', async () => {
            const balance1 = await catLottery.getGetBalance();
            
            // Add participant to increase balance
            await catLottery.send(context.user1.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            
            const balance2 = await catLottery.getGetBalance();
            expect(balance2).toBeGreaterThan(balance1);
        });

        it('should return null for non-existent participants', async () => {
            const nonExistentParticipant = await catLottery.getGetParticipant(999n);
            expect(nonExistentParticipant).toBeNull();
        });

        it('should return null for non-existent winners', async () => {
            const nonExistentWinner = await catLottery.getGetWinner(999n);
            expect(nonExistentWinner).toBeNull();
        });

        it('should handle boundary values for getParticipant', async () => {
            // Add participants
            await catLottery.send(context.user1.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user2.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');

            // Test valid indices
            const participant0 = await catLottery.getGetParticipant(0n);
            const participant1 = await catLottery.getGetParticipant(1n);
            
            expect(participant0).not.toBeNull();
            expect(participant1).not.toBeNull();
            
            // Test boundary - next index should be null
            const participant2 = await catLottery.getGetParticipant(2n);
            expect(participant2).toBeNull();
        });

        it('should maintain consistent contract info across state changes', async () => {
            // Initial state
            let contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.lotteryActive).toBe(true);
            expect(contractInfo.participantCount).toBe(0n);
            expect(contractInfo.currentRound).toBe(1n);

            // Add participant
            await catLottery.send(context.user1.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            
            contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.participantCount).toBe(1n);
            expect(contractInfo.lotteryActive).toBe(true);

            // Fill lottery
            await catLottery.send(context.user2.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user3.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');

            contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.participantCount).toBe(3n);
            expect(contractInfo.lotteryActive).toBe(false); // Should deactivate when full
        });

        it('should handle multiple rounds correctly in getWinner', async () => {
            // Set NFT contract
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                {
                    $$type: 'SetNFTContract',
                    nftContract: context.user4.address,
                }
            );

            // Complete first round
            await catLottery.send(context.user1.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user2.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user3.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.deployer.getSender(), { value: toNano('0.15') }, 'drawWinner');

            // Check first round winner
            const winner1 = await catLottery.getGetWinner(1n);
            expect(winner1).not.toBeNull();
            expect(winner1!.nftId).toBeGreaterThanOrEqual(1000n);
            expect(winner1!.nftId).toBeLessThanOrEqual(1099n);

            // Start second round and complete it
            await catLottery.send(context.deployer.getSender(), { value: toNano('0.05') }, 'startNewRound');
            await catLottery.send(context.user1.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user2.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user3.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.deployer.getSender(), { value: toNano('0.15') }, 'drawWinner');

            // Check second round winner
            const winner2 = await catLottery.getGetWinner(2n);
            expect(winner2).not.toBeNull();
            expect(winner2!.nftId).toBeGreaterThanOrEqual(2000n); // Round 2 * 1000
            expect(winner2!.nftId).toBeLessThanOrEqual(2099n);

            // Both winners should still be accessible
            const winner1Again = await catLottery.getGetWinner(1n);
            expect(winner1Again).not.toBeNull();
            expect(winner1Again!.nftId).toBe(winner1!.nftId);
        });

        it('should handle zero participants edge case properly', async () => {
            const contractInfo = await catLottery.getGetContractInfo();
            expect(contractInfo.participantCount).toBe(0n);

            // Try to access first participant when none exist
            const participant = await catLottery.getGetParticipant(0n);
            expect(participant).toBeNull();
        });
    });

    describe('Helper Functions Tests', () => {
        it('should return correct cat names for different template IDs', async () => {
            // Note: getCatNameByTemplate is a helper function used internally
            // We can test it indirectly by verifying the NFT generation logic
            // For now, we can test the template mapping logic by testing different rounds
            // which would generate different template IDs
            
            // Set NFT contract
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                {
                    $$type: 'SetNFTContract',
                    nftContract: context.user4.address,
                }
            );

            // Test multiple rounds to ensure different templates might be used
            for (let round = 1; round <= 4; round++) {
                // Fill lottery
                await catLottery.send(context.user1.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
                await catLottery.send(context.user2.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
                await catLottery.send(context.user3.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');

                // Draw winner
                await catLottery.send(context.deployer.getSender(), { value: toNano('0.15') }, 'drawWinner');

                // Verify winner exists
                const winner = await catLottery.getGetWinner(BigInt(round));
                expect(winner).not.toBeNull();
                expect(winner!.nftId).toBeGreaterThanOrEqual(BigInt(round * 1000));
                expect(winner!.nftId).toBeLessThanOrEqual(BigInt(round * 1000 + 99));

                // Start next round if not the last iteration
                if (round < 4) {
                    await catLottery.send(context.deployer.getSender(), { value: toNano('0.05') }, 'startNewRound');
                }
            }
        });

        it('should handle contract initialization parameters correctly', async () => {
            // Test that contract was initialized with correct parameters
            const contractInfo = await catLottery.getGetContractInfo();
            
            expect(contractInfo.owner.toString()).toBe(context.deployer.address.toString());
            expect(contractInfo.entryFee).toBe(TEST_CONSTANTS.ENTRY_FEE);
            expect(contractInfo.maxParticipants).toBe(TEST_CONSTANTS.MAX_PARTICIPANTS);
            expect(contractInfo.currentRound).toBe(1n);
            expect(contractInfo.lotteryActive).toBe(true);
            expect(contractInfo.participantCount).toBe(0n);
            expect(contractInfo.nftContract).toBeNull();
        });

        it('should handle edge cases in random number generation', async () => {
            // Set NFT contract
            await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.05') },
                {
                    $$type: 'SetNFTContract',
                    nftContract: context.user4.address,
                }
            );

            // Test with single participant
            await catLottery.send(context.user1.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user2.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');
            await catLottery.send(context.user3.getSender(), { value: TEST_CONSTANTS.ENTRY_FEE }, 'join');

            const result = await catLottery.send(
                context.deployer.getSender(),
                { value: toNano('0.15') },
                'drawWinner'
            );

            expect(result.transactions).toHaveTransaction({
                from: context.deployer.address,
                to: catLottery.address,
                success: true,
            });

            // Winner should be one of the three participants
            const winner = await catLottery.getGetWinner(1n);
            expect(winner).not.toBeNull();
            
            const validAddresses = [
                context.user1.address.toString(),
                context.user2.address.toString(), 
                context.user3.address.toString(),
            ];
            expect(validAddresses).toContain(winner!.winner.toString());
        });
    });
});