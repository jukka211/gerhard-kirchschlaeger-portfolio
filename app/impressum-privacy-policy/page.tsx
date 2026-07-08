"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { useSiteMenu } from "@/components/SiteMenuContext";

const LEGAL_MODES = [
  "default",
  "focus",
  "fontsize",
  "converge",
  "wave",
  "cascade",
  "lineheight",
  "columns",
  "marquee",
] as const;

type LegalMode = (typeof LEGAL_MODES)[number];

type RowTag = "h1" | "h2" | "p";

type RowItem = {
  tag: RowTag;
  id?: string;
  content: ReactNode;
};

const ROWS: RowItem[] = [
  { tag: "h1", content: "Impressum" },
  { tag: "p", content: "Angaben gemäß § 5 ECG und § 24 Mediengesetz" },
  { tag: "p", content: "Gerhard Kirchschläger, Bahnhofplatz 1, 4600 Wels, Österreich" },
  { tag: "p", content: "Telefon: +43 676 3140568, E-Mail: gerhard@kirchschlaeger.at" },
  { tag: "h2", content: "Unternehmensgegenstand" },
  { tag: "p", content: "Grafik-Design" },
  { tag: "h2", content: "UID-Nummer" },
  { tag: "p", content: "ATU49887500" },
  { tag: "h2", content: "Kammer / Berufsrecht" },
  { tag: "p", content: "Mitglied der Wirtschaftskammer Österreich (WKÖ)" },
  { tag: "p", content: "Gewerbe: Grafik-Design" },
  { tag: "p", content: "Gewerbeordnung: abrufbar unter https://www.ris.bka.gv.at" },
  { tag: "p", content: "Zuständige Aufsichtsbehörde: Bezirkshauptmannschaft Wels" },
  { tag: "p", content: "Gerichtsstand Wels" },
  { tag: "h2", content: "Anwendbare Rechtsvorschriften" },
  { tag: "p", content: "Gewerbeordnung (GewO), abrufbar unter https://www.ris.bka.gv.at" },
  { tag: "h2", content: "Haftung für Inhalte" },
  {
    tag: "p",
    content:
      "Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte wird jedoch keine Gewähr übernommen.",
  },
  { tag: "h2", content: "Haftung für Links" },
  {
    tag: "p",
    content:
      "Diese Website enthält Links zu externen Websites Dritter, auf deren Inhalte kein Einfluss besteht. Für diese fremden Inhalte wird keine Haftung übernommen.",
  },
  { tag: "h2", content: "Urheberrecht" },
  {
    tag: "p",
    content:
      "Die Inhalte und Werke auf dieser Website unterliegen dem Urheberrecht. Jede Art der Vervielfältigung, Bearbeitung, Verbreitung und Verwertung außerhalb der Grenzen des Urheberrechts bedarf der vorherigen schriftlichen Zustimmung.",
  },
  { tag: "h2", content: "AGB" },
  {
    tag: "p",
    content: "Es gelten die Allgemeinen Geschäftsbedingungen (AGB) in ihrer jeweils gültigen Fassung.",
  },
  { tag: "h2", content: "Typografie" },
  { tag: "p", content: "OO Arketa https://www.outline-online.com/product/arketa" },
  { tag: "h1", id: "imprint-en", content: "Imprint" },
  { tag: "p", content: "Information pursuant to § 5 ECG and § 24 Media Act (Austria)" },
  { tag: "p", content: "Gerhard Kirchschläger, Bahnhofplatz 1, 4600 Wels, Austria" },
  { tag: "p", content: "Phone: +43 676 3140568, Email: gerhard@kirchschlaeger.at" },
  { tag: "h2", content: "Business Purpose" },
  { tag: "p", content: "Graphic Design" },
  { tag: "h2", content: "VAT №" },
  { tag: "p", content: "ATU49887500" },
  { tag: "h2", content: "Chamber / Professional Regulations" },
  {
    tag: "p",
    content: "Member of the Wirtschaftskammer Österreich (Austrian Federal Economic Chamber—WKÖ)",
  },
  { tag: "p", content: "Trade: Graphic Design" },
  {
    tag: "p",
    content:
      "Applicable legislation: Austrian Trade Regulation Act (Gewerbeordnung), available at https://www.ris.bka.gv.at",
  },
  { tag: "p", content: "Supervisory authority: District Authority of Wels" },
  { tag: "p", content: "Place of Jurisdiction: Wels, Austria" },
  { tag: "h2", content: "Liability for Content" },
  {
    tag: "p",
    content:
      "The contents of this website have been created with the greatest possible care. However, no guarantee is given for the accuracy, completeness or timeliness of the content.",
  },
  { tag: "h2", content: "Liability for Links" },
  {
    tag: "p",
    content:
      "This website contains links to external third-party websites over whose content we have no control. Therefore, we cannot assume any liability for these external contents.",
  },
  { tag: "h2", content: "Copyright" },
  {
    tag: "p",
    content:
      "The content and works on this website are subject to copyright law. Any duplication, processing, distribution or any form of commercialization beyond the scope of copyright law requires prior written consent.",
  },
  { tag: "h2", content: "Terms and Conditions" },
  { tag: "p", content: "The applicable Terms and Conditions (AGB) apply in their current version." },
  { tag: "p", content: "This website is operated from Austria and subject to Austrian law." },
  { tag: "h2", content: "Typography" },
  { tag: "p", content: "OO Arketa https://www.outline-online.com/product/arketa" },
  { tag: "h1", content: "Datenschutzerklärung" },
  { tag: "h2", content: "1. Verantwortlicher" },
  { tag: "p", content: "Verantwortlich für die Datenverarbeitung auf dieser Website ist:" },
  {
    tag: "p",
    content:
      "Gerhard Kirchschlaeger, Bahnhofplatz 1, 4600 Wels, Österreich, gerhard@kirchschlaeger.at, +43 676 3140568",
  },
  { tag: "h2", content: "2. Allgemeine Hinweise zur Datenverarbeitung" },
  { tag: "p", content: "Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen." },
  {
    tag: "p",
    content: "Wir verarbeiten Ihre Daten ausschließlich auf Grundlage der gesetzlichen Bestimmungen (DSGVO, TKG).",
  },
  {
    tag: "p",
    content:
      "Diese Website dient als Portfolio und informiert über gestalterische Arbeiten. Eine aktive Datenerhebung (z. B. durch Formulare oder Tracking) findet nicht statt.",
  },
  { tag: "h2", content: "3. Hosting und Content Management" },
  {
    tag: "p",
    content: "Diese Website wird über den Dienst Vercel bereitgestellt. Inhalte werden über das Headless CMS Sanity verwaltet.",
  },
  {
    tag: "p",
    content: "Beim Aufruf der Website werden durch den Hosting-Provider automatisch Informationen erfasst (Server-Logfiles), insbesondere:",
  },
  {
    tag: "p",
    content: "IP-Adresse, Datum und Uhrzeit der Anfrage, Browsertyp und -version, Betriebssystem, Referrer-URL",
  },
  {
    tag: "p",
    content:
      "Diese Daten sind technisch erforderlich, um die Website bereitzustellen und die Stabilität und Sicherheit zu gewährleisten.",
  },
  {
    tag: "p",
    content: "Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).",
  },
  {
    tag: "p",
    content:
      "Hinweis: Die Verarbeitung kann auf Servern in den USA erfolgen. Es besteht das Risiko, dass US-Behörden auf diese Daten zugreifen können.",
  },
  { tag: "h2", content: "4. Keine Verwendung von Cookies" },
  { tag: "p", content: "Diese Website verwendet keine Cookies, die einer Zustimmung bedürfen." },
  { tag: "p", content: "Es werden keine Tracking- oder Analyse-Tools eingesetzt." },
  { tag: "h2", content: "5. Keine Webanalyse / kein Tracking" },
  { tag: "p", content: "Es werden keine Dienste wie Google Analytics oder vergleichbare Tools verwendet." },
  { tag: "p", content: "Es erfolgt keine Auswertung des Nutzerverhaltens." },
  { tag: "h2", content: "6. Kontaktaufnahme" },
  { tag: "p", content: "Eine Kontaktaufnahme ist über die bereitgestellte E-Mail-Adresse oder telefonisch möglich." },
  {
    tag: "p",
    content:
      "Wenn Sie per E-Mail Kontakt aufnehmen, werden Ihre angegebenen Daten (z. B. Name, E-Mail-Adresse, Inhalt der Anfrage) zwecks Bearbeitung der Anfrage verarbeitet.",
  },
  { tag: "p", content: "Diese Daten werden nicht ohne Ihre Einwilligung weitergegeben." },
  { tag: "h2", content: "7. Externe Links" },
  { tag: "p", content: "Diese Website enthält Links zu externen Plattformen, insbesondere zu Instagram." },
  {
    tag: "p",
    content:
      "Beim Anklicken eines solchen Links verlassen Sie diese Website. Für die Datenverarbeitung auf externen Plattformen sind ausschließlich deren Betreiber verantwortlich.",
  },
  { tag: "h2", content: "8. Ihre Rechte" },
  { tag: "p", content: "Sie haben jederzeit das Recht auf:" },
  {
    tag: "p",
    content:
      "Auskunft über Ihre gespeicherten Daten, Berichtigung unrichtiger Daten, Löschung Ihrer Daten, Einschränkung der Verarbeitung, Datenübertragbarkeit, Widerspruch gegen die Verarbeitung",
  },
  {
    tag: "p",
    content:
      "Wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer Daten gegen das Datenschutzrecht verstößt, können Sie sich bei der Aufsichtsbehörde beschweren.",
  },
  { tag: "p", content: "In Österreich ist dies die:" },
  { tag: "p", content: "Datenschutzbehörde, Barichgasse 40–42, 1030 Wien" },
  { tag: "h2", content: "9. Datensicherheit" },
  {
    tag: "p",
    content: "Wir setzen technische und organisatorische Maßnahmen ein, um Ihre Daten bestmöglich zu schützen.",
  },
  { tag: "h2", content: "10. Änderungen dieser Datenschutzerklärung" },
  {
    tag: "p",
    content:
      "Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen, damit sie stets den aktuellen rechtlichen Anforderungen entspricht.",
  },
  { tag: "h1", id: "privacy-policy", content: "Privacy Policy" },
  { tag: "h2", content: "1. Controller" },
  { tag: "p", content: "The controller responsible for data processing on this website is:" },
  {
    tag: "p",
    content: "Gerhard Kirchschlaeger, Bahnhofplatz 1, 4600 Wels, Austria, gerhard@kirchschlaeger.at, +43 676 3140568",
  },
  { tag: "h2", content: "2. General Information" },
  { tag: "p", content: "The protection of your personal data is important to us." },
  {
    tag: "p",
    content: "We process your data exclusively in accordance with applicable legal regulations (GDPR, TKG).",
  },
  {
    tag: "p",
    content:
      "This website serves as a portfolio presenting design work. No active data collection (e.g. via forms or tracking tools) takes place.",
  },
  { tag: "h2", content: "3. Hosting and Content Management" },
  { tag: "p", content: "This website is hosted by Vercel. Content is managed using the headless CMS Sanity." },
  {
    tag: "p",
    content: "When accessing the website, the hosting provider automatically collects certain information (server log files), including:",
  },
  {
    tag: "p",
    content: "IP address, date and time of access, browser type and version, operating system, referrer URL",
  },
  {
    tag: "p",
    content: "These data are technically necessary to deliver the website and ensure its stability and security.",
  },
  { tag: "p", content: "Processing is based on Art. 6 (1) (f) GDPR (legitimate interest)." },
  {
    tag: "p",
    content:
      "Note: Data may be processed on servers located in the United States. There is a potential risk that U.S. authorities may access such data.",
  },
  { tag: "h2", content: "4. No Use of Cookies" },
  { tag: "p", content: "This website does not use cookies that require user consent." },
  { tag: "p", content: "No tracking or analytics technologies are in use." },
  { tag: "h2", content: "5. No Analytics / Tracking" },
  { tag: "p", content: "No analytics services (such as Google Analytics or similar tools) are used." },
  { tag: "p", content: "User behavior is not analyzed." },
  { tag: "h2", content: "6. Contact" },
  { tag: "p", content: "You can contact us via email or phone." },
  {
    tag: "p",
    content:
      "If you contact us by email, the data you provide (e.g. name, email address, message content) will be processed for the purpose of handling your request.",
  },
  { tag: "p", content: "Your data will not be shared without your consent." },
  { tag: "h2", content: "7. External Links" },
  { tag: "p", content: "This website contains links to external platforms, in particular Instagram." },
  {
    tag: "p",
    content:
      "When clicking such links, you leave this website. The respective provider is solely responsible for data processing on their platform.",
  },
  { tag: "h2", content: "8. Your Rights" },
  { tag: "p", content: "You have the right to:" },
  {
    tag: "p",
    content:
      "access your stored data, request correction of inaccurate data, request deletion of your data, restrict processing, data portability, object to processing",
  },
  {
    tag: "p",
    content:
      "If you believe that the processing of your data violates data protection law, you have the right to lodge a complaint with a supervisory authority.",
  },
  { tag: "p", content: "In Austria, this is:" },
  { tag: "p", content: "Austrian Data Protection Authority, Barichgasse 40–42, 1030 Vienna" },
  { tag: "h2", content: "9. Data Security" },
  {
    tag: "p",
    content: "We implement appropriate technical and organizational measures to protect your data.",
  },
  { tag: "h2", content: "10. Changes to this Privacy Policy" },
  {
    tag: "p",
    content:
      "We reserve the right to adapt this privacy policy if necessary to ensure it always complies with current legal requirements.",
  },
];

function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export default function ImpressumPrivacyPolicyPage() {
  const [modeIndex, setModeIndex] = useState(0);
  const mode: LegalMode = LEGAL_MODES[modeIndex];
  const textRef = useRef<HTMLElement>(null);
  const rowRefs = useRef<(HTMLElement | null)[]>([]);
  const { setPageAction } = useSiteMenu();

  const cycleMode = useCallback(() => {
    setModeIndex((index) => (index + 1) % LEGAL_MODES.length);
  }, []);

  useEffect(() => {
    setPageAction(cycleMode);
    return () => setPageAction(null);
  }, [cycleMode, setPageAction]);

  useEffect(() => {
    rowRefs.current.forEach((row) => {
      if (!row) return;
      const rotdir = (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.9);
      row.style.setProperty("--rotdir", rotdir.toFixed(2));
    });
  }, []);

  useEffect(() => {
    const text = textRef.current;
    if (!text) return;

    function handlePointerMove(event: PointerEvent) {
      if (!text) return;
      const rect = text.getBoundingClientRect();
      const mx = clamp01((event.clientX - rect.left) / rect.width);
      const my = clamp01((event.clientY - rect.top) / rect.height);
      text.style.setProperty("--mx", mx.toFixed(3));
      text.style.setProperty("--my", my.toFixed(3));

      const el = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      const row = el?.closest<HTMLElement>("[data-row-index]");
      if (row?.dataset.rowIndex) {
        text.style.setProperty("--focus", row.dataset.rowIndex);
      }
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.back} aria-label="Back to homepage">

      </Link>

      <main
        id="imprint"
        ref={textRef}
        className={`${styles.text} mode-${mode}`}
      >
        {ROWS.map((row, index) => {
          const Tag = row.tag;
          return (
            <Tag
              key={index}
              id={row.id}
              ref={(el: HTMLElement | null) => {
                rowRefs.current[index] = el;
              }}
              className={styles.legalRow}
              data-row-index={index}
              style={{ "--i": index } as CSSProperties}
            >
              {row.content}
            </Tag>
          );
        })}
      </main>
    </div>
  );
}
