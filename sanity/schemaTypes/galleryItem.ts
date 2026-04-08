import {defineField, defineType} from "sanity";

type GalleryVideoValue = {
  mp4?: {
    asset?: unknown;
  };
  webm?: {
    asset?: unknown;
  };
};

export const galleryItem = defineType({
  name: "galleryItem",
  title: "Gallery item",
  type: "object",
  fields: [
    defineField({
      name: "mediaType",
      title: "Media type",
      type: "string",
      initialValue: "image",
      options: {
        list: [
          {title: "Image", value: "image"},
          {title: "Video", value: "video"},
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "orientation",
      title: "Orientation",
      type: "string",
      initialValue: "landscape",
      options: {
        list: [
          {title: "Portrait", value: "portrait"},
          {title: "Landscape", value: "landscape"},
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      hidden: ({parent}) => parent?.mediaType !== "image",
      options: {hotspot: true},
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "video",
      title: "Video",
      type: "object",
      hidden: ({parent}) => parent?.mediaType !== "video",
      fields: [
        defineField({
          name: "poster",
          title: "Poster image",
          type: "image",
          options: {hotspot: true},
        }),
        defineField({
          name: "mp4",
          title: "MP4 file",
          type: "file",
          options: {accept: "video/mp4"},
        }),
        defineField({
          name: "webm",
          title: "WebM file",
          type: "file",
          options: {accept: "video/webm"},
        }),
      ],
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {mediaType?: string};
          const video = value as GalleryVideoValue | undefined;

          if (parent?.mediaType !== "video") return true;

          const hasMp4 = Boolean(video?.mp4?.asset);
          const hasWebm = Boolean(video?.webm?.asset);

          if (!hasMp4 && !hasWebm) {
            return "Add at least one video file: MP4 or WebM";
          }

          return true;
        }),
    }),
  ],
  preview: {
    select: {
      mediaType: "mediaType",
      orientation: "orientation",
      image: "image",
      poster: "video.poster",
    },
    prepare({mediaType, orientation, image, poster}) {
      return {
        title: `${mediaType} • ${orientation}`,
        media: image || poster,
      };
    },
  },
});
