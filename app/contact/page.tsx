import "../about/about.css";

import AboutClient from "../about/AboutClient";
import { CONTACT } from "../about/contactRows";

// The info page's contact details on their own, in the same style.
export default function ContactPage() {
  return (
    <AboutClient rows={[CONTACT.phone, CONTACT.email, CONTACT.instagram, CONTACT.address]} />
  );
}
