import { defineArrayMember, defineField, defineType } from "sanity";

export const fontsPage = defineType({
  name: "fontsPage",
  title: "Fonts page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      initialValue: "Fonts",
    }),
    defineField({
      name: "navLinks",
      title: "Navigation links",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "url",
              title: "Link",
              type: "url",
              description:
                "Internal path or external URL. For static pages in /public (e.g. p5.js sketches), use the full file path, e.g. /fonts/loop-font/index.html. Leave empty for non-clickable items like “in progress”.",
              validation: (Rule) =>
                Rule.uri({
                  allowRelative: true,
                  scheme: ["http", "https", "mailto", "tel"],
                }),
            }),
          ],
          preview: {
            select: {
              title: "label",
              subtitle: "url",
            },
          },
        }),
      ],
      initialValue: [
        {
          label: "Loop Font",
        },
        {
          label: "Broken Script",
        },
        {
          label: "in progress",
        },
      ],
    }),
    defineField({
      name: "introTitle",
      title: "Intro foldout title",
      type: "string",
      initialValue: "■ Info >",
    }),
    defineField({
      name: "introText",
      title: "Intro text",
      type: "text",
      rows: 12,
      initialValue:
        "Typography written in code. Built with p5.js and developed through AI-assisted workflows, these fonts exist as systems rather than static designs. They are variable, unstable, and deliberately open-ended.\n\nThey oscillate between function and expression—between readable text and abstract pattern.\n\nAt times they communicate. At times they refuse.\n\nEvery typeface creates its own space: a space for experimentation and exploration. What remains, when readability disappears, is rhythm, structure, and form.\n\nThis project is an ongoing exploration of those limits.\n\nGerhard Kirchschlaeger\nBahnhofplatz 1\nAustria\nAT\ngerhard@kirchschlaeger.at",
    }),
    defineField({
      name: "desktopSlides",
      title: "Desktop Images",
      description:
        "Full-screen images that auto-advance behind the fonts page navigation on desktop. Click anywhere on the background to pause/resume.",
      type: "array",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Alt text",
              type: "string",
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: "mobileSlides",
      title: "Mobile Images",
      description:
        "Vertical (portrait) full-screen images used for the background slideshow on mobile instead of the desktop images.",
      type: "array",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Alt text",
              type: "string",
            }),
          ],
        }),
      ],
    }),
  ],
});