/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_CONTRACT_ADDRESS: string;
    readonly VITE_CHAIN_ID?: string;
    readonly VITE_RPC_URL?: string;
    readonly VITE_NETWORK_NAME?: string;
    readonly VITE_DEMO_ADMIN_USER?: string;
    readonly VITE_DEMO_ADMIN_PASS?: string;
    readonly VITE_DEMO_USER_USER?: string;
    readonly VITE_DEMO_USER_PASS?: string;
    readonly DEV: boolean;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
