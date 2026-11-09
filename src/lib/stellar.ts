import * as StellarSdk from "@stellar/stellar-sdk";

const NETWORK = import.meta.env.VITE_STELLAR_NETWORK ?? "testnet";

function getConfig(network: string) {
  switch (network) {
    case "testnet":
      return {
        horizonUrl: "https://horizon-testnet.stellar.org",
        rpcUrl: "https://soroban-testnet.stellar.org",
        networkPassphrase: StellarSdk.Networks.TESTNET,
      };
    case "mainnet":
      return {
        horizonUrl: "https://horizon.stellar.org",
        rpcUrl: import.meta.env.VITE_STELLAR_MAINNET_RPC_URL ?? "",
        networkPassphrase: StellarSdk.Networks.PUBLIC,
      };
    default:
      throw new Error(`Unknown VITE_STELLAR_NETWORK: ${network}`);
  }
}

export const stellarConfig = getConfig(NETWORK);
export const horizon = new StellarSdk.Horizon.Server(stellarConfig.horizonUrl);
export const rpc = new StellarSdk.rpc.Server(stellarConfig.rpcUrl);

/**
 * The USDC SAC (Stellar Asset Contract) issuer/contract. TODO: this is a
 * placeholder until billsteady-contracts' router README confirms the real
 * testnet/mainnet USDC issuer this app targets - do not treat this as a
 * verified address.
 */
export const USDC_ISSUER = import.meta.env.VITE_USDC_ISSUER ?? "";

/**
 * The deployed BillPaymentRouter contract ID. TODO: fill in once
 * billsteady-contracts' router/README.md publishes the real testnet ID -
 * see that repo for the pay(payer, token, amount, biller_id, order_ref)
 * interface this app calls.
 */
export const ROUTER_CONTRACT_ID = import.meta.env.VITE_ROUTER_CONTRACT_ID ?? "";
