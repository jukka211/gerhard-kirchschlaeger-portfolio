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

  // The desktop slides on phones too, in their original format, as on the home page.
  const slides = (page.desktopSlides ?? [])
    .filter((slide) => slide.asset?.url)
    .map((slide) => ({
      key: slide._key,
      url: `${slide.asset!.url!}?w=2400&q=75&auto=format`,
      alt: slide.alt || "",
    }));

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

      <HomeSlideshow slides={slides} />

      <FontsInfoPanel introText={page.introText ?? ""} />
    </main>
  );
}
