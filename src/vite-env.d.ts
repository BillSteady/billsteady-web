/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STELLAR_NETWORK?: "testnet" | "mainnet";
  readonly VITE_STELLAR_MAINNET_RPC_URL?: string;
  readonly VITE_USDC_ISSUER?: string;
  readonly VITE_ROUTER_CONTRACT_ID?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SEP10_HOME_DOMAIN?: string;
  readonly VITE_SEP10_SERVER_SIGNING_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
