import HomePage from "@/components/HomePage";
import { sanityFetch } from "@/sanity/lib/live";
import { homePageQuery } from "@/sanity/lib/queries";
import type { GalleryItem } from "@/types/sanity";

type HomePageData = {
  title?: string;
  galleryItems?: GalleryItem[];
} | null;

export default async function PortfolioPage() {
  const { data } = (await sanityFetch({
    query: homePageQuery,
  })) as { data: HomePageData };

  return <HomePage items={data?.galleryItems ?? []} />;
}