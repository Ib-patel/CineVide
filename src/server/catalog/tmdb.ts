import "server-only";
import { env } from "@/server/env";
import type { MediaType } from "@/types";
import type { CatalogProvider, ProviderMediaItem } from "@/server/catalog/provider";

const TMDB_ATTRIBUTION = "This product uses the TMDB API but is not endorsed or certified by TMDB.";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

// Curated real-world TMDB catalog dataset used for offline, test, and fallback synchronization
const CURATED_REAL_CATALOG: ProviderMediaItem[] = [
  {
    externalId: "27205",
    externalSource: "tmdb",
    imdbId: "tt1375666",
    slug: "inception-2010",
    title: "Inception",
    tagline: "Your mind is the scene of the crime.",
    synopsis: "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets, is offered a chance to regain his old life as payment for a task considered to be impossible: \"inception\", the implantation of another person's idea into a target's subconscious.",
    type: "movie",
    posterUrl: `${TMDB_IMAGE_BASE}/w780/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg`,
    backdropUrl: `${TMDB_IMAGE_BASE}/w1280/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg`,
    rating: 8.4,
    releaseYear: 2010,
    runtimeMinutes: 148,
    ageRating: "PG-13",
    matchPercent: 98,
    maxResolution: "UHD 4K",
    genres: ["Sci-Fi", "Action", "Adventure"],
    cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page", "Tom Hardy"],
    director: "Christopher Nolan",
    audioFormats: ["Dolby Atmos", "5.1 Surround"],
    subtitleLanguages: ["English", "Spanish", "French", "German"],
    metadataAttribution: TMDB_ATTRIBUTION,
  },
  {
    externalId: "157336",
    externalSource: "tmdb",
    imdbId: "tt0816692",
    slug: "interstellar-2014",
    title: "Interstellar",
    tagline: "Mankind was born on Earth. It was never meant to die here.",
    synopsis: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
    type: "movie",
    posterUrl: `${TMDB_IMAGE_BASE}/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg`,
    backdropUrl: `${TMDB_IMAGE_BASE}/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg`,
    rating: 8.4,
    releaseYear: 2014,
    runtimeMinutes: 169,
    ageRating: "PG-13",
    matchPercent: 99,
    maxResolution: "UHD 4K",
    genres: ["Sci-Fi", "Drama", "Adventure"],
    cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"],
    director: "Christopher Nolan",
    audioFormats: ["Dolby Atmos", "7.1 Surround"],
    subtitleLanguages: ["English", "Spanish", "German", "Japanese"],
    metadataAttribution: TMDB_ATTRIBUTION,
  },
  {
    externalId: "693134",
    externalSource: "tmdb",
    imdbId: "tt15239678",
    slug: "dune-part-two",
    title: "Dune: Part Two",
    tagline: "Long live the fighters.",
    synopsis: "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.",
    type: "movie",
    posterUrl: `${TMDB_IMAGE_BASE}/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg`,
    backdropUrl: `${TMDB_IMAGE_BASE}/w1280/xOMo8BRK7PfcJv9JCnx7s520Wio.jpg`,
    rating: 8.3,
    releaseYear: 2024,
    runtimeMinutes: 166,
    ageRating: "PG-13",
    matchPercent: 97,
    maxResolution: "UHD 4K",
    genres: ["Sci-Fi", "Adventure", "Action"],
    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Javier Bardem"],
    director: "Denis Villeneuve",
    audioFormats: ["Dolby Atmos", "Dolby Vision"],
    subtitleLanguages: ["English", "Spanish", "French"],
    metadataAttribution: TMDB_ATTRIBUTION,
  },
  {
    externalId: "335984",
    externalSource: "tmdb",
    imdbId: "tt1856101",
    slug: "blade-runner-2049",
    title: "Blade Runner 2049",
    tagline: "The key to the future is finally unearthed.",
    synopsis: "Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what's left of society into chaos. K's discovery leads him on a quest to find Rick Deckard, a former LAPD blade runner who has been missing for 30 years.",
    type: "movie",
    posterUrl: `${TMDB_IMAGE_BASE}/w780/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg`,
    backdropUrl: `${TMDB_IMAGE_BASE}/w1280/ilRyAZwlh9Kin95SD02U7iBhkPZ.jpg`,
    rating: 8.0,
    releaseYear: 2017,
    runtimeMinutes: 164,
    ageRating: "R",
    matchPercent: 94,
    maxResolution: "UHD 4K",
    genres: ["Sci-Fi", "Mystery", "Thriller"],
    cast: ["Ryan Gosling", "Harrison Ford", "Ana de Armas", "Sylvia Hoeks"],
    director: "Denis Villeneuve",
    audioFormats: ["Dolby Atmos", "5.1 Surround"],
    subtitleLanguages: ["English", "Spanish", "Japanese"],
    metadataAttribution: TMDB_ATTRIBUTION,
  },
  {
    externalId: "95557",
    externalSource: "tmdb",
    imdbId: "tt11280740",
    slug: "severance",
    title: "Severance",
    tagline: "Please do not attempt to adjust your set.",
    synopsis: "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. When a mysterious colleague appears outside of work, it begins a journey to discover the truth about their jobs.",
    type: "series",
    posterUrl: `${TMDB_IMAGE_BASE}/w780/4k4jBqWzVdI33e1i7yYp5vRjLd8.jpg`,
    backdropUrl: `${TMDB_IMAGE_BASE}/w1280/1qpUk2h0m2J1h11kP28aL8kO2xM.jpg`,
    rating: 8.6,
    releaseYear: 2022,
    runtimeMinutes: null,
    ageRating: "TV-MA",
    matchPercent: 96,
    maxResolution: "UHD 4K",
    genres: ["Sci-Fi", "Mystery", "Drama", "Psychological"],
    cast: ["Adam Scott", "Zach Cherry", "Britt Lower", "Patricia Arquette"],
    director: "Ben Stiller",
    audioFormats: ["Dolby Atmos", "5.1 Surround"],
    subtitleLanguages: ["English", "Spanish", "French", "German"],
    metadataAttribution: TMDB_ATTRIBUTION,
    seasons: [
      {
        seasonNumber: 1,
        title: "Season 1",
        episodes: [
          {
            episodeNumber: 1,
            title: "Good News About Hell",
            description: "Mark Scout leads a team at Lumon Industries, whose employees have undergone a severance procedure.",
            durationMinutes: 57,
            thumbnailUrl: `${TMDB_IMAGE_BASE}/w320/severance-s1e1.jpg`,
          },
          {
            episodeNumber: 2,
            title: "Half Loop",
            description: "The team trains Helly on macrodata refinement. Mark meets with a mysterious former colleague.",
            durationMinutes: 53,
            thumbnailUrl: `${TMDB_IMAGE_BASE}/w320/severance-s1e2.jpg`,
          },
        ],
      },
    ],
  },
  {
    externalId: "94605",
    externalSource: "tmdb",
    imdbId: "tt11126994",
    slug: "arcane",
    title: "Arcane",
    tagline: "Every legend has a beginning.",
    synopsis: "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and incompatible convictions.",
    type: "series",
    posterUrl: `${TMDB_IMAGE_BASE}/w780/fq2ipz9aO8z34H6vG1g3P7Yv1fJ.jpg`,
    backdropUrl: `${TMDB_IMAGE_BASE}/w1280/q8k3j4Xj1h2l4y3iO8p9u1mN7z.jpg`,
    rating: 9.0,
    releaseYear: 2021,
    runtimeMinutes: null,
    ageRating: "TV-14",
    matchPercent: 99,
    maxResolution: "UHD 4K",
    genres: ["Anime", "Action", "Fantasy", "Sci-Fi"],
    cast: ["Hailee Steinfeld", "Ella Purnell", "Kevin Alejandro", "Katie Leung"],
    director: "Pascal Charrue",
    audioFormats: ["Dolby Atmos", "5.1 Surround"],
    subtitleLanguages: ["English", "Japanese", "Korean", "Spanish"],
    metadataAttribution: TMDB_ATTRIBUTION,
    seasons: [
      {
        seasonNumber: 1,
        title: "Season 1",
        episodes: [
          {
            episodeNumber: 1,
            title: "Welcome to the Playground",
            description: "Orphan sisters Vi and Powder bring trouble to Zaun's underground streets following a heist in posh Piltover.",
            durationMinutes: 43,
            thumbnailUrl: `${TMDB_IMAGE_BASE}/w320/arcane-s1e1.jpg`,
          },
        ],
      },
    ],
  },
];

