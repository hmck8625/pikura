// Player / Profile
export type Player = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  prefecture: string | null;
  playStyle: string | null;
  bio: string | null;
  createdAt: string;
};

// Ranking
export type Ranking = {
  id: string;
  playerId: string;
  player: Player;
  category: string;
  rank: number;
  points: number;
  winRate: number;
  updatedAt: string;
};

// Event
export type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  prefecture: string;
  capacity: number;
  participantsCount: number;
  level: string;
  organizerId: string;
  createdAt: string;
};

// PairRequest
export type PairRequest = {
  id: string;
  title: string;
  tournamentName: string;
  date: string;
  level: string;
  message: string;
  userId: string;
  createdAt: string;
};

// Article (microCMS)
export type Article = {
  id: string;
  title: string;
  slug: string;
  content: string;
  eyecatch: {
    url: string;
    width: number;
    height: number;
  } | null;
  category: {
    id: string;
    name: string;
  };
  publishedAt: string;
  updatedAt: string;
};

// microCMS list response
export type MicroCMSListResponse<T> = {
  contents: T[];
  totalCount: number;
  offset: number;
  limit: number;
};
