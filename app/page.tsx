import Link from "next/link";

import { sanityFetch } from "@/sanity/lib/live";
import { homePageQuery } from "@/sanity/lib/queries";
import type { HomePageData } from "@/types/sanity";
import HomeSlideshow from "./HomeSlideshow";

const useInternalLinks =
  process.env.NODE_ENV === "development" ||
  process.env.VERCEL_ENV === "preview";

export default async function HomePage() {
  const { data } = (await sanityFetch({
    query: homePageQuery,
  })) as { data: HomePageData | null };

  const slides = (data?.backgroundSlides ?? [])
    .filter((slide) => slide.asset?.url)
    .map((slide) => ({
      key: slide._key,
      url: slide.asset!.url!,
      alt: slide.alt || "",
    }));

  return (
    <main className="home-page">
      <HomeSlideshow slides={slides} />

      <nav className="home-nav" aria-label="Main navigation">


        <div className="home-main-links">
          <Link href="/about" className="home-link home-link--about">
          about
          </Link>

          <Link href="/portfolio" className="home-link home-link--portfolio">
          portfolio
</Link>

          <Link href="/play" className="home-link home-link--play">
          play
          </Link>

          <Link href="/fonts" className="home-link home-link--fonts">
          fonts
</Link>
        </div>

        <div className="home-contact-row">
          <a
            href="https://www.google.com/maps/place/Bahnhofplatz+1,+4600+Wels,+Austria"
            target="_blank"
            rel="noreferrer"
          >
            address
          </a>

          <a href="mailto:gerhard@kirchschlaeger.at">mail</a>

          <a href="tel:+436763140568">phone</a>
          <a
            href="https://instagram.com/gerhard.kirchschlaeger"
            target="_blank"
            rel="noreferrer"
          >
            inst.
          </a>
        </div>

        <div className="home-secondary-links">
      

          <Link href="/impressum-privacy-policy#imprint">legal</Link>


        </div>
      </nav>
    </main>
  );
}