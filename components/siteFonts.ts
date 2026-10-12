// The site's typefaces, declared in globals.css. The site is set in the
// DEFAULT_FONT_ID one (globals.css's --site-font); the type tester can pick
// another instead, or mix them.
export const SITE_FONTS = [
  { id: "gain-black", label: "Gain Black", family: "Gain Black" },
  {
    id: "massimo-grafia-plain-mono",
    label: "Massimo Grafia Plain",
    family: "Massimo Grafia Plain Mono",
  },
  { id: "takeoff-b4100-bold", label: "TakeOff", family: "Takeoff B4100 Bold" },
  { id: "massimo-grafia-bold", label: "Massimo Grafia Bold", family: "Massimo Grafia Bold" },
] as const;

export const DEFAULT_FONT_ID = "massimo-grafia-plain-mono";
