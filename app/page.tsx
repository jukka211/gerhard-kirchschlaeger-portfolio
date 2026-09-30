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

  const toSlides = (slides: HomePageData["desktopSlides"]) =>
    (slides ?? [])
      .filter((slide) => slide.asset?.url)
      .map((slide) => ({
        key: slide._key,
        url: `${slide.asset!.url!}?w=2400&q=75&auto=format`,
        alt: slide.alt || "",
      }));

  const desktopSlides = toSlides(data?.desktopSlides);
  const mobileSlides = toSlides(data?.mobileSlides);

  return (
    <main className="home-page">
      <HomeSlideshow slides={desktopSlides} variant="desktop" />
      <HomeSlideshow
        slides={mobileSlides.length > 0 ? mobileSlides : desktopSlides}
        variant="mobile"
      />
    </main>
  );
}