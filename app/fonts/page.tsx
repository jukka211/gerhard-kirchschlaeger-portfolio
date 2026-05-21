import "./fonts.css";

import { sanityFetch } from "@/sanity/lib/live";
import { fontsPageQuery } from "@/sanity/lib/queries";
import type { FontImageItem, FontsPageData } from "@/types/sanity";

function clampVh(value?: number) {
  if (typeof value !== "number") return 0;
  return Math.min(Math.max(value, 0), 100);
}

function FontImage({ item }: { item: FontImageItem }) {
  if (!item.image?.asset?.url) return null;

  const marginTop = clampVh(item.marginTopVh);
  const marginBottom = clampVh(item.marginBottomVh);

  return (
    <figure
      className={`font-image font-image--${item.size || "medium"}`}
      style={{
        marginTop: `${marginTop}vh`,
        marginBottom: `${marginBottom}vh`,
      }}
    >
      <img src={item.image.asset.url} alt={item.image.alt || ""} />
    </figure>
  );
}

export default async function FontsPage() {
  const { data } = (await sanityFetch({
    query: fontsPageQuery,
  })) as { data: FontsPageData | null };

  const page = data ?? {
    navLinks: [],
    introTitle: "■ Info >",
    introText: "",
    columns: {
      left: [],
      middle: [],
      right: [],
    },
  };

  const leftImages = page.columns?.left ?? [];
  const middleImages = page.columns?.middle ?? [];
  const rightImages = page.columns?.right ?? [];

  return (
    <main className="fonts-page">
      <section className="fonts-column fonts-column--left">
        <nav className="fonts-nav" aria-label="Fonts navigation">
          {page.navLinks?.map((link) => {
            if (link.url) {
              return (
                <a
                  key={link._key}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  □ {link.label}
                </a>
              );
            }

            return <span key={link._key}>□ {link.label}</span>;
          })}
        </nav>

        <details className="fonts-info">
          <summary>{page.introTitle || "■ Info &gt;"}</summary>

          {page.introText && (
            <div>
              {page.introText.split("\n").map((line, index) => (
                <p key={`${line}-${index}`}>{line}</p>
              ))}
            </div>
          )}
        </details>

        <div className="fonts-images">
          {leftImages.map((item) => (
            <FontImage key={item._key} item={item} />
          ))}
        </div>
      </section>

      <section className="fonts-column">
        <div className="fonts-images">
          {middleImages.map((item) => (
            <FontImage key={item._key} item={item} />
          ))}
        </div>
      </section>

      <section className="fonts-column">
        <div className="fonts-images">
          {rightImages.map((item) => (
            <FontImage key={item._key} item={item} />
          ))}
        </div>
      </section>
    </main>
  );
}