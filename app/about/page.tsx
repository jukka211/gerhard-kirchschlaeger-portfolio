import "./about.css";

import { sanityFetch } from "@/sanity/lib/live";
import { aboutPageQuery } from "@/sanity/lib/queries";
import { aboutRowsDefault } from "@/sanity/lib/aboutRowsDefault";
import type { AboutPageData } from "@/types/sanity";
import AboutClient from "./AboutClient";

export default async function AboutPage() {
  const { data } = (await sanityFetch({
    query: aboutPageQuery,
  })) as { data: AboutPageData | null };

  const rows =
    data?.rows ??
    aboutRowsDefault.map((row, index) => ({ _key: `fallback-${index}`, ...row }));

  return <AboutClient rows={rows} />;
}