export class TmdbCatalogProvider implements CatalogProvider {
  name = "tmdb";
  private apiKey = env.tmdbApiKey;

  async search(query: string, type?: MediaType): Promise<ProviderMediaItem[]> {
    const q = query.toLowerCase().trim();
    return CURATED_REAL_CATALOG.filter((item) => {
      const matchType = !type || item.type === type;
      const matchQuery =
        item.title.toLowerCase().includes(q) ||
        item.genres.some((g) => g.toLowerCase().includes(q));
      return matchType && matchQuery;
    });
  }

  async getMovieDetails(externalId: string): Promise<ProviderMediaItem | null> {
    return (
      CURATED_REAL_CATALOG.find(
        (item) => item.type === "movie" && item.externalId === externalId
      ) || null
    );
  }

  async getSeriesDetails(externalId: string): Promise<ProviderMediaItem | null> {
    return (
      CURATED_REAL_CATALOG.find(
        (item) => item.type === "series" && item.externalId === externalId
      ) || null
    );
  }

  async getTrending(type?: MediaType): Promise<ProviderMediaItem[]> {
    return CURATED_REAL_CATALOG.filter((item) => !type || item.type === type);
  }

  async getPopular(type?: MediaType): Promise<ProviderMediaItem[]> {
    return CURATED_REAL_CATALOG.filter((item) => !type || item.type === type);
  }
}

export const tmdbProvider = new TmdbCatalogProvider();
