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
  ],
  preview: {
    select: {
      media: "image",
      size: "size",
    },
    prepare({ media, size }) {
      return {
        title: `${size || "medium"} image`,
        media,
      };
    },
  },
});