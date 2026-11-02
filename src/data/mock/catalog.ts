import type {
  CatalogCategory,
  CatalogNotification,
  FeaturedItem,
} from "@/types";

/**
 * Legacy, self-contained shapes used only for the seed pipeline and guest demo
 * data. Application code reads MediaSummary / MediaDetail from @/types.
 */
export interface MockEpisode {
  id: string;
  title: string;
  episodeNumber: number;
  description: string;
  durationMinutes: number;
  thumbnailUrl: string;
}

export interface MockSeason {
  id: string;
  title: string;
  seasonNumber: number;
  episodes: MockEpisode[];
}

interface MockBase {
  id: string;
  title: string;
  tagline: string;
  synopsis: string;
  genres: string[];
  posterUrl: string;
  backdropUrl: string;
  rating: number;
  releaseYear: number;
  cast: string[];
  director: string;
  audioFormats: string[];
  subtitleLanguages: string[];
  matchPercent: number;
  ageRating: string;
  maxResolution: string;
  isExclusive?: boolean;
  demoPreviewUrl?: string;
}

export interface MovieItem extends MockBase {
  type: "movie";
  runtimeMinutes: number;
}

export interface SeriesItem extends MockBase {
  type: "series";
  seasonsCount: number;
  seasons: MockSeason[];
}

export type MediaItem = MovieItem | SeriesItem;

export interface ContinueWatchingItem {
  id: string;
  mediaId: string;
  episode?: { seasonNumber: number; episodeNumber: number; title: string };
  progressSeconds: number;
  durationSeconds: number;
}

const poster = (seed: string) => `https://picsum.photos/seed/${seed}/480/720`;
const backdrop = (seed: string) => `https://picsum.photos/seed/${seed}/1920/1080`;
const thumbnail = (seed: string) => `https://picsum.photos/seed/${seed}/320/180`;

const DEMO_PREVIEW_URL = "/videos/demo/demo-preview.mp4";

const movie = (m: Omit<MovieItem, "type">): MovieItem => ({ ...m, type: "movie" });
const series = (s: Omit<SeriesItem, "type" | "seasonsCount">): SeriesItem => ({
  ...s,
  type: "series",
  seasonsCount: s.seasons.length,
});

const ep = (
  id: string,
  title: string,
  episodeNumber: number,
  description: string,
  durationMinutes: number
) => ({
  id,
  title,
  episodeNumber,
  description,
  durationMinutes,
  thumbnailUrl: thumbnail(`cine-ep-${id}`),
});

