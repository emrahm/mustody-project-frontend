import { useEffect } from "react";
import { useLocation } from "wouter";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_TAGLINE,
  getSiteUrl,
  resolvePageSeo,
} from "@/lib/seo";

const JSON_LD_ID = "mustody-seo-jsonld";

function upsertMeta(
  key: string,
  content: string,
  attr: "name" | "property" = "name",
) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(data: Record<string, unknown> | Record<string, unknown>[] | undefined) {
  const existing = document.getElementById(JSON_LD_ID);
  if (existing) existing.remove();
  if (!data) return;

  const script = document.createElement("script");
  script.id = JSON_LD_ID;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

/** Updates document title, meta, canonical, Open Graph, Twitter, and JSON-LD per route. */
export function SeoHead() {
  const [location] = useLocation();

  useEffect(() => {
    const seo = resolvePageSeo(location);
    const siteUrl = getSiteUrl();
    const path = seo.path ?? location;
    const canonical = `${siteUrl}${path === "/" ? "" : path}`;
    const title = seo.title ?? DEFAULT_TITLE;
    const description = seo.description ?? DEFAULT_DESCRIPTION;
    const robots = seo.noindex ? "noindex, nofollow" : "index, follow";
    const ogImage = `${siteUrl}/favicon.svg`;

    document.title = title;

    upsertMeta("description", description);
    upsertMeta("keywords", DEFAULT_KEYWORDS);
    upsertMeta("robots", robots);
    upsertMeta("author", SITE_NAME);
    upsertMeta("application-name", SITE_NAME);
    upsertMeta("theme-color", "#0ea5e9");

    upsertLink("canonical", canonical);

    upsertMeta("og:type", "website", "property");
    upsertMeta("og:site_name", SITE_NAME, "property");
    upsertMeta("og:title", title, "property");
    upsertMeta("og:description", description, "property");
    upsertMeta("og:url", canonical, "property");
    upsertMeta("og:image", ogImage, "property");
    upsertMeta("og:locale", "en_US", "property");

    upsertMeta("twitter:card", "summary_large_image");
    upsertMeta("twitter:title", title);
    upsertMeta("twitter:description", description);
    upsertMeta("twitter:image", ogImage);

    // Brand tagline — not a standard meta; useful for some crawlers / previews
    upsertMeta("mustody:tagline", SITE_TAGLINE);

    setJsonLd(seo.jsonLd);
  }, [location]);

  return null;
}
