import { Response } from 'express';
import { prisma } from '../../index';
import { AuthRequest } from '../../middleware/auth.middleware';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      include: {
        artist: true,
        wallet: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    const user = await prisma.user.update({
      where: { id: req.user?.userId },
      data: {
        name: data.name,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
      },
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: 'Update failed' });
  }
};

export const getArtists = async (res: Response) => {
  try {
    const artists = await prisma.artist.findMany({
      include: {
        user: { select: { name: true, avatarUrl: true } }
      }
    });
    res.json(artists);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch artists' });
  }
};
