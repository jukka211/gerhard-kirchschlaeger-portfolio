import { defineField, defineType } from "sanity";

export const fontImageItem = defineType({
  name: "fontImageItem",
  title: "Font image item",
  type: "object",
  fields: [
    defineField({
      name: "image",
      title: "Image / SVG",
      type: "image",
      options: {
        hotspot: false,
        accept: "image/*,.svg,image/svg+xml",
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "size",
      title: "Image size",
      type: "string",
      initialValue: "medium",
      options: {
        list: [
          { title: "Small", value: "small" },
          { title: "Medium", value: "medium" },
          { title: "Large", value: "large" },
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "marginTopVh",
      title: "Margin top",
      description: "Value in vh. Min 0, max 100.",
      type: "number",
      initialValue: 0,
      validation: (Rule) => Rule.min(0).max(100),
    }),
    defineField({
      name: "marginBottomVh",
      title: "Margin bottom",
      description: "Value in vh. Min 0, max 100.",
      type: "number",
      initialValue: 0,
      validation: (Rule) => Rule.min(0).max(100),
    }),
  ],
  preview: {
    select: {
      media: "image",
      size: "size",
      marginTopVh: "marginTopVh",
      marginBottomVh: "marginBottomVh",
    },
    prepare({ media, size, marginTopVh, marginBottomVh }) {
      return {
        title: `${size || "medium"} image`,
        subtitle: `Top: ${marginTopVh || 0}vh / Bottom: ${
          marginBottomVh || 0
        }vh`,
        media,
      };
    },
  },
});