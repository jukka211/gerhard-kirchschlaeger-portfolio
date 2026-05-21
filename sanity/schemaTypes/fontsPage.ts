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
              title: "External URL",
              type: "url",
              description:
                "Leave empty for non-clickable items like “in progress”.",
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
      name: "columns",
      title: "Image columns",
      type: "object",
      fields: [
        defineField({
          name: "left",
          title: "Left column images",
          type: "array",
          of: [defineArrayMember({ type: "fontImageItem" })],
        }),
        defineField({
          name: "middle",
          title: "Middle column images",
          type: "array",
          of: [defineArrayMember({ type: "fontImageItem" })],
        }),
        defineField({
          name: "right",
          title: "Right column images",
          type: "array",
          of: [defineArrayMember({ type: "fontImageItem" })],
        }),
      ],
    }),
  ],
});