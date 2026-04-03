import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../index';
import { AuthRequest } from '../../middleware/auth.middleware';
import { logError } from '../../utils/logger';

const createDiscussionSchema = z.object({
  title: z.string().min(3),
  body: z.string().min(5),
  artworkId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().min(1)).max(8).optional(),
});

export const createDiscussion = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = createDiscussionSchema.parse(req.body);

    if (payload.artworkId) {
      const artwork = await prisma.artwork.findUnique({
        where: { id: payload.artworkId },
        select: { id: true },
      });
      if (!artwork) {
        return res.status(400).json({ error: 'Invalid artwork reference' });
      }
    }

    const discussion = await prisma.discussion.create({
      data: {
        authorId: userId,
        title: payload.title.trim(),
        body: payload.body.trim(),
        artworkId: payload.artworkId || null,
        tags: (payload.tags || []).map((tag) => tag.trim()).filter(Boolean),
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

    res.status(201).json({
      id: discussion.id,
      authorId: discussion.authorId,
      authorName: discussion.author.name,
      authorAvatar: discussion.author.avatarUrl,
      title: discussion.title,
      body: discussion.body,
      artworkId: discussion.artworkId,
      tags: Array.isArray(discussion.tags) ? (discussion.tags as string[]) : [],
      upvotes: discussion.upvotes,
      replyCount: discussion.replyCount,
      isPinned: discussion.isPinned,
      createdAt: discussion.createdAt,
    });
  } catch (error: unknown) {
    logError('discussions.createDiscussion', error, { userId });
    const message = error instanceof Error ? error.message : 'Failed to create discussion';
    res.status(400).json({ error: message });
  }
};

export const getDiscussions = async (req: Request, res: Response) => {
  try {
    const sort = String(req.query.sort || 'trending').toLowerCase();
    const tag = req.query.tag ? String(req.query.tag) : undefined;

    const discussions = await prisma.discussion.findMany({
      include: {
        author: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy:
        sort === 'newest'
          ? {
              createdAt: 'desc',
            }
          : [
              {
                upvotes: 'desc',
              },
              {
                createdAt: 'desc',
              },
            ],
    });

    const mapped = discussions.map((discussion) => ({
      id: discussion.id,
      authorId: discussion.authorId,
      authorName: discussion.author.name,
      authorAvatar: discussion.author.avatarUrl,
      title: discussion.title,
      body: discussion.body,
      artworkId: discussion.artworkId,
      tags: Array.isArray(discussion.tags) ? (discussion.tags as string[]) : [],
      upvotes: discussion.upvotes,
      replyCount: discussion.replyCount,
      isPinned: discussion.isPinned,
      createdAt: discussion.createdAt,
    }));

    const filtered = tag ? mapped.filter((row) => row.tags.includes(tag)) : mapped;

    res.json(filtered);
  } catch (error: unknown) {
    logError('discussions.getDiscussions', error, { query: req.query });
    res.status(500).json({ error: 'Failed to fetch discussions' });
  }
};

export const getDiscussionById = async (req: Request, res: Response) => {
  const discussionId = String(req.params.id);

  try {
    const discussion = await prisma.discussion.findUnique({
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

    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    res.json({
      id: discussion.id,
      authorId: discussion.authorId,
      authorName: discussion.author.name,
      authorAvatar: discussion.author.avatarUrl,
      title: discussion.title,
      body: discussion.body,
      artworkId: discussion.artworkId,
      tags: Array.isArray(discussion.tags) ? (discussion.tags as string[]) : [],
      upvotes: discussion.upvotes,
      replyCount: discussion.replyCount,
      isPinned: discussion.isPinned,
      createdAt: discussion.createdAt,
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
    res.status(500).json({ error: 'Failed to fetch discussion' });
  }
};
