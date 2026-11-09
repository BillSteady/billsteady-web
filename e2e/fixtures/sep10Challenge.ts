import { Account, Networks, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { TEST_SERVER_KEYPAIR } from "./testServerKeypair";

/**
 * Builds a real, validly-structured, validly-server-signed SEP-10 challenge
 * transaction for a given client account - exactly what src/lib/sep10.ts's
 * validateChallenge() checks before this app will sign anything. This lets
 * the E2E suite exercise that real cryptographic validation logic instead
 * of stubbing it out, while everything downstream (the backend that would
 * normally issue this) is mocked via Playwright route interception.
 *
 * Mirrors validateChallenge()'s checks exactly: source = server keypair,
 * sequence = 0, first op = manage_data "{homeDomain} auth" sourced from the
 * client account, signed by the server keypair.
 */
export function buildSep10Challenge(clientAccount: string, homeDomain = "billsteady.app"): string {
  const serverAccount = new Account(TEST_SERVER_KEYPAIR.publicKey(), "-1"); // -1 -> tx sequence becomes 0
  const tx = new TransactionBuilder(serverAccount, {
    fee: "100",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.manageData({
        source: clientAccount,
        name: `${homeDomain} auth`,
        value: crypto.getRandomValues(new Uint8Array(48)),
      }),
    )
    .setTimeout(300)
    .build();

  tx.sign(TEST_SERVER_KEYPAIR);
  return tx.toXDR();
}
