import HorizontalGallery from "@/components/HorizontalGallery";
import {client} from "@/sanity/lib/client";
import {homePageQuery} from "@/sanity/lib/queries";
import type {HomePageData} from "@/types/sanity";

export default async function HomePage() {
  const data = await client.fetch<HomePageData>(homePageQuery, {}, {
    // Fetch fresh Sanity content in production instead of serving a build-time snapshot.
    cache: "no-store",
    useCdn: false,
  });

  return <HorizontalGallery items={data?.galleryItems ?? []} />;
}
