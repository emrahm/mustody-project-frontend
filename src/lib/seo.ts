export const SITE_NAME = "Mustody";
export const SITE_TAGLINE = "Miracle Custody";

const DEFAULT_SITE_URL = "https://mustody.com";

/** Public site origin — set VITE_SITE_URL in production (e.g. https://mustody.com). */
export function getSiteUrl(): string {
  return (import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
}

export const DEFAULT_TITLE =
  "Mustody | Blockchain-as-a-Service & MPC Custody Platform";

export const DEFAULT_DESCRIPTION =
  "Mustody is a Blockchain-as-a-Service (BaaS) platform with MPC custody infrastructure. Wallets, tokens, and transactions via REST API — no nodes, RPC providers, or private key management. Miracle Custody.";

export const DEFAULT_KEYWORDS = [
  "blockchain as a service",
  "BaaS platform",
  "MPC custody",
  "MPC wallet API",
  "crypto custody infrastructure",
  "multi-chain wallet API",
  "digital asset custody",
  "REST blockchain API",
  "Mustody",
  "Miracle Custody",
].join(", ");

export type PageSeo = {
  title?: string;
  description?: string;
  /** Path for canonical URL, e.g. `/login`. Defaults to current path. */
  path?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

function homepageJsonLd(siteUrl: string): Record<string, unknown>[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: siteUrl,
      slogan: SITE_TAGLINE,
      description: DEFAULT_DESCRIPTION,
      logo: `${siteUrl}/favicon.svg`,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: siteUrl,
      description: DEFAULT_DESCRIPTION,
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Blockchain-as-a-Service (BaaS) with MPC custody — wallets, token lifecycle, and transaction signing via REST API.",
      offers: {
        "@type": "Offer",
        category: "SaaS",
      },
    },
  ];
}

export const ROUTE_SEO: Record<string, PageSeo> = {
  "/": {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    jsonLd: homepageJsonLd(DEFAULT_SITE_URL),
  },
  "/landing": {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    path: "/",
  },
  "/login": {
    title: `Log In | ${SITE_NAME}`,
    description: `Sign in to the ${SITE_NAME} BaaS custody platform.`,
    noindex: true,
  },
  "/register": {
    title: `Sign Up | ${SITE_NAME}`,
    description: `Create a ${SITE_NAME} account — Blockchain-as-a-Service with MPC custody infrastructure.`,
    noindex: true,
  },
  "/about": {
    title: `About ${SITE_NAME} | ${SITE_TAGLINE}`,
    description: `${SITE_NAME} (${SITE_TAGLINE}) — enterprise Blockchain-as-a-Service and MPC digital asset custody.`,
  },
};

export function resolvePageSeo(pathname: string): PageSeo {
  const base = ROUTE_SEO[pathname] ?? {
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: DEFAULT_DESCRIPTION,
    noindex: true,
  };

  if (base.jsonLd && pathname === "/") {
    const siteUrl = getSiteUrl();
    return { ...base, jsonLd: homepageJsonLd(siteUrl) };
  }

  return base;
}
