import { IdeaFilters } from './../types/idea.types';
import { Idea } from '../models/Idea.models';
export const checkForDuplicateIdea = async (ideaPayload: any): Promise<void> => {
  const duplicateQuery: any = {
    title: ideaPayload.title,
    createdAt: {
      $gte: new Date(Date.now() - 60 * 60 * 1000) // within last 1 hour
    }
  };

  if (ideaPayload.authorId) {
    duplicateQuery.authorId = ideaPayload.authorId;
  } else {
    duplicateQuery.anonymousFingerprint = ideaPayload.anonymousFingerprint;
  }

  const existingIdea = await Idea.findOne(duplicateQuery);
  if (existingIdea) {
    throw new Error(
      'Similar idea already posted recently. Please wait before posting again.'
    );
  }
};

export const buildQuery = (filters: IdeaFilters): any => {
  const query: any = { isPublic: true };

  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }

  if (filters.authorType) {
    query.authorType = filters.authorType;
  }

  return query;
};

export const buildSortOptions = (
  sortBy: string = 'createdAt',
  sortOrder: string = 'desc'
): any => {
  const sortOptions: any = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
  
  if (sortBy !== 'createdAt') {
    sortOptions.createdAt = -1;
  }

  return sortOptions;
};