export const catalog: MediaItem[] = [
  movie({
    id: "neon-parallax",
    title: "Neon Parallax",
    tagline: "Two cities. One stolen sky.",
    synopsis:
      "A rain-soaked courier discovers the skyline over Neo Kestrel is a projection, and every step she takes toward the truth rewrites her own memory of the city.",
    genres: ["Sci-Fi", "Cyberpunk", "Thriller"],
    posterUrl: poster("cine-neon-parallax"),
    backdropUrl: backdrop("cine-neon-parallax-bg"),
    rating: 8.7,
    releaseYear: 2025,
    runtimeMinutes: 132,
    cast: ["Adrienne Voss", "Kenji Aoyama", "Lila Moreau", "Dmitri Osei"],
    director: "Marisa Kwan",
    audioFormats: ["Dolby Atmos", "Surround 5.1"],
    subtitleLanguages: ["English", "Spanish", "Japanese", "French"],
    matchPercent: 97,
    ageRating: "16+",
    maxResolution: "UHD 4K",
    isExclusive: true,
  }),
  movie({
    id: "gravitron-files",
    title: "The Gravitron Files",
    tagline: "Gravity was only the beginning.",
    synopsis:
      "A disgraced physicist races to decode instruments that predict mass glows before the lab that built them burns every witness.",
    genres: ["Sci-Fi", "Thriller"],
    posterUrl: poster("cine-gravitron"),
    backdropUrl: backdrop("cine-gravitron-bg"),
    rating: 8.1,
    releaseYear: 2024,
    runtimeMinutes: 118,
    cast: ["Vikram Suri", "Elena Fresco", "Cora Lindqvist"],
    director: "Joan Baptiste",
    audioFormats: ["Dolby Atmos"],
    subtitleLanguages: ["English", "French"],
    matchPercent: 91,
    ageRating: "13+",
    maxResolution: "Full HD",
  }),
  series({
    id: "aetherbound",
    title: "Aetherbound",
    tagline: "The wind remembers every name.",
    synopsis:
      "In a floating archipelago stitched together by wind spirits, a young sailwright uncovers an ancient pact that keeps the islands airborne.",
    genres: ["Fantasy", "Action", "Drama"],
    posterUrl: poster("cine-aetherbound"),
    backdropUrl: backdrop("cine-aetherbound-bg"),
    rating: 9.0,
    releaseYear: 2025,
    seasons: [
      {
        id: "aetherbound-s1",
        seasonNumber: 1,
        title: "Wind Rising",
        episodes: [
          ep("aether-s1e1", "The First Current", 1, "Miro tames her first storm early, and so does her grief.", 48),
          ep("aether-s1e2", "Salt and Silk", 2, "A trader's ledger reveals debts owed to the sky itself.", 46),
          ep("aether-s1e3", "The Hollow Isle", 3, "An island that fell centuries ago still hums beneath the foam.", 44),
          ep("aether-s1e4", "Tied to No Anchor", 4, "Miro must choose between the fleet and a stranger's map.", 52),
        ],
      },
      {
        id: "aetherbound-s2",
        seasonNumber: 2,
        title: "Veil Breakers",
        episodes: [
          ep("aether-s2e1", "North of Sound", 1, "The convoy sails past the last charted beacon.", 51),
          ep("aether-s2e2", "A Pact Rewritten", 2, "Old windsong notes resurface in a drowned city.", 47),
          ep("aether-s2e3", "The Long Updraft", 3, "Everything falls except what dares to climb.", 55),
          ep("aether-s2e4", "Intent to Sail", 4, "An offer is made that the archipelago cannot refuse.", 49),
        ],
      },
    ],
    cast: ["Inu Sato", "Bram Welch", "Odile Ferrand"],
    director: "Hana Rhee",
    audioFormats: ["Dolby Atmos", "Surround 5.1"],
    subtitleLanguages: ["English", "Japanese", "Spanish"],
    matchPercent: 96,
    ageRating: "13+",
    maxResolution: "UHD 4K",
    isExclusive: true,
  }),
  movie({
    id: "crimson-meridian",
    title: "Crimson Meridian",
    tagline: "Every route has a price.",
    synopsis:
      "A weary trucker agrees to drive one last load across three borders and realizes the cargo is far more dangerous than the road.",
    genres: ["Crime", "Thriller", "Action"],
    posterUrl: poster("cine-crimson"),
    backdropUrl: backdrop("cine-crimson-bg"),
    rating: 7.9,
    releaseYear: 2023,
    runtimeMinutes: 104,
    cast: ["Rae Okafor", "Nils Vulkan", "Portia Mbeki"],
    director: "Dirk Holt",
    audioFormats: ["Surround 5.1"],
    subtitleLanguages: ["English", "German"],
    matchPercent: 84,
    ageRating: "18+",
    maxResolution: "Full HD",
  }),
  series({
    id: "shadow-protocol",
    title: "Shadow Protocol",
    tagline: "Silently, and without warning.",
    synopsis:
      "An off-the-books agency of retired operatives gets pulled back into a mission they buried years ago, one message at a time.",
    genres: ["Action", "Thriller", "Crime"],
    posterUrl: poster("cine-shadow"),
    backdropUrl: backdrop("cine-shadow-bg"),
    rating: 8.5,
    releaseYear: 2026,
    seasons: [
      {
        id: "shadow-s1",
        seasonNumber: 1,
        title: "Reactivation",
        episodes: [
          ep("shadow-s1e1", "Wake the Bench", 1, "A recall signal hits six phones in six time zones.", 44),
          ep("shadow-s1e2", "Dead Drop, Old Bridge", 2, "The courier has been dead for fifteen years.", 42),
          ep("shadow-s1e3", "Nightshift", 3, "A safe house fails exactly as designed.", 45),
          ep("shadow-s1e4", "Credential Zero", 4, "Ghosts compare ID badges.", 50),
          ep("shadow-s1e5", "Full Quiet", 5, "Silence becomes the loudest order.", 48),
        ],
      },
    ],
    cast: ["Sarah Nakamura", "Elias Doerr", "Mai Trinh", "Paul Okafor"],
    director: "Ivy Sandoval",
    audioFormats: ["Dolby Atmos"],
    subtitleLanguages: ["English", "Spanish", "Portuguese"],
    matchPercent: 94,
    ageRating: "16+",
    maxResolution: "UHD 4K",
    isExclusive: true,
  }),
  movie({
    id: "glass-horizon",
    title: "Glass Horizon",
    tagline: "Clear skies with edges.",
    synopsis:
      "Two estranged sisters restore their father's greenhouse, and every pane they reseal opens another crack in the family memory.",
    genres: ["Drama", "Psychological"],
    posterUrl: poster("cine-glass"),
    backdropUrl: backdrop("cine-glass-bg"),
    rating: 8.2,
    releaseYear: 2024,
    runtimeMinutes: 109,
    cast: ["Nadia Fenn", "Yara Bassel", "Thomas Quill"],
    director: "Mira Solano",
    audioFormats: ["Stereo"],
    subtitleLanguages: ["English", "Arabic", "French"],
    matchPercent: 88,
    ageRating: "13+",
    maxResolution: "Full HD",
  }),
  movie({
    id: "kaiju-sonata",
    title: "Kaiju Sonata",
    tagline: "Monsters keep their promises.",
    synopsis:
      "A blind cellist can hear the titan city beneath the harbor, but the beast has requested a very specific final movement.",
    genres: ["Anime", "Fantasy", "Action"],
    posterUrl: poster("cine-kaiju"),
    backdropUrl: backdrop("cine-kaiju-bg"),
    rating: 8.8,
    releaseYear: 2026,
    runtimeMinutes: 121,
    cast: ["Kaito Ozaki", "Aria Lune", "Ren Matsui"],
    director: "Sumi Iwata",
    audioFormats: ["Dolby Atmos", "Surround 5.1"],
    subtitleLanguages: ["English", "Japanese"],
    matchPercent: 98,
    ageRating: "13+",
    maxResolution: "UHD 4K",
    isExclusive: true,
  }),
  series({
    id: "long-lunar-night",
    title: "The Long Lunar Night",
    tagline: "Light is a scarce community.",
    synopsis:
      "During lunar winter, a small research settlement must ration its artificial sun and its trust as instruments begin lying.",
    genres: ["Sci-Fi", "Drama", "Mystery"],
    posterUrl: poster("cine-lunar"),
    backdropUrl: backdrop("cine-lunar-bg"),
    rating: 8.4,
    releaseYear: 2025,
    seasons: [
      {
        id: "lunar-s1",
        seasonNumber: 1,
        title: "Lunation One",
        episodes: [
          ep("lunar-s1e1", "First Night", 1, "The settlement watches its last real dawn for fourteen days.", 41),
          ep("lunar-s1e2", "Candle Minute", 2, "Power is measured in memories of home.", 43),
          ep("lunar-s1e3", "Crater Shift", 3, "A routine mineral survey finds something shaped on purpose.", 46),
          ep("lunar-s1e4", "Earth Rise", 4, "Someone cuts the rover's emergency beacon with the crew still inside.", 45),
        ],
      },
    ],
    cast: ["Zoe Anand", "Boris Kell", "Mara Reyes"],
    director: "Lucas Prévost",
    audioFormats: ["Surround 5.1"],
    subtitleLanguages: ["English", "Mandarin"],
    matchPercent: 90,
    ageRating: "13+",
    maxResolution: "Full HD",
  }),
  movie({
    id: "whisper-circuit",
    title: "Whisper Circuit",
    tagline: "Some machines learn from silence.",
    synopsis:
      "An off-grid sound engineer buys a decommissioned synth that plays back the exact song she hums tomorrow.",
    genres: ["Cyberpunk", "Mystery", "Sci-Fi"],
    posterUrl: poster("cine-whisper"),
    backdropUrl: backdrop("cine-whisper-bg"),
    rating: 7.8,
    releaseYear: 2026,
    runtimeMinutes: 97,
    cast: ["Cass Lowe", "Junia Park", "Fred Asante"],
    director: "Nova Ilic",
    audioFormats: ["Dolby Atmos"],
    subtitleLanguages: ["English", "Italian"],
    matchPercent: 82,
    ageRating: "16+",
    maxResolution: "HD",
  }),
  series({
    id: "emberlight",
    title: "Emberlight",
    tagline: "Keeper of the final flame.",
    synopsis:
      "In a realm where every hearth holds an oath, the last ember-keeper must relight a chain of dying flames before the long winter seals them away.",
    genres: ["Fantasy", "Adventure", "Drama"],
    posterUrl: poster("cine-emberlight"),
    backdropUrl: backdrop("cine-emberlight-bg"),
    rating: 8.6,
    releaseYear: 2024,
    seasons: [
      {
        id: "ember-s1",
        seasonNumber: 1,
        title: "The Last Hearth",
        episodes: [
          ep("ember-s1e1", "Cold Offer", 1, "A desert trader buys warmth with rumors.", 44),
          ep("ember-s1e2", "The Grey Chapel", 2, "A faith built on candle smoke holds a grudge.", 47),
          ep("ember-s1e3", "Iron Frost", 3, "One night without fire would erase a vowel of history.", 43),
          ep("ember-s1e4", "Keeper's Gambit", 4, "The flame demands a name in return.", 52),
        ],
      },
    ],
    cast: ["Rhys Ellery", "Golnar Sanaei", "Patrick Birds"],
    director: "Adaeze Ngeli",
    audioFormats: ["Dolby Atmos", "Surround 5.1"],
    subtitleLanguages: ["English", "Swahili", "German"],
    matchPercent: 93,
    ageRating: "13+",
    maxResolution: "UHD 4K",
  }),
  movie({
    id: "static-skyline",
    title: "Static Skyline",
    tagline: "Something is broadcasting the city.",
    synopsis:
      "A late-night radio host receives call-ins from an exact clone of her transmission, minutes before it happens.",
    genres: ["Mystery", "Thriller"],
    posterUrl: poster("cine-static"),
    backdropUrl: backdrop("cine-static-bg"),
    rating: 8.0,
    releaseYear: 2025,
    runtimeMinutes: 112,
    cast: ["Ralph Motene", "Iris Chand", "Dov Kramer"],
    director: "Sacha Brill",
    audioFormats: ["Dolby Atmos"],
    subtitleLanguages: ["English", "Hebrew"],
    matchPercent: 86,
    ageRating: "16+",
    maxResolution: "Full HD",
  }),
  movie({
    id: "crown-of-antlers",
    title: "Crown of Antlers",
    tagline: "A kingdom of forest vow.",
    synopsis:
      "In a forest court where antlers decide who may speak, the smallest stag carries the heaviest whisper.",
    genres: ["Fantasy", "Drama"],
    posterUrl: poster("cine-antlers"),
    backdropUrl: backdrop("cine-antlers-bg"),
    rating: 8.3,
    releaseYear: 2023,
    runtimeMinutes: 134,
    cast: ["Gina Trace", "Ulric Boone", "Tamara Hill"],
    director: "Marek Dolan",
    audioFormats: ["Surround 5.1"],
    subtitleLanguages: ["English", "Polish"],
    matchPercent: 85,
    ageRating: "13+",
    maxResolution: "Full HD",
  }),
  series({
    id: "paper-samurai",
    title: "Paper Samurai",
    tagline: "One against one hundred.",
    synopsis:
      "A scrappy animated action series about a dojo of students who train with paper swords until their real enemies stop laughing.",
    genres: ["Anime", "Action", "Adventure"],
    posterUrl: poster("cine-samurai"),
    backdropUrl: backdrop("cine-samurai-bg"),
    rating: 8.9,
    releaseYear: 2026,
    seasons: [
      {
        id: "samurai-s1",
        seasonNumber: 1,
        title: "Folding Steel",
        episodes: [
          ep("samurai-s1e1", "Cut Paper, Cut Cobra", 1, "A new student's first duel is a theft of ink.", 26),
          ep("samurai-s1e2", "Rice-paper Vow", 2, "Sensei reveals the dojo's oldest rulebook is a single sheet.", 24),
          ep("samurai-s1e3", "Duel at Dawn Fair", 3, "A rival school batters a festival to make a statement.", 30),
          ep("samurai-s1e4", "The Edge of Her Breath", 4, "Kiri draws a blade she cannot yet fold again.", 27),
        ],
      },
      {
        id: "samurai-s2",
        seasonNumber: 2,
        title: "Ink Storm",
        episodes: [
          ep("samurai-s2e1", "Run to the Mountain", 1, "The dojo is banned from every tournament map.", 28),
          ep("samurai-s2e2", "Return of the Smaller Blade", 2, "Kiri has learned to fight at all heights.", 25),
          ep("samurai-s2e3", "Rain Duel", 3, "Every cut lands clean, and every cut proves nothing.", 29),
          ep("samurai-s2e4", "Torn Seams", 4, "Two schools fold into one at court.", 32),
        ],
      },
    ],
    cast: ["Kana Doue", "Will Brandt", "Shin Yeo"],
    director: "Tobe Inagami",
    audioFormats: ["Dolby Atmos"],
    subtitleLanguages: ["English", "Japanese"],
    matchPercent: 95,
    ageRating: "13+",
    maxResolution: "UHD 4K",
    isExclusive: true,
  }),
  movie({
    id: "the-understudy",
    title: "The Understudy",
    tagline: "Someone must go on.",
    synopsis:
      "An overlooked understudy is handed the role of a murdered lead, and the play that refuses to close keeps opening night after night.",
    genres: ["Psychological", "Thriller", "Drama"],
    posterUrl: poster("cine-understudy"),
    backdropUrl: backdrop("cine-understudy-bg"),
    rating: 8.1,
    releaseYear: 2025,
    runtimeMinutes: 102,
    cast: ["Ondine Toledano", "Roman Massey", "Grigor Baal"],
    director: "Petra Mood",
    audioFormats: ["Surround 5.1"],
    subtitleLanguages: ["English", "Romanian"],
    matchPercent: 89,
    ageRating: "16+",
    maxResolution: "Full HD",
  }),
  movie({
    id: "halcyon-drift",
    title: "Halcyon Drift",
    tagline: "Where the quiet pilots go.",
    synopsis:
      "A cargo pilot ferrying decommissioned star charts takes on one fare bound for a system that is no longer on any of them.",
    genres: ["Sci-Fi", "Adventure", "Drama"],
    posterUrl: poster("cine-halcyon"),
    backdropUrl: backdrop("cine-halcyon-bg"),
    rating: 8.5,
    releaseYear: 2024,
    runtimeMinutes: 126,
    cast: ["Elia Marrero", "Kwame Sisekelo", "Orla Devi"],
    director: "Théo Lam",
    audioFormats: ["Dolby Atmos"],
    subtitleLanguages: ["English", "Vietnamese", "Zulu"],
    matchPercent: 92,
    ageRating: "13+",
    maxResolution: "UHD 4K",
  }),
  series({
    id: "memory-grande",
    title: "Memory Grande",
    tagline: "A hotel where rooms keep their guests.",
    synopsis:
      "A boutique hotel is running a classified experiment where suite memories persist long after check-out.",
    genres: ["Drama", "Mystery", "Psychological"],
    posterUrl: poster("cine-memory"),
    backdropUrl: backdrop("cine-memory-bg"),
    rating: 8.2,
    releaseYear: 2026,
    seasons: [
      {
        id: "memg-s1",
        seasonNumber: 1,
        title: "Room 6",
        episodes: [
          ep("memg-s1e1", "Late Checkout", 1, "A returning guest finds her plants still waiting.", 42),
          ep("memg-s1e2", "Both Windows", 2, "Room 6 remembers two different storms.", 39),
          ep("memg-s1e3", "The Concierge's Key", 3, "Staff memories follow a different floor.", 44),
          ep("memg-s1e4", "Do Not Disturb", 4, "Someone refuses to be forgotten twice.", 47),
        ],
      },
    ],
    cast: ["Simone Arda", "Felix Ou", "Bea Vider"],
    director: "Carmen Ortiz-Blanco",
    audioFormats: ["Surround 5.1"],
    subtitleLanguages: ["English", "French"],
    matchPercent: 87,
    ageRating: "16+",
    maxResolution: "Full HD",
  }),
  movie({
    id: "vantablack-heist",
    title: "Vantablack Heist",
    tagline: "The perfect colors to steal.",
    synopsis:
      "A crew of paroled specialists plots to steal the world's darkest pigment before the conglomerate that owns it buries the patent.",
    genres: ["Crime", "Action", "Thriller"],
    posterUrl: poster("cine-vantablack"),
    backdropUrl: backdrop("cine-vantablack-bg"),
    rating: 7.6,
    releaseYear: 2023,
    runtimeMinutes: 110,
    cast: ["Rem Deverell", "Suki Yanagi", "Fatou Bello"],
    director: "Gustav Renn",
    audioFormats: ["Dolby Atmos"],
    subtitleLanguages: ["English", "Danish"],
    matchPercent: 80,
    ageRating: "16+",
    maxResolution: "Full HD",
  }),
  movie({
    id: "silent-cartographer",
    title: "The Silent Cartographer",
    tagline: "Maps he could never finish.",
    synopsis:
      "A mute surveyor documents a valley that is omitted from every official map, which quietly witnesses everything.",
    genres: ["Mystery", "Sci-Fi", "Adventure"],
    posterUrl: poster("cine-cartographer"),
    backdropUrl: backdrop("cine-cartographer-bg"),
    rating: 8.4,
    releaseYear: 2025,
    runtimeMinutes: 115,
    cast: ["Ian Muwe", "Sera Toll", "Oscar Brill"],
    director: "Freida Sand",
    audioFormats: ["Dolby Atmos"],
    subtitleLanguages: ["English", "Icelandic"],
    matchPercent: 93,
    ageRating: "13+",
    maxResolution: "Full HD",
  }),
  series({
    id: "frostfall",
    title: "Frostfall",
    tagline: "Snow is the slowest fire.",
    synopsis:
      "Three snowbound villages barter the one commodity they can never replace to survive an endless winter.",
    genres: ["Fantasy", "Drama", "Adventure"],
    posterUrl: poster("cine-frostfall"),
    backdropUrl: backdrop("cine-frostfall-bg"),
    rating: 8.7,
    releaseYear: 2026,
    seasons: [
      {
        id: "frost-s1",
        seasonNumber: 1,
        title: "White Harvest",
        episodes: [
          ep("frost-s1e1", "First Flakes", 1, "A single snowstorm divides the valley's year.", 45),
          ep("frost-s1e2", "Salt Lane", 2, "The salt road becomes the season's only currency.", 43),
          ep("frost-s1e3", "Chamber of Coals", 3, "Village elders keep one door always glowing.", 49),
          ep("frost-s1e4", "Thawless", 4, "Spring doesn't come. Someone must leave the valley.", 51),
        ],
      },
    ],
    cast: ["Ulla Kivi", "Bram Ellery", "Mira Ngeli"],
    director: "Aletta Voss",
    audioFormats: ["Dolby Atmos"],
    subtitleLanguages: ["English", "Finnish"],
    matchPercent: 91,
    ageRating: "13+",
    maxResolution: "UHD 4K",
    isExclusive: true,
  }),
  movie({
    id: "chrome-reverie",
    title: "Chrome Reverie",
    tagline: "A machine dreams in widescreen.",
    synopsis:
      "An android tourist films its own memories across a megacity and reads them back to the detective tracking its route.",
    genres: ["Sci-Fi", "Anime", "Cyberpunk"],
    posterUrl: poster("cine-chrome"),
    backdropUrl: backdrop("cine-chrome-bg"),
    rating: 8.9,
    releaseYear: 2026,
    runtimeMinutes: 104,
    cast: ["Voiced by Uno Saito", "Klara Knopf", "Dae-woo Cho"],
    director: "Laika Tov",
    audioFormats: ["Dolby Atmos", "Surround 5.1"],
    subtitleLanguages: ["English", "Japanese", "Korean"],
    matchPercent: 99,
    ageRating: "16+",
    maxResolution: "UHD 4K",
    isExclusive: true,
  }),
  movie({
    id: "downtown-nebula",
    title: "Downtown Nebula",
    tagline: "Commuting through the stars, badly.",
    synopsis:
      "When the city's transit authority accidentally opens a galaxy of shortcuts, two bus drivers become reluctant space champions.",
    genres: ["Comedy", "Sci-Fi", "Adventure"],
    posterUrl: poster("cine-nebula"),
    backdropUrl: backdrop("cine-nebula-bg"),
    rating: 7.7,
    releaseYear: 2026,
    runtimeMinutes: 98,
    cast: ["Botho Kell", "Nuru Vance", "Petra Massey"],
    director: "Gwen Taranto",
    audioFormats: ["Surround 5.1"],
    subtitleLanguages: ["English", "Spanish"],
    matchPercent: 78,
    ageRating: "13+",
    maxResolution: "Full HD",
  }),
  series({
    id: "ninth-ward",
    title: "The Ninth Ward",
    tagline: "Every letter has an address.",
    synopsis:
      "A procedural drama in a police precinct where every cold case is the same case reopened.",
    genres: ["Crime", "Drama", "Mystery"],
    posterUrl: poster("cine-ninth-ward"),
    backdropUrl: backdrop("cine-ninth-ward-bg"),
    rating: 8.3,
    releaseYear: 2024,
    seasons: [
      {
        id: "ward-s1",
        seasonNumber: 1,
        title: "Open Files",
        episodes: [
          ep("ward-s1e1", "Beat One", 1, "Detectives inherit a precinct with a single unresolved case number.", 44),
          ep("ward-s1e2", "Photocopies", 2, "A corner store camera sells the same frame twice.", 42),
          ep("ward-s1e3", "Word on the Block", 3, "Two witnesses claim the same nothing.", 46),
          ep("ward-s1e4", "Ninths", 4, "The worst lead refuses to close.", 48),
        ],
      },
    ],
    cast: ["Renata Puig", "Amos Farrow", "Jean Nyarko"],
    director: "Silas Maretti",
    audioFormats: ["Surround 5.1"],
    subtitleLanguages: ["English", "Twi"],
    matchPercent: 85,
    ageRating: "16+",
    maxResolution: "Full HD",
  }),
  movie({
    id: "signal-lost-deep",
    title: "Signal Lost, Deep",
    tagline: "The data says you're not here.",
    synopsis:
      "A crew of station oceanographers loses contact with the surface while their sensors claim they are the only ocean left.",
    genres: ["Thriller", "Sci-Fi", "Mystery"],
    posterUrl: poster("cine-signal"),
    backdropUrl: backdrop("cine-signal-bg"),
    rating: 8.0,
    releaseYear: 2024,
    runtimeMinutes: 107,
    cast: ["Ivy Solberg", "Manu Cissé", "Randa Fassbinder"],
    director: "Kwamina Boateng",
    audioFormats: ["Dolby Atmos"],
    subtitleLanguages: ["English", "Norwegian"],
    matchPercent: 87,
    ageRating: "16+",
    maxResolution: "Full HD",
  }),
  series({
    id: "orchid-in-the-machine",
    title: "Orchid in the Machine",
    tagline: "Love is the first to upgrade.",
    synopsis:
      "A quiet sci-fi series about online dating app designers who develop feelings for the matchmaking models they build.",
    genres: ["Psychological", "Sci-Fi", "Drama"],
    posterUrl: poster("cine-orchid"),
    backdropUrl: backdrop("cine-orchid-bg"),
    rating: 8.6,
    releaseYear: 2025,
    seasons: [
      {
        id: "orchid-s1",
        seasonNumber: 1,
        title: "Beta Feelings",
        episodes: [
          ep("orchid-s1e1", "Match Reliability", 1, "The metric is up. Everyone in the office is seeing someone.", 41),
          ep("orchid-s1e2", "Latency", 2, "The model responds a half-second after people think of it.", 39),
          ep("orchid-s1e3", "Ghost Protocol", 3, "A user disappears into the feedback loop.", 43),
          ep("orchid-s1e4", "Ship It", 4, "Launching to a million hearts changes the model.", 46),
        ],
      },
    ],
    cast: ["Tessa Marlowe", "Dev Anan", "Karim Holeman"],
    director: "Sancho Vell",
    audioFormats: ["Surround 5.1"],
    subtitleLanguages: ["English", "Hindi"],
    matchPercent: 90,
    ageRating: "16+",
    maxResolution: "Full HD",
  }),
  movie({
    id: "dark-zero",
    title: "Dark Zero",
    tagline: "Countdown from nothing.",
    synopsis:
      "A bomb-tech instructor must defuse the exact device she designed to train her own trainees.",
    genres: ["Action", "Thriller"],
    posterUrl: poster("cine-dark-zero"),
    backdropUrl: backdrop("cine-dark-zero-bg"),
    rating: 8.2,
    releaseYear: 2023,
    runtimeMinutes: 99,
    cast: ["Talia Vance", "Chidi Eze", "Lena Kravets"],
    director: "Bo Halvorsen",
    audioFormats: ["Dolby Atmos"],
    subtitleLanguages: ["English", "Ukrainian"],
    matchPercent: 86,
    ageRating: "16+",
    maxResolution: "Full HD",
  }),
  series({
    id: "ballad-of-ruin",
    title: "Ballad of Ruin",
    tagline: "Every ruin was once a song.",
    synopsis:
      "A wandering minstrel performs in the shadow of a fallen empire, where each ruin demands her song to blend in.",
    genres: ["Fantasy", "Drama", "Adventure"],
    posterUrl: poster("cine-ballad"),
    backdropUrl: backdrop("cine-ballad-bg"),
    rating: 8.1,
    releaseYear: 2025,
    seasons: [
      {
        id: "ballad-s1",
        seasonNumber: 1,
        title: "First Verse",
        episodes: [
          ep("ballad-s1e1", "The Ash Stage", 1, "A tavern made of rubble pays in dinner.", 40),
          ep("ballad-s1e2", "The Listener", 2, "Someone in the crowd knows the unsung verse.", 38),
          ep("ballad-s1e3", "Stone Aria", 3, "The walls choose which words survive.", 44),
          ep("ballad-s1e4", "Coda", 4, "Every ruin gets its ending whether she sings it or not.", 45),
        ],
      },
    ],
    cast: ["Rona Vidovi", "Tan Pham", "Obel Ferrand"],
    director: "Neri Adeyemi",
    audioFormats: ["Surround 5.1"],
    subtitleLanguages: ["English", "Croatian"],
    matchPercent: 83,
    ageRating: "13+",
    maxResolution: "Full HD",
  }),
];

