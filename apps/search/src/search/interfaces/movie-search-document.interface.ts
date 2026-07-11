export interface MovieSearchDocument {
  id: string;
  slug: string;
  title: string;
  originalTitle?: string;
  poster?: string;
  genres: string[]; // names
  tags: string[]; // names
  actors: string[]; // names
  directors: string[]; // names
  isPremium: boolean;
  rating: number;
}
