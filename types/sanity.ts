export type SanityImage = {
  asset?: {
    _ref?: string;
    url?: string;
  };
  alt?: string;
};

export type SanityFile = {
  asset?: {
    url?: string;
  };
};

export type GalleryItem = {
  _key: string;
  mediaType: "image" | "video";
  orientation: "portrait" | "landscape";
  image?: SanityImage;
  video?: {
    poster?: SanityImage;
    mp4?: SanityFile;
    webm?: SanityFile;
  };
};

export type HomePageData = {
  title?: string;
  galleryItems?: GalleryItem[];
};