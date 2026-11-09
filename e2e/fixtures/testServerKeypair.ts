import { Keypair } from "@stellar/stellar-sdk";

/**
 * A fixed, published, TEST-ONLY Stellar keypair used purely to sign fake
 * SEP-10 challenge transactions in E2E fixtures. Generated once with
 * `Keypair.random()` and hardcoded here - it is never funded, never used
 * for anything real, and its whole point is to be the SAME keypair on
 * both sides of the fixture: playwright.config.ts bakes its public key
 * into the build as VITE_SEP10_SERVER_SIGNING_KEY, and
 * e2e/fixtures/sep10Challenge.ts signs with its secret key at request
 * time. If this secret ever looked sensitive, it wouldn't be committed -
 * it isn't, by construction (no funds, no mainnet meaning).
 */
export const TEST_SERVER_KEYPAIR = Keypair.fromSecret(
  "SAIHDM2JB6LKHXLLPU7O7C747QKCULGBZQXN5PWLXDJBEQGSEOPLJY6M",
);
