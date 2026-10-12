import "./fonts.css";

import { sanityFetch } from "@/sanity/lib/live";
import { fontsPageQuery } from "@/sanity/lib/queries";
import type { FontsPageData } from "@/types/sanity";
import HomeSlideshow from "../HomeSlideshow";
import FontsInfoPanel from "./FontsInfoPanel";

export default async function FontsPage() {
  const { data } = (await sanityFetch({
    query: fontsPageQuery,
  })) as { data: FontsPageData | null };

  const page = data ?? {
    navLinks: [],
    introText: "",
    desktopSlides: [],
    mobileSlides: [],
  };

  const toSlides = (slides: FontsPageData["desktopSlides"]) =>
    (slides ?? [])
      .filter((slide) => slide.asset?.url)
      .map((slide) => ({
        key: slide._key,
        url: `${slide.asset!.url!}?w=2400&q=75&auto=format`,
        alt: slide.alt || "",
      }));

  const desktopSlides = toSlides(page.desktopSlides);
  const mobileSlides = toSlides(page.mobileSlides);

  return (
    <main className="fonts-page">
      <header className="fonts-header">
        <nav className="fonts-nav" aria-label="Fonts navigation">
          {page.navLinks?.map((link) =>
            link.url ? (
              <a key={link._key} href={link.url}>
                {link.label}
              </a>
            ) : (
              <span key={link._key}>{link.label}</span>
            ),
          )}
        </nav>
      </header>

      <HomeSlideshow slides={desktopSlides} variant="desktop" />
      <HomeSlideshow
        slides={mobileSlides.length > 0 ? mobileSlides : desktopSlides}
        variant="mobile"
      />

      <FontsInfoPanel introText={page.introText ?? ""} />
    </main>
  );
}
