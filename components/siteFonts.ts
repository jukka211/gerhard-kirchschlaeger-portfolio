// The site's typefaces, declared in globals.css. Each visit opens in one of
// them at random; the type tester can pick one instead, or mix them.
export const SITE_FONTS = [
  { id: "gain-black", label: "gain black", family: "Gain Black" },
  {
    id: "massimo-grafia-plain-mono",
    label: "massimo grafia plain mono",
    family: "Massimo Grafia Plain Mono",
  },
  { id: "takeoff-b4100-bold", label: "takeoff b4100 bold", family: "Takeoff B4100 Bold" },
] as const;

// Runs before the page paints, so the text never shows up in one font and
// switches to another. Picks this visit's font, never the one the last visit
// had, and puts it in --site-font.
export const SITE_FONT_SCRIPT = `(() => {
  const families = ${JSON.stringify(SITE_FONTS.map((font) => font.family))};
  let last = null;
  try { last = localStorage.getItem("site-font"); } catch {}
  const options = families.filter((family) => family !== last);
  const family = options[Math.floor(Math.random() * options.length)];
  try { localStorage.setItem("site-font", family); } catch {}
  document.documentElement.style.setProperty("--site-font", JSON.stringify(family));
})();`;
