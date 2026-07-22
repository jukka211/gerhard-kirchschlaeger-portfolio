import { defineArrayMember, defineField, defineType } from "sanity";
import { aboutRowsDefault } from "../lib/aboutRowsDefault";

export const aboutPage = defineType({
  name: "aboutPage",
  title: "About page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      initialValue: "About",
    }),
    defineField({
      name: "rows",
      title: "Rows",
      description:
        "Each row renders as its own paragraph on the About page, in order. Add a link (e.g. tel:... or mailto:...) to make a row clickable.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "aboutRow",
          fields: [
            defineField({
              name: "text",
              title: "Text",
              type: "text",
              rows: 2,
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "href",
              title: "Link (optional)",
              type: "string",
              description:
                "e.g. tel:+436763140568 or mailto:gerhard@kirchschlaeger.at",
            }),
          ],
          preview: {
            select: { title: "text", subtitle: "href" },
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(1),
      initialValue: aboutRowsDefault,
    }),
  ],
});
