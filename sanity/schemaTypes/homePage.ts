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
  ],
});