import {groq} from "next-sanity";

export const homePageQuery = groq`
  *[_type == "homePage"][0]{
    title,
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