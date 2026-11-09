import { useCallback, useState } from "react";
import { useStellarWallet } from "./wallet";
import { useSessionState } from "./store";

/**
 * Composes wallet connection + the SEP-10 sign-in flow. @stellar/stellar-sdk
 * (and everything in ./sep10.ts/./stellar.ts that imports it) is loaded via
 * dynamic import inside signIn, not at module top-level - same reasoning as
 * wallet.ts's lazy kit load: this hook runs on every App mount (even before
 * the user has connected anything), and eagerly importing the full SDK here
 * was most of this app's ~180KB gzip main-chunk weight.
 */
export function useAuth() {
  const wallet = useStellarWallet();
  const [session, setSession] = useSessionState();
  const [signInError, setSignInError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    setSignInError(null);
    try {
      const address = await wallet.connect();

      const { requestChallenge, submitSignedChallenge, validateChallenge } = await import("./sep10");
      const { stellarConfig } = await import("./stellar");

      const { transaction, network_passphrase } = await requestChallenge(address);
      const networkPassphrase = network_passphrase ?? stellarConfig.networkPassphrase;

      validateChallenge(transaction, address, networkPassphrase);

      const signedXdr = await wallet.sign(transaction);
      const token = await submitSignedChallenge(signedXdr);

      setSession({ address, sep10Token: token });
      return { address, token };
    } catch (err) {
      // wallet.connect() already sets wallet.error for its own failures
      // (and still rethrows, so this catch runs for those too - the
      // rethrow matters for wallet.ts's own callers, not for this one).
      // Every step AFTER a successful connect() - the challenge request,
      // validateChallenge's real cryptographic checks, signing, and the
      // token exchange - previously had no error handling at all: a
      // failure there left the user stuck on the connect screen with no
      // visible error and an unhandled promise rejection in the console
      // (ConnectWalletScreen's onClick={onConnect} never catches). Found
      // by an E2E test asserting no uncaught page error occurred, not by
      // any unit test - every unit test mocks these functions rather than
      // exercising this call chain.
      setSignInError(err instanceof Error ? err.message : "Could not sign in");
      return undefined;
    }
  }, [wallet, setSession]);

  const signOut = useCallback(async () => {
    await wallet.disconnect();
    setSession({ address: null, sep10Token: null });
  }, [wallet, setSession]);

  return {
    address: session.address,
    token: session.sep10Token,
    connecting: wallet.connecting,
    error: signInError ?? wallet.error,
    signIn,
    signOut,
    /** Signs an arbitrary transaction XDR with the connected wallet - used by the pay flow, not just sign-in. */
    signTransaction: wallet.sign,
    isAuthenticated: Boolean(session.address && session.sep10Token),
  };
}
