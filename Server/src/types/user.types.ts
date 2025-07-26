export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  avatar?: string;
  createdAt: Date;
  totalIdeas: number;
  totalLikes: number;
  isActive: boolean;
}

export interface PublicProfile {
  id: string;
  name?: string;
  bio?: string;
  avatar?: string;
  createdAt: Date;
  totalIdeas: number;
  totalLikes: number;
}

export interface UserStats {
  id: string;
  name?: string;
  totalIdeas: number;
  totalLikes: number;
  totalLikesReceived: number;
  ideasThisMonth: number;
  likesThisMonth: number;
  topTags: Array<{ tag: string; count: number }>;
  joinedAt: Date;
}

export interface UserActivity {
  type: 'idea_created' | 'idea_liked' | 'idea_updated';
  ideaId: string;
  ideaTitle: string;
  timestamp: Date;
}