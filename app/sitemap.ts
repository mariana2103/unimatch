import { MetadataRoute } from "next"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {


  return [
    {
      url: "https://www.unimatch.pt",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://www.unimatch.pt/calculadora",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://www.unimatch.pt/medias",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },

  ]
}