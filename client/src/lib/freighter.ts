export interface FreighterWallet {
  isConnected(): Promise<{ isConnected: boolean }>;
  isAllowed(): Promise<{ isAllowed: boolean }>;
  requestAccess(): Promise<{ address: string }>;
  getAddress(): Promise<{ address: string }>;
  signTransaction(
    xdr: string,
    opts: { networkPassphrase?: string; account?: string }
  ): Promise<{ signedTxXdr: string }>;
}

declare global {
  interface Window {
    freighter?: FreighterWallet;
  }
}

export async function isFreighterInstalled(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return typeof window.freighter !== "undefined";
}

export async function connectFreighter(): Promise<string | null> {
  if (typeof window === "undefined" || !window.freighter) return null;

  try {
    const { isConnected } = await window.freighter.isConnected();
    if (!isConnected) {
      const { address } = await window.freighter.requestAccess();
      return address;
    }
    const { address } = await window.freighter.getAddress();
    return address;
  } catch (err) {
    console.error("Freighter connection failed:", err);
    return null;
  }
}

export async function getFreighterAddress(): Promise<string | null> {
  if (typeof window === "undefined" || !window.freighter) return null;

  try {
    const { isAllowed } = await window.freighter.isAllowed();
    if (!isAllowed) return null;
    const { address } = await window.freighter.getAddress();
    return address;
  } catch {
    return null;
  }
}

export async function signWithFreighter(
  xdr: string,
  networkPassphrase: string
): Promise<string | null> {
  if (typeof window === "undefined" || !window.freighter) return null;

  try {
    const { signedTxXdr } = await window.freighter.signTransaction(xdr, {
      networkPassphrase,
    });
    return signedTxXdr;
  } catch (err) {
    console.error("Signing failed:", err);
    return null;
  }
}
