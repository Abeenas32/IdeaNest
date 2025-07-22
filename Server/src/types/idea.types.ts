export interface CreateIdeaData {
  title: string;
  content: string;
  tags?: string[];
  authorId?: string;
  authorType: 'authenticated' | 'anonymous';
}

export interface UpdateIdeaData {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface IdeaFilters {
  search?: string;
  tags?: string[];
  authorType?: 'authenticated' | 'anonymous';
  sortBy?: 'createdAt' | 'likeCount' | 'viewCount' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}


export interface CreateIdeaRequest {
  title: string;
  content: string;
  tags?: string[];
}

export interface UpdateIdeaRequest {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface IdeaQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string;
  sortBy?: 'createdAt' | 'likeCount' | 'viewCount' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  authorType?: 'authenticated' | 'anonymous';
}

export interface IdeaResponse {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  authorType: 'authenticated' | 'anonymous';
  authorId?: {
    _id: string;
    username: string;
    email: string;
    createdAt: Date;
  };
  viewCount: number;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
}
