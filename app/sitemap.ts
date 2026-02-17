// import { MetadataRoute } from "next"

// export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
//   const cursos = await getCursos() // vai buscar à tua DB
//   const universidades = await getUniversidades()

//   const cursosUrls = cursos.map((curso) => ({
//     url: `https://www.unimatch.pt/cursos/${curso.slug}`,
//     lastModified: new Date(),
//     changeFrequency: "monthly" as const,
//     priority: 0.8,
//   }))

//   const universidadesUrls = universidades.map((uni) => ({
//     url: `https://www.unimatch.pt/universidades/${uni.slug}`,
//     lastModified: new Date(),
//     changeFrequency: "monthly" as const,
//     priority: 0.7,
//   }))

//   return [
//     {
//       url: "https://www.unimatch.pt",
//       lastModified: new Date(),
//       changeFrequency: "daily",
//       priority: 1,
//     },
//     {
//       url: "https://www.unimatch.pt/calculadora",
//       lastModified: new Date(),
//       changeFrequency: "monthly",
//       priority: 0.9,
//     },
//     {
//       url: "https://www.unimatch.pt/medias",
//       lastModified: new Date(),
//       changeFrequency: "monthly",
//       priority: 0.9,
//     },
//     ...cursosUrls,
//     ...universidadesUrls,
//   ]
// }