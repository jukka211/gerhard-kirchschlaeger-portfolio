import "./about.css";

import { sanityFetch } from "@/sanity/lib/live";
import { aboutPageQuery } from "@/sanity/lib/queries";
import { aboutRowsDefault } from "@/sanity/lib/aboutRowsDefault";
import type { AboutPageData } from "@/types/sanity";
import AboutClient, { type Row } from "./AboutClient";
import { CONTACT } from "./contactRows";

export default async function AboutPage() {
  const { data } = (await sanityFetch({
    query: aboutPageQuery,
  })) as { data: AboutPageData | null };

  const rows =
    data?.rows ??
    aboutRowsDefault.map((row, index) => ({ _key: `fallback-${index}`, ...row }));

  // Under the rows from Sanity, after a blank line (a row holding just a
  // <br>): the contact details.
  return (
    <AboutClient
      rows={[
        ...rows.map((row): Row => ({ key: row._key, content: row.text, href: row.href })),
        { key: "contact-break", content: <br /> },
        CONTACT.instagram,
        CONTACT.phone,
        CONTACT.email,
        CONTACT.address,
      ]}
    />
  );
}
