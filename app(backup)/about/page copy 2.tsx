"use client";

import Link from "next/link";
import "./about.css";

export default function AboutPage() {
  return (
    <>
      <Link href="/" className="back-button">
         ( Back )
      </Link>

      <main className="about">
        <section className="about-column left">
          <div className="about-text">
            <p>
              Our focus is on conceptual and systemic design. Typography serves as our starting point for distinctive visual systems. We explore how typography can shape identities, structures, and visual languages—from experimental type systems and editorial design to typography-driven identities. For each project, we collaborate with a curated network of experts from various fields of visual communication.<br />
              Selected fields of work include: <br />
              ■ Typography-first identities<br />
              ■ Corporate typesetting<br />
              ■ Editorial design<br />
              ■ Experimental font systems<br />
              ■ UX / UI experience<br />
              Alongside my studio work, I am a university lecturer for layout and typography at the University of Arts Linz.
              <br />
              Gerhard Kirchschläger <br />
              Bahnhofplatz 1 <br />
              4600 Wels <br />
              Austria <br />
              +43 676 3140568 <br />
              gerhard@kirchschlaeger.at<br />
              UID ATU49887500<br />
              <a href="https://fonts.gerhardkirchschlaeger.at">Fonts</a><br />
              <a href="https://gerhardkirchschlaeger.at">Web.</a><br />
              <a href="https://instagram.com/gerhard.kirchschlaeger">Inst.</a>
            </p>
          </div>
        </section>

        <section className="about-column center">
          <div className="about-text">
            <p>
              3x TDC Type Directors Club<br />
              3x TDC Tokyo Prize Nominee Work<br />
              4x TDC Tokyo Excellent Work<br />
              1x ADC*E Art Directors Club Europe siver<br />
              1x ADC*E Art Directors Club Europe bronze<br />
              7x CCA Creativ Club Austria Shortlist<br />
              1x Joseph Binder Award Silver<br />
              2x Joseph Binder Award Distinction<br />
              3x CA Comm. Arts Typography<br />
              3x CA Comm. Arts Design<br />
              3x HKDA Hongkong Global Design Award<br />
              4x Red Dot Comm. Design<br />
              9x Berliner Type<br />
              2x IF Design Award<br />
              2x Good Design Award<br />
              1x Award360 (Shortlist)<br />
            </p>
          </div>
        </section>
      </main>
    </>
  );
}