import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import '@ton/test-utils';

// Global test setup for TON blockchain tests
export interface TestContext {
    blockchain: Blockchain;
    deployer: SandboxContract<TreasuryContract>;
    user1: SandboxContract<TreasuryContract>;
    user2: SandboxContract<TreasuryContract>;
    user3: SandboxContract<TreasuryContract>;
    user4: SandboxContract<TreasuryContract>;
}

export async function createTestContext(): Promise<TestContext> {
    // Create blockchain instance
    const blockchain = await Blockchain.create();
    
    // Create test accounts
    const deployer = await blockchain.treasury('deployer');
    const user1 = await blockchain.treasury('user1');
    const user2 = await blockchain.treasury('user2');
    const user3 = await blockchain.treasury('user3');
    const user4 = await blockchain.treasury('user4');
    
    return {
        blockchain,
        deployer,
        user1,
        user2,
        user3,
        user4,
    };
}

// Common test constants
export const TEST_CONSTANTS = {
    ENTRY_FEE: toNano('0.01'),
    MAX_PARTICIPANTS: 3n,
    GAS_FEE: toNano('0.1'),
    MIN_BALANCE: toNano('0.1'),
} as const;

// Helper function to create empty cell
export function emptyCell(): Cell {
    return new Cell();
}

// Helper function to advance blockchain time
export async function advanceTime(blockchain: Blockchain, seconds: number): Promise<void> {
    const currentTime = Math.floor(Date.now() / 1000);
    blockchain.now = currentTime + seconds;
}

// Helper function to format TON amount for display
export function formatTon(amount: bigint): string {
    return (Number(amount) / 1e9).toFixed(9);
}