import {defineArrayMember, defineField, defineType} from "sanity";

export const homePage = defineType({
  name: "homePage",
  title: "Homepage",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      initialValue: "Homepage",
    }),
    defineField({
      name: "galleryItems",
      title: "Gallery items",
      type: "array",
      of: [defineArrayMember({type: "galleryItem"})],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "desktopSlides",
      title: "Desktop Images",
      description:
        "Full-screen images that auto-advance behind the start page navigation on desktop. Click anywhere on the background to pause/resume.",
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