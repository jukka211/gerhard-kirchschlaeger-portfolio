import "./fonts.css";

import { sanityFetch } from "@/sanity/lib/live";
import { fontsPageQuery } from "@/sanity/lib/queries";
import type { FontImageItem, FontsPageData } from "@/types/sanity";
import DraggableImage from "./DraggableImage";

const SIZE_WIDTH_PERCENT: Record<string, number> = {
  small: 16,
  medium: 26,
  large: 38,
};

function randomPosition(widthPercent: number) {
  const left = Math.random() * (100 - widthPercent - 4) + 2;
  const top = Math.random() * (100 - widthPercent * 0.6 - 8) + 4;
  return { top, left };
}

function FontImage({ item }: { item: FontImageItem }) {
  if (!item.image?.asset?.url) return null;

  const widthPercent = SIZE_WIDTH_PERCENT[item.size || "medium"];
  const { top, left } = randomPosition(widthPercent);

  return (
    <DraggableImage
      className="font-image"
      style={{
        position: "absolute",
        top: `${top}%`,
        left: `${left}%`,
        width: `${widthPercent}%`,
      }}
      src={item.image.asset.url}
      alt={item.image.alt || ""}
    />
  );
}

export default async function FontsPage() {
  const { data } = (await sanityFetch({
    query: fontsPageQuery,
  })) as { data: FontsPageData | null };

  const page = data ?? {
    navLinks: [],
    introText: "",
    images: [],
  };

  const images = page.images ?? [];

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

        {page.introText && (
          <div className="fonts-info">
            {page.introText.split("\n").map((line, index) => (
              <p key={`${line}-${index}`}>{line}</p>
            ))}
          </div>
        )}
      </header>

      <div className="fonts-canvas">
        {images.map((item) => (
          <FontImage key={item._key} item={item} />
        ))}
      </div>
    </main>
  );
}
