import HomePage from "../components/HomePage";
import { client } from "@/sanity/lib/client";
import { homePageQuery } from "@/sanity/lib/queries";
import type { HomePageData } from "@/types/sanity";

export default async function Page() {
  const data = await client.fetch<HomePageData>(
    homePageQuery,
    {},
    {
      cache: "no-store",
      useCdn: false,
    }
  );

  return <HomePage items={data?.galleryItems ?? []} />;
}