export const catalogById = new Map(catalog.map((item) => [item.id, item]));

export const catalogByIdSafe = (id: string): MediaItem | undefined =>
  catalogById.get(id);

export const featuredItems: FeaturedItem[] = [
  { mediaId: "neon-parallax", previewVideoUrl: DEMO_PREVIEW_URL },
  { mediaId: "aetherbound", previewVideoUrl: DEMO_PREVIEW_URL },
  { mediaId: "kaiju-sonata", previewVideoUrl: DEMO_PREVIEW_URL },
];

export const trendingOrder = [
  "chrome-reverie",
  "kaiju-sonata",
  "aetherbound",
  "neon-parallax",
  "halcyon-drift",
  "frostfall",
  "shadow-protocol",
  "silent-cartographer",
  "paper-samurai",
  "signal-lost-deep",
];

export const popularMovieOrder = [
  "dark-zero",
  "halcyon-drift",
  "gravitron-files",
  "crimson-meridian",
  "static-skyline",
  "glass-horizon",
  "silent-cartographer",
  "downtown-nebula",
  "the-understudy",
  "vantablack-heist",
  "crown-of-antlers",
  "whisper-circuit",
];

export const bingeWorthySeriesOrder = [
  "aetherbound",
  "shadow-protocol",
  "frostfall",
  "paper-samurai",
  "emberlight",
  "orchid-in-the-machine",
  "long-lunar-night",
  "ninth-ward",
  "memory-grande",
  "ballad-of-ruin",
];

