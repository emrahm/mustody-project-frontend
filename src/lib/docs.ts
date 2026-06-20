/** Mustody docs routes — keep in sync with mustody-project-doc `src/lib/navigation.ts`. */
export const DOC_PATHS = {
  intro: "/docs/getting-started/introduction",
  quickstart: "/docs/getting-started/quickstart",
  authentication: "/docs/getting-started/authentication",
  wallets: "/docs/concepts/wallets",
  transfers: "/docs/concepts/transfers",
  contracts: "/docs/concepts/contracts",
  chains: "/docs/concepts/chains-and-coins",
  createWallet: "/docs/api/wallets/create",
  walletBalance: "/docs/api/wallets/balance",
  transfer: "/docs/api/transfers/transfer",
  deployContract: "/docs/api/contracts/deploy",
  createWalletGuide: "/docs/guides/create-wallet",
} as const;

function docsOrigin(): string {
  return (import.meta.env.VITE_DOCS_URL || "http://localhost:3001").replace(
    /\/+$/,
    "",
  );
}

function docsBasePath(): string {
  const base = import.meta.env.VITE_DOCS_BASE_PATH || "";
  if (!base) return "";
  return base.startsWith("/") ? base.replace(/\/+$/, "") : `/${base.replace(/\/+$/, "")}`;
}

/** Build absolute or same-origin URL to the docs site. */
export function docsUrl(path: string = DOC_PATHS.intro): string {
  const docPath = path.startsWith("/") ? path : `/${path}`;
  const basePath = docsBasePath();
  const fullPath = `${basePath}${docPath}`.replace(/\/{2,}/g, "/");

  if (import.meta.env.VITE_DOCS_SAME_ORIGIN === "true") {
    return fullPath.startsWith("/") ? fullPath : `/${fullPath}`;
  }

  return `${docsOrigin()}${fullPath}`;
}

export function isDocsSameOrigin(): boolean {
  return import.meta.env.VITE_DOCS_SAME_ORIGIN === "true";
}

/** Props for external doc links (new tab) vs same-origin (same tab). */
export function docsLinkProps(): {
  target?: string;
  rel?: string;
} {
  if (isDocsSameOrigin()) {
    return {};
  }
  return { target: "_blank", rel: "noopener noreferrer" };
}
