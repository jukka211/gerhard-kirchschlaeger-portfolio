"use client";

import { useState } from "react";
import "./about.css";

export default function AboutPage() {
  const [activeColumn, setActiveColumn] = useState<"left" | "right" | null>(null);

  const handleClick = (column: "left" | "right") => {
    setActiveColumn((prev) => (prev === column ? null : column));
  };

  return (
    <main className="about">
      <section
        className={`about-column left ${activeColumn === "left" ? "is-active" : ""} ${
          activeColumn === "right" ? "is-inactive" : ""
        }`}
        onClick={() => handleClick("left")}
      >
        <div className="about-text">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
            tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
            quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
            consequat.
          </p>
          <p>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
            eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt
            in culpa qui officia deserunt mollit anim id est laborum.
          </p>
        </div>
      </section>

      <section
  className={`about-column right ${activeColumn === "right" ? "is-active" : ""} ${
    activeColumn === "left" ? "is-inactive" : ""
  }`}
  onClick={() => handleClick("right")}
>
  <div className="about-text awards-list">
    <p>Selected Awards</p>

    <div className="award-item"><p>2024 / CCA Austria / Branding / 2 Awards</p></div>
    <div className="award-item"><p>2023 / TDC / Typography / 1 Award</p></div>
    <div className="award-item"><p>2022 / CA / Editorial Design / 3 Awards</p></div>
    <div className="award-item"><p>2021 / ADC / Art Direction / 1 Award</p></div>
    <div className="award-item"><p>2020 / CCA Austria / Poster Design / 1 Award</p></div>
    <div className="award-item"><p>2019 / TDC / Type Design / 2 Awards</p></div>
    <div className="award-item"><p>2018 / CA / Identity / 1 Award</p></div>
    <div className="award-item"><p>2017 / ADC / Campaign / 2 Awards</p></div>
  </div>
</section>
    </main>
  );
}