import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { AuthRequest } from '../../middleware/auth.middleware';
import { logError } from '../../utils/logger';
import {
  getErrorMessage,
  parsePagination,
  parseSort,
  parseSortOrder,
  parseUuidParam,
  sendError,
  sendSuccess,
} from '../../utils/http';

const createDiscussionSchema = z.object({
  title: z.string().min(3),
  body: z.string().min(5),
  artworkId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().min(1)).max(8).optional(),
});

const isMissingDiscussionArtworkIdColumnError = (error: unknown) => {
  const message = getErrorMessage(error, '');
  return message.includes('Discussion.artworkId') && message.includes('does not exist');
};

type DiscussionWithAuthor = {
  id: string;
  authorId: string;
  title: string;
  body: string;
  tags: unknown;
  upvotes: number;
  replyCount: number;
  isPinned: boolean;
  createdAt: Date;
  author: {
    name: string;
    avatarUrl: string | null;
  };
  artworkId?: string | null;
};

const mapDiscussionResponse = (discussion: DiscussionWithAuthor) => ({
  id: discussion.id,
  authorId: discussion.authorId,
  authorName: discussion.author.name,
  authorAvatar: discussion.author.avatarUrl,
  title: discussion.title,
  body: discussion.body,
  artworkId: typeof discussion.artworkId === 'string' ? discussion.artworkId : null,
  tags: Array.isArray(discussion.tags) ? (discussion.tags as string[]) : [],
  upvotes: discussion.upvotes,
  replyCount: discussion.replyCount,
  isPinned: discussion.isPinned,
  createdAt: discussion.createdAt,
});

export const createDiscussion = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, 401, 'Authentication required');
  }

  try {
    const payload = createDiscussionSchema.parse(req.body);
    const tags = (payload.tags || []).map((tag) => tag.trim()).filter(Boolean);

    if (payload.artworkId) {
      const artwork = await prisma.artwork.findUnique({
        where: { id: payload.artworkId },
        select: { id: true },
      });
      if (!artwork) {
        return sendError(res, 400, 'Invalid artwork reference');
      }
    }

    const baseData = {
      authorId: userId,
      title: payload.title.trim(),
      body: payload.body.trim(),
      tags,
    };

    let discussion: DiscussionWithAuthor;
    try {
      const created = await prisma.discussion.create({
        data: {
          ...baseData,
          artworkId: payload.artworkId || null,
        },
        include: {
          author: {
            select: {
              name: true,
              avatarUrl: true,
            },
          },
        },
      });
      discussion = created;
    } catch (createError: unknown) {
      if (!isMissingDiscussionArtworkIdColumnError(createError)) {
        throw createError;
      }

      const created = await prisma.discussion.create({
        data: baseData,
        select: {
          id: true,
          authorId: true,
          title: true,
          body: true,
          tags: true,
          upvotes: true,
          replyCount: true,
          isPinned: true,
          createdAt: true,
          author: {
            select: {
              name: true,
              avatarUrl: true,
            },
          },
        },
      });
      discussion = created;
    }

    return sendSuccess(res, mapDiscussionResponse(discussion), 'Discussion created', 201);
  } catch (error: unknown) {
    logError('discussions.createDiscussion', error, { userId });
    const message = getErrorMessage(error, 'Failed to create discussion');
    return sendError(res, 400, message, error);
  }
};

export const getDiscussions = async (req: Request, res: Response) => {
  try {
    const { limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const sort = parseSort(req.query.sort, ['createdAt', 'upvotes', 'trending', 'newest'], 'createdAt').toLowerCase();
    const sortOrder = parseSortOrder(req.query.order, 'desc');
    const tag = req.query.tag ? String(req.query.tag) : undefined;

    const orderBy =
      sort === 'upvotes' || sort === 'trending'
        ? [
            {
              upvotes: 'desc' as const,
            },
            {
              createdAt: 'desc' as const,
            },
          ]
        : {
            createdAt: sortOrder,
          };

    let discussions: DiscussionWithAuthor[];
    try {
      const rows = await prisma.discussion.findMany({
        include: {
          author: {
            select: {
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      });
      discussions = rows;
    } catch (queryError: unknown) {
      if (!isMissingDiscussionArtworkIdColumnError(queryError)) {
        throw queryError;
      }

      const rows = await prisma.discussion.findMany({
        select: {
          id: true,
          authorId: true,
          title: true,
          body: true,
          tags: true,
          upvotes: true,
          replyCount: true,
          isPinned: true,
          createdAt: true,
          author: {
            select: {
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      });
      discussions = rows;
    }

    const mapped = discussions.map((discussion) => mapDiscussionResponse(discussion));

    const filtered = tag ? mapped.filter((row) => row.tags.includes(tag)) : mapped;

    return sendSuccess(res, filtered || []);
  } catch (error: unknown) {
    logError('discussions.getDiscussions', error, { query: req.query });
    return sendError(res, 500, 'Failed to fetch discussions', error);
  }
};

export const getDiscussionById = async (req: Request, res: Response) => {
  const discussionId = parseUuidParam(req.params.id);
  if (!discussionId) {
    return sendError(res, 400, 'Invalid discussion id');
  }

  try {
    let discussion:
      | (DiscussionWithAuthor & {
          replies: Array<{
            id: string;
            authorId: string;
            body: string;
            upvotes: number;
            createdAt: Date;
            author: {
              name: string;
              avatarUrl: string | null;
            };
          }>;
        })
      | null = null;

    try {
      const row = await prisma.discussion.findUnique({
        where: { id: discussionId },
        include: {
          author: {
            select: {
              name: true,
              avatarUrl: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  name: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });
      discussion = row;
    } catch (queryError: unknown) {
      if (!isMissingDiscussionArtworkIdColumnError(queryError)) {
        throw queryError;
      }

      const row = await prisma.discussion.findUnique({
        where: { id: discussionId },
        select: {
          id: true,
          authorId: true,
          title: true,
          body: true,
          tags: true,
          upvotes: true,
          replyCount: true,
          isPinned: true,
          createdAt: true,
          author: {
            select: {
              name: true,
              avatarUrl: true,
            },
          },
          replies: {
            select: {
              id: true,
              authorId: true,
              body: true,
              upvotes: true,
              createdAt: true,
              author: {
                select: {
                  name: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });
      discussion = row;
    }

    if (!discussion) {
      return sendError(res, 404, 'Discussion not found');
    }

    return sendSuccess(res, {
      ...mapDiscussionResponse(discussion),
      replies: discussion.replies.map((reply) => ({
        id: reply.id,
        authorId: reply.authorId,
        authorName: reply.author.name,
        authorAvatar: reply.author.avatarUrl,
        body: reply.body,
        upvotes: reply.upvotes,
        createdAt: reply.createdAt,
      })),
    });
  } catch (error: unknown) {
    logError('discussions.getDiscussionById', error, { discussionId });
    return sendError(res, 500, 'Failed to fetch discussion', error);
  }
};
