// import { updateIdea } from './idea.service';
import { CreateIdeaData, UpdateIdeaData, IdeaFilters } from './../types/idea.types';
import { PaginationOptions, PaginationResult, calculatePagination, getSkipValue } from './../utils/pagination.utils';
import { IIdea } from './../models/Idea.models';
import mongoose, { Mongoose } from "mongoose";
import { Idea } from "../models/Idea.models";
import { extractClientInfo } from '../utils/fingerprint.utils';
import { Request } from 'express';
import { buildQuery, buildSortOptions, checkForDuplicateIdea } from '../utils/idea.utils';
import { filter } from 'compression';

export const createIdea = async (ideaData: CreateIdeaData, req: Request): Promise<IIdea> => {
    const clientInfo = extractClientInfo(req);
    const ideaPayload: any = {
        title: ideaData.title.trim(),
        content: ideaData.content.trim(),
        tags: ideaData.tags?.filter(tag => tag.trim()) || [],
        authorType: ideaData.authorType,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        isPublic: true,
    }
    if (ideaData.authorType === 'authenticated' && ideaData.authorId) {
        ideaPayload.authorId = new mongoose.Types.ObjectId(ideaData.authorId);
    }
    else {
        ideaPayload.anonymousFingerPrint = clientInfo.fingerprint;
        ideaPayload.authorType = 'anonymous';
    }
    try {
        await checkForDuplicateIdea(ideaPayload);
    } catch (error: any) {
        console.error('Duplicate check failed:', error);
        throw new Error(error.message || 'Failed to check for duplicate ideas');
    }
    const idea = new Idea(ideaPayload);
    return await idea.save();

}

export const getIdeas = async (filter: IdeaFilters, pagination: PaginationOptions): Promise<PaginationResult<IIdea>> => {
    const query = buildQuery(filter);
    const sortOptions = buildSortOptions(filter.sortBy, filter.sortOrder);

    const [ideas, totalCount] = await Promise.all([
        Idea.find(query)
            .sort(sortOptions)
            .skip(getSkipValue(pagination.page, pagination.limit))
            .limit(pagination.limit)
            .populate('authorId', 'username email createdAt', 'User')
            .lean(),
        Idea.countDocuments(query)

    ]);
    const PaginationResult = calculatePagination(pagination.page, pagination.limit, totalCount);
    return {
        data: ideas as IIdea[],
        pagination: PaginationResult
    }

}


export const getIDeaById = async (ideaId: string, incrementView: boolean = true): Promise<IIdea | null> => {
    if (!mongoose.Types.ObjectId.isValid(ideaId)) {
        throw new Error("Incalid Idea ID format");

    }
    const idea = await Idea.findOne({
        _id: ideaId,
        isPublic: true
    }).populate('auhorId', 'username email createdAt', 'User');

    if (!idea) {
        return null;
    }

    if (incrementView) {
        setImmediate(() => {
            Idea.updateOne({
                _id: ideaId
            }, {
                $inc: { viewCount: 1 }
            }).catch(error => {
                console.error('error incrementing view count:', error);
            })
        })
    }
    return idea;
}
export const updateIdea = async (ideaId: string,
    updateData: UpdateIdeaData,
    userId?: string,
    isAdmin: boolean = false
): Promise<IIdea | null> => {
    if (!mongoose.Types.ObjectId.isValid(ideaId)) {
        throw new Error("INvalid idea ID fomrat");
    }

    const authQuery: any = { _id: ideaId, isPublic: true }
    if (!isAdmin) {
        if (userId) {
            authQuery.authorId = new mongoose.Types.ObjectId(userId);
        }
        else {
            throw new Error("Unauthorized cannot update idea");
        }
    }
    const updatePayload: any = {};
    if (updateData.title) {
        updatePayload.title = updateData.title.trim();
    }
    if (updateData.content) {
        updatePayload.content = updateData.content.trim();
    }
    if (updateData.tags !== undefined) {
        updatePayload.tags = updateData.tags.filter(tag => tag.trim());
    }
    const updatedIdea = await Idea.findOneAndUpdate(authQuery, { $set: updatePayload }, { new: true, runValidators: true }).populate('authorId', ' username email createdAt', 'User');

    return updatedIdea;

}

export const deleteIdea = async (ideaId: string, userId?: string, isAdmin: boolean = false): Promise<boolean> => {
    if (!mongoose.Types.ObjectId.isValid(ideaId)) {
        throw new Error("Invalid Idea ID format");

    }
    const authQuery: any = {
        _id: ideaId
    };
    if (!isAdmin) {
        if (userId) {
            authQuery.authorId = new mongoose.Types.ObjectId(userId);
        }
        else {
            throw new Error("Unauthorized : Cannot delete this idea");

        }
    }
    const result = await Idea.deleteOne(authQuery);
    return (result.deletedCount > 0);
}

export const getUserIdea = async (userId: string, pagination: PaginationOptions): Promise<PaginationResult<IIdea>> => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID format");
    }
    const query = {
        authorId: new mongoose.Types.ObjectId(userId),
        isPublic: true,
    }
    const [ideas, totalCount] = await Promise.all([Idea.find(query)
        .sort({ createdAt: -1 })
        .skip(getSkipValue(pagination.page, pagination.limit))
        .limit(pagination.limit)
        .lean(),
    Idea.countDocuments(query)
    ]);

    const paginatoinResult = calculatePagination(
        pagination.page,
        pagination.limit,
        totalCount
    )
    return {
         data : ideas as IIdea[],
         pagination: paginatoinResult
    }
}