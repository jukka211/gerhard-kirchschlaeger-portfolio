import Link from "next/link";

export default function ImpressumPrivacyPolicyPage() {
  return (
    <div className="route-page">
      <Link href="/" className="route-page__back">
        ( X )
      </Link>

      <main className="route-page__content">
        <p className="route-page__eyebrow">Impressum & Privacy Policy</p>
        <h1 className="route-page__title">Legal route scaffolded.</h1>
        <p className="route-page__text">
          This page is in place for the legal notice and privacy policy content that should live under the requested URL.
        </p>
      </main>
    </div>
  );
}
