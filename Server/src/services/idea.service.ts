import { CreateIdeaData, UpdateIdeaData, IdeaFilters } from './../types/idea.types';
import mongoose from 'mongoose';
import { Idea, IIdea } from '../models/Idea.models';
import { PaginationOptions, PaginationResult, calculatePagination, getSkipValue } from '../utils/pagination.utils';
import { extractClientInfo } from '../utils/fingerprint.utils';
import { Request } from 'express';

class IdeaService {
  async createIdea(ideaData: CreateIdeaData, req: Request): Promise<IIdea> {
    try {
      const clientInfo = extractClientInfo(req);

      const ideaPayload: any = {
        title: ideaData.title.trim(),
        content: ideaData.content.trim(),
        tags: ideaData.tags?.filter(tag => tag.trim()) || [],
        authorType: ideaData.authorType,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        isPublic: true
      };

      if (ideaData.authorType === 'authenticated' && ideaData.authorId) {
        ideaPayload.authorId = new mongoose.Types.ObjectId(ideaData.authorId);
      } else {
        ideaPayload.anonymousFingerprint = clientInfo.fingerprint;
        ideaPayload.authorType = 'anonymous';
      }

      await this.checkForDuplicates(ideaPayload);

      const idea = new Idea(ideaPayload);
      return await idea.save();
    } catch (err) {
      console.error('Error in createIdea:', err);
      throw err;
    }
  }

  async getIdeas(
    filters: IdeaFilters,
    pagination: PaginationOptions
  ): Promise<PaginationResult<IIdea>> {
    try {
      const query = this.buildQuery(filters);
      const sortOptions = this.buildSortOptions(filters.sortBy, filters.sortOrder);

      const [ideas, totalCount] = await Promise.all([
        Idea.find(query)
          .sort(sortOptions)
          .skip(getSkipValue(pagination.page, pagination.limit))
          .limit(pagination.limit)
          .populate('authorId', 'username email createdAt', 'User')
          .lean(),
        Idea.countDocuments(query)
      ]);

      const paginationResult = calculatePagination(
        pagination.page,
        pagination.limit,
        totalCount
      );

      return {
        data: ideas as IIdea[],
        pagination: paginationResult
      };
    } catch (err) {
      console.error('Error in getIdeas:', err);
      throw err;
    }
  }

  async getIdeaById(ideaId: string, incrementView: boolean = true): Promise<IIdea | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(ideaId)) {
        throw new Error('Invalid idea ID format');
      }

      const idea = await Idea.findOne({
        _id: ideaId,
        isPublic: true
      }).populate('authorId', 'username email createdAt', 'User');

      if (!idea) return null;

      if (incrementView) {
        setImmediate(() => {
          Idea.updateOne(
            { _id: ideaId },
            { $inc: { viewCount: 1 } }
          ).catch(error => {
            console.error('Error incrementing view count:', error);
          });
        });
      }

      return idea;
    } catch (err) {
      console.error('Error in getIdeaById:', err);
      throw err;
    }
  }

  async updateIdea(
    ideaId: string,
    updateData: UpdateIdeaData,
    userId?: string,
    isAdmin: boolean = false
  ): Promise<IIdea | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(ideaId)) {
        throw new Error('Invalid idea ID format');
      }

      const authQuery: any = { _id: ideaId, isPublic: true };

      if (!isAdmin) {
        if (userId) {
          authQuery.authorId = new mongoose.Types.ObjectId(userId);
        } else {
          throw new Error('Unauthorized: Cannot update this idea');
        }
      }

      const updatePayload: any = {};
      if (updateData.title) updatePayload.title = updateData.title.trim();
      if (updateData.content) updatePayload.content = updateData.content.trim();
      if (updateData.tags !== undefined) {
        updatePayload.tags = updateData.tags.filter(tag => tag.trim());
      }

      const updatedIdea = await Idea.findOneAndUpdate(
        authQuery,
        { $set: updatePayload },
        { new: true, runValidators: true }
      ).populate('authorId', 'username email createdAt', 'User');

      return updatedIdea;
    } catch (err) {
      console.error('Error in updateIdea:', err);
      throw err;
    }
  }

  async deleteIdea(
    ideaId: string,
    userId?: string,
    isAdmin: boolean = false
  ): Promise<boolean> {
    try {
      if (!mongoose.Types.ObjectId.isValid(ideaId)) {
        throw new Error('Invalid idea ID format');
      }

      const authQuery: any = { _id: ideaId };

      if (!isAdmin) {
        if (userId) {
          authQuery.authorId = new mongoose.Types.ObjectId(userId);
        } else {
          throw new Error('Unauthorized: Cannot delete this idea');
        }
      }

      const result = await Idea.deleteOne(authQuery);
      return result.deletedCount > 0;
    } catch (err) {
      console.error('Error in deleteIdea:', err);
      throw err;
    }
  }

  async getUserIdeas(
    userId: string,
    pagination: PaginationOptions
  ): Promise<PaginationResult<IIdea>> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format');
      }

      const query = {
        authorId: new mongoose.Types.ObjectId(userId),
        isPublic: true
      };

      const [ideas, totalCount] = await Promise.all([
        Idea.find(query)
          .sort({ createdAt: -1 })
          .skip(getSkipValue(pagination.page, pagination.limit))
          .limit(pagination.limit)
          .lean(),
        Idea.countDocuments(query)
      ]);

      const paginationResult = calculatePagination(
        pagination.page,
        pagination.limit,
        totalCount
      );

      return {
        data: ideas as IIdea[],
        pagination: paginationResult
      };
    } catch (err) {
      console.error('Error in getUserIdeas:', err);
      throw err;
    }
  }

  private buildQuery(filters: IdeaFilters): any {
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
  }

  private buildSortOptions(
    sortBy: string = 'createdAt',
    sortOrder: string = 'desc'
  ): any {
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    if (sortBy !== 'createdAt') {
      sortOptions.createdAt = -1;
    }

    return sortOptions;
  }

  private async checkForDuplicates(ideaPayload: any): Promise<void> {
    try {
      const duplicateQuery: any = {
        title: ideaPayload.title,
        createdAt: {
          $gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      };

      if (ideaPayload.authorId) {
        duplicateQuery.authorId = ideaPayload.authorId;
      } else {
        duplicateQuery.anonymousFingerprint = ideaPayload.anonymousFingerprint;
      }

      const existingIdea = await Idea.findOne(duplicateQuery);
      if (existingIdea) {
        throw new Error('Similar idea already posted recently. Please wait before posting again.');
      }
    } catch (err) {
      console.error('Error in checkForDuplicates:', err);
      throw err;
    }
  }
}

export const ideaService = new IdeaService();
