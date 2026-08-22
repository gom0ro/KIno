export interface Movie {
  id: string;
  title: string;
  originalTitle: string;
  description: string;
  year: number;
  genres: string[];
  rating: number;
  votes: number;
  duration: number;
  ageRating: number;
  director: string;
  cast: string[];
  country: string;
  colors: [string, string];
  videoUrl: string;
  trending?: boolean;
  isNew?: boolean;
}

export type SortOption =
  | "rating-desc"
  | "rating-asc"
  | "year-desc"
  | "year-asc"
  | "title-asc";

export interface CatalogFilters {
  q?: string;
  genre?: string;
  year?: string;
  sort?: SortOption;
  page?: number;
}
