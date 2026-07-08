import { groq } from "next-sanity";

export const homePageQuery = groq`
  *[_type == "homePage"][0]{
    title,
    desktopSlides[]{
      _key,
      alt,
      asset->{
        url
      }
    },
    mobileSlides[]{
      _key,
      alt,
      asset->{
        url
      }
    },
    galleryItems[]{
      _key,
      mediaType,
      orientation,
      image{
        alt,
        asset->
      },
      video{
        poster{
          asset->
        },
        mp4{
          asset->{
            url
          }
        },
        webm{
          asset->{
            url
          }
        }
      }
    }
  }
`;

export const fontsPageQuery = groq`
  *[_type == "fontsPage"][0]{
    title,
    navLinks[]{
      _key,
      label,
      url
    },
    introTitle,
    introText,
    images[]{
      _key,
      size,
      image{
        alt,
        asset->{
          url,
          metadata{
            dimensions{
              width,
              height
            }
          }
        }
      }
    }
  }
`;