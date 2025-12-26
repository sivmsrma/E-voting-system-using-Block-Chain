const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

if (!contractAddress || typeof contractAddress !== 'string') {
    throw new Error(
        'VITE_CONTRACT_ADDRESS is not defined. Please set it in your .env file.\n' +
        'Example: VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3'
    );
}

export const CONTRACT_ADDRESS: string = contractAddress;

// Demo credentials are loaded from environment variables for security
// Never commit credentials to source control
export const DEMO_CREDENTIALS = {
    ADMIN: {
        username: import.meta.env.VITE_DEMO_ADMIN_USER || '',
        password: import.meta.env.VITE_DEMO_ADMIN_PASS || '',
    },
    USER: {
        username: import.meta.env.VITE_DEMO_USER_USER || '',
        password: import.meta.env.VITE_DEMO_USER_PASS || '',
    },
} as const;

export const NETWORK_CONFIG = {
    CHAIN_ID: import.meta.env.VITE_CHAIN_ID
        ? parseInt(import.meta.env.VITE_CHAIN_ID, 10)
        : 31337,
    RPC_URL: import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545',
    NETWORK_NAME: import.meta.env.VITE_NETWORK_NAME || 'Hardhat Localhost',
} as const;

export const BREAKPOINTS = {
    MOBILE: 480,
    TABLET: 768,
    DESKTOP: 1024,
    WIDE: 1280,
} as const;
