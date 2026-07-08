export type SanityImage = {
  asset?: {
    _ref?: string;
    url?: string;
    metadata?: {
      dimensions?: {
        width?: number;
        height?: number;
      };
    };
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

export type BackgroundSlide = {
  _key: string;
  alt?: string;
  asset?: {
    url?: string;
  };
};

export type HomePageData = {
  title?: string;
  desktopSlides?: BackgroundSlide[];
  mobileSlides?: BackgroundSlide[];
  galleryItems?: GalleryItem[];
};

export type FontImageSize = "small" | "medium" | "large";

export type FontImageItem = {
  _key: string;
  size?: FontImageSize;
  image?: SanityImage;
};

export type FontNavLink = {
  _key: string;
  label: string;
  url?: string;
};

export type FontsPageData = {
  title?: string;
  navLinks?: FontNavLink[];
  introTitle?: string;
  introText?: string;
  images?: FontImageItem[];
};