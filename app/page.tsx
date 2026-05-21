import Link from "next/link";

const useInternalLinks =
  process.env.NODE_ENV === "development" ||
  process.env.VERCEL_ENV === "preview";

export default function HomePage() {
  return (
    <main className="home-page">
      <div className="home-bg home-bg--about">
        <img src="/home-bg/about.jpg" alt="" />
      </div>

      <div className="home-bg home-bg--portfolio">
        <video src="/home-bg/portfolio.mp4" autoPlay muted loop playsInline />
      </div>

      <div className="home-bg home-bg--play">
        <video src="/home-bg/play.mp4" autoPlay muted loop playsInline />
      </div>

      <div className="home-bg home-bg--fonts">
        <img src="/home-bg/fonts.jpg" alt="" />
      </div>

      <nav className="home-nav" aria-label="Main navigation">
      <div className="home-title">
          gerhard kirchschlaeger
          </div>

        <div className="home-main-links">
          <Link href="/about" className="home-link home-link--about">
            about
          </Link>

          <Link href="/portfolio" className="home-link home-link--portfolio">
  portfolio
</Link>

          <Link href="/play" className="home-link home-link--play">
            play
          </Link>

          <Link href="/fonts" className="home-link home-link--fonts">
  fonts
</Link>
        </div>

        <div className="home-contact-row">
          <a
            href="https://www.google.com/maps/place/Bahnhofplatz+1,+4600+Wels,+Austria"
            target="_blank"
            rel="noreferrer"
          >
            address
          </a>

          <a href="mailto:gerhard@kirchschlaeger.at">mail</a>

          <a href="tel:+436763140568">phone</a>
        </div>

        <div className="home-secondary-links">
          <a
            href="https://instagram.com/gerhard.kirchschlaeger"
            target="_blank"
            rel="noreferrer"
          >
            instagram
          </a>

          <Link href="/impressum-privacy-policy#imprint">imprint</Link>

          <Link href="/impressum-privacy-policy#privacy-policy">
            privacy policy
          </Link>
        </div>
      </nav>
    </main>
  );
}