export const exclusiveOrder = [
  "chrome-reverie",
  "neon-parallax",
  "kaiju-sonata",
  "aetherbound",
  "shadow-protocol",
  "paper-samurai",
  "frostfall",
];

export const continueWatching: ContinueWatchingItem[] = [
  {
    id: "cw-1",
    mediaId: "neon-parallax",
    progressSeconds: 4820,
    durationSeconds: 132 * 60,
  },
  {
    id: "cw-2",
    mediaId: "aetherbound",
    episode: { seasonNumber: 1, episodeNumber: 3, title: "The Hollow Isle" },
    progressSeconds: 660,
    durationSeconds: 44 * 60,
  },
  {
    id: "cw-3",
    mediaId: "halcyon-drift",
    progressSeconds: 2648,
    durationSeconds: 126 * 60,
  },
  {
    id: "cw-4",
    mediaId: "chrome-reverie",
    progressSeconds: 5700,
    durationSeconds: 104 * 60,
  },
  {
    id: "cw-5",
    mediaId: "paper-samurai",
    episode: { seasonNumber: 1, episodeNumber: 2, title: "Rice-paper Vow" },
    progressSeconds: 480,
    durationSeconds: 24 * 60,
  },
];

export const notifications: CatalogNotification[] = [
  {
    id: "n1",
    title: "New arrival",
    message: "Chrome Reverie is now streaming — a Cinevide Exclusives title.",
    imageUrl: thumbnail("cine-chrome"),
    timeLabel: "2h ago",
  },
  {
    id: "n2",
    title: "Watch next",
    message: "Season 2 of Paper Samurai just dropped this week.",
    imageUrl: thumbnail("cine-samurai"),
    timeLabel: "Yesterday",
  },
  {
    id: "n3",
    title: "Continue watching",
    message: "Resume Neon Parallax where you left off.",
    imageUrl: thumbnail("cine-neon-parallax"),
    timeLabel: "3 days ago",
  },
];

export const categories: CatalogCategory[] = [
  "All",
  "Movies",
  "Series",
  "Action",
  "Sci-Fi",
  "Drama",
  "Thriller",
  "Fantasy",
  "Anime",
];
