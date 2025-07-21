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
