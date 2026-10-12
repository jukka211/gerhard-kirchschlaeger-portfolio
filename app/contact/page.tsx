import "../about/about.css";

import AboutClient from "../about/AboutClient";
import { CONTACT } from "../about/contactRows";

// The contact details, in the about page's style.
export default function ContactPage() {
  return (
    <AboutClient
      className="contact-sheet"
      rows={[CONTACT.phone, CONTACT.email, CONTACT.instagram, CONTACT.address]}
    />
  );
}
