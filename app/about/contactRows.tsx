import type { Row } from "./AboutClient";

// The contact details, shown under the info page's text and on their own
// on the contact page. Rows like any other, so the modes and the type
// tester reach them too.
export const CONTACT = {
  phone: { key: "contact-phone", content: "+43 676 3140568", href: "tel:+436763140568" },
  email: {
    key: "contact-email",
    content: "gerhard@kirchschlaeger.at",
    href: "mailto:gerhard@kirchschlaeger.at",
  },
  instagram: {
    key: "contact-instagram",
    content: "@gerhard.kirchschlaeger",
    href: "https://www.instagram.com/gerhard.kirchschlaeger/",
  },
  address: {
    key: "contact-address",
    content: (
      <>
        Gerhard Kirchschläger,
        <br />
        Bahnhofplatz 1,
        <br />
        4600 Wels
        <br />
        AT
      </>
    ),
    href: "https://maps.app.goo.gl/WCeqwkDLHsS34HXg6",
  },
} satisfies Record<string, Row>;
