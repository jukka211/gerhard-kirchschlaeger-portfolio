import Link from "next/link";
import styles from "./page.module.css";

export default function ImpressumPrivacyPolicyPage() {
  return (
    <div className={styles.page}>
      <Link href="/" className={styles.back} aria-label="Back to homepage">
        (x)
      </Link>

      <main id="imprint" className={styles.text}>
        <h1>Datenschutzerklärung</h1>

        <h2>1. Verantwortlicher</h2>
        <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
        <p>
          Gerhard Kirchschlaeger, Bahnhofplatz 1, 4600 Wels, Österreich,
          gerhard@kirchschlaeger.at, +43 676 3140568
        </p>

        <h2>2. Allgemeine Hinweise zur Datenverarbeitung</h2>
        <p>Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen.</p>
        <p>
          Wir verarbeiten Ihre Daten ausschließlich auf Grundlage der
          gesetzlichen Bestimmungen (DSGVO, TKG).
        </p>
        <p>
          Diese Website dient als Portfolio und informiert über gestalterische
          Arbeiten. Eine aktive Datenerhebung (z. B. durch Formulare oder
          Tracking) findet nicht statt.
        </p>

        <h2>3. Hosting und Content Management</h2>
        <p>
          Diese Website wird über den Dienst Vercel bereitgestellt. Inhalte
          werden über das Headless CMS Sanity verwaltet.
        </p>
        <p>
          Beim Aufruf der Website werden durch den Hosting-Provider automatisch
          Informationen erfasst (Server-Logfiles), insbesondere:
        </p>
        <p>
          IP-Adresse, Datum und Uhrzeit der Anfrage, Browsertyp und -version,
          Betriebssystem, Referrer-URL
        </p>

        <p>
          Diese Daten sind technisch erforderlich, um die Website
          bereitzustellen und die Stabilität und Sicherheit zu gewährleisten.
        </p>
        <p>
          Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO
          (berechtigtes Interesse).
        </p>
        <p>
          Hinweis: Die Verarbeitung kann auf Servern in den USA erfolgen. Es
          besteht das Risiko, dass US-Behörden auf diese Daten zugreifen können.
        </p>

        <h2>4. Keine Verwendung von Cookies</h2>
        <p>Diese Website verwendet keine Cookies, die einer Zustimmung bedürfen.</p>
        <p>Es werden keine Tracking- oder Analyse-Tools eingesetzt.</p>

        <h2>5. Keine Webanalyse / kein Tracking</h2>
        <p>
          Es werden keine Dienste wie Google Analytics oder vergleichbare Tools
          verwendet.
        </p>
        <p>Es erfolgt keine Auswertung des Nutzerverhaltens.</p>

        <h2>6. Kontaktaufnahme</h2>
        <p>
          Eine Kontaktaufnahme ist über die bereitgestellte E-Mail-Adresse oder
          telefonisch möglich.
        </p>
        <p>
          Wenn Sie per E-Mail Kontakt aufnehmen, werden Ihre angegebenen Daten
          (z. B. Name, E-Mail-Adresse, Inhalt der Anfrage) zwecks Bearbeitung
          der Anfrage verarbeitet.
        </p>
        <p>Diese Daten werden nicht ohne Ihre Einwilligung weitergegeben.</p>

        <h2>7. Externe Links</h2>
        <p>
          Diese Website enthält Links zu externen Plattformen, insbesondere zu
          Instagram.
        </p>
        <p>
          Beim Anklicken eines solchen Links verlassen Sie diese Website. Für
          die Datenverarbeitung auf externen Plattformen sind ausschließlich
          deren Betreiber verantwortlich.
        </p>

        <h2>8. Ihre Rechte</h2>
        <p>Sie haben jederzeit das Recht auf:</p>
        <p>
          Auskunft über Ihre gespeicherten Daten, Berichtigung unrichtiger
          Daten, Löschung Ihrer Daten, Einschränkung der Verarbeitung,
          Datenübertragbarkeit, Widerspruch gegen die Verarbeitung
        </p>
        <p>
          Wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer Daten gegen das
          Datenschutzrecht verstößt, können Sie sich bei der Aufsichtsbehörde
          beschweren.
        </p>
        <p>In Österreich ist dies die:</p>
        <p>Datenschutzbehörde, Barichgasse 40–42, 1030 Wien</p>

        <h2>9. Datensicherheit</h2>
        <p>
          Wir setzen technische und organisatorische Maßnahmen ein, um Ihre
          Daten bestmöglich zu schützen.
        </p>

        <h2>10. Änderungen dieser Datenschutzerklärung</h2>
        <p>
          Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf
          anzupassen, damit sie stets den aktuellen rechtlichen Anforderungen
          entspricht.
        </p>

        <h1 id="privacy-policy">Privacy Policy</h1>

        <h2>1. Controller</h2>
        <p>The controller responsible for data processing on this website is:</p>
        <p>
          Gerhard Kirchschlaeger, Bahnhofplatz 1, 4600 Wels, Austria,
          gerhard@kirchschlaeger.at, +43 676 3140568
        </p>

        <h2>2. General Information</h2>
        <p>The protection of your personal data is important to us.</p>
        <p>
          We process your data exclusively in accordance with applicable legal
          regulations (GDPR, TKG).
        </p>
        <p>
          This website serves as a portfolio presenting design work. No active
          data collection (e.g. via forms or tracking tools) takes place.
        </p>

        <h2>3. Hosting and Content Management</h2>
        <p>
          This website is hosted by Vercel. Content is managed using the
          headless CMS Sanity.
        </p>
        <p>
          When accessing the website, the hosting provider automatically
          collects certain information (server log files), including:
        </p>
        <p>
          IP address, date and time of access, browser type and version,
          operating system, referrer URL
        </p>
        <p>
          These data are technically necessary to deliver the website and ensure
          its stability and security.
        </p>
        <p>
          Processing is based on Art. 6 (1) (f) GDPR (legitimate interest).
        </p>
        <p>
          Note: Data may be processed on servers located in the United States.
          There is a potential risk that U.S. authorities may access such data.
        </p>

        <h2>4. No Use of Cookies</h2>
        <p>This website does not use cookies that require user consent.</p>
        <p>No tracking or analytics technologies are in use.</p>

        <h2>5. No Analytics / Tracking</h2>
        <p>
          No analytics services (such as Google Analytics or similar tools) are
          used.
        </p>
        <p>User behavior is not analyzed.</p>

        <h2>6. Contact</h2>
        <p>You can contact us via email or phone.</p>
        <p>
          If you contact us by email, the data you provide (e.g. name, email
          address, message content) will be processed for the purpose of
          handling your request.
        </p>
        <p>Your data will not be shared without your consent.</p>

        <h2>7. External Links</h2>
        <p>
          This website contains links to external platforms, in particular
          Instagram.
        </p>
        <p>
          When clicking such links, you leave this website. The respective
          provider is solely responsible for data processing on their platform.
        </p>

        <h2>8. Your Rights</h2>
        <p>You have the right to:</p>
        <p>
          access your stored data, request correction of inaccurate data,
          request deletion of your data, restrict processing, data portability,
          object to processing
        </p>
        <p>
          If you believe that the processing of your data violates data
          protection law, you have the right to lodge a complaint with a
          supervisory authority.
        </p>
        <p>In Austria, this is:</p>
        <p>
          Austrian Data Protection Authority, Barichgasse 40–42, 1030 Vienna
        </p>

        <h2>9. Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to
          protect your data.
        </p>

        <h2>10. Changes to this Privacy Policy</h2>
        <p>
          We reserve the right to adapt this privacy policy if necessary to
          ensure it always complies with current legal requirements.
        </p>
      </main>
    </div>
  );
}
