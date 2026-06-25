"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSiteMenu } from "@/components/SiteMenuContext";

export default function SiteMenu() {
  const { open, setOpen } = useSiteMenu();
  const pathname = usePathname();
  const isFontsPage = pathname?.startsWith("/fonts");

  return (
    <div className="site-menu">
      <div
        className={`site-menu-panel ${open ? "is-open" : ""}`.trim()}
        aria-hidden={!open}
      >
        <div className="site-menu-panel-inner">
          <div className="site-menu-links">
          <Link href="/#" onClick={() => setOpen(false)}>gerhrad   kirchschläger</Link>
            <Link href="/about" onClick={() => setOpen(false)}>about</Link>
            <Link href="/portfolio" onClick={() => setOpen(false)}>portfolio</Link>
            <Link href="/play" onClick={() => setOpen(false)}>play</Link>
            <Link href="/fonts" onClick={() => setOpen(false)}>fonts</Link>
          </div>

          <div className="site-menu-links site-menu-links--contact">
            <a
              href="https://www.google.com/maps/place/Bahnhofplatz+1,+4600+Wels,+Austria"
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
            >
              address
            </a>
            <a href="mailto:gerhard@kirchschlaeger.at" onClick={() => setOpen(false)}>mail</a>
            <a href="tel:+436763140568" onClick={() => setOpen(false)}>phone</a>
            <a
              href="https://instagram.com/gerhard.kirchschlaeger"
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
            >
              inst.
            </a>
          </div>

          <div className="site-menu-links">
            <Link href="/impressum-privacy-policy#imprint" onClick={() => setOpen(false)}>legal</Link>
          </div>
        </div>
      </div>

      <button
        type="button"
        className={`site-menu-button ${open ? "is-open" : ""} ${isFontsPage ? "is-inverted" : ""}`.trim()}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <img src="/menu.svg" alt="" />
      </button>
    </div>
  );
}
