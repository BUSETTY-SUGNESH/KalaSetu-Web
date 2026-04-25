import { supabase } from './supabase';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const uuid = () => crypto.randomUUID();

const ensureArray = <T>(v: T | T[] | null | undefined): T[] =>
  Array.isArray(v) ? v : v ? [v] : [];

const throwIfError = <T>(result: { data: T; error: { message: string } | null }): T => {
  if (result.error) throw new Error(result.error.message);
  return result.data;
};

const currentUserId = async (): Promise<string> => {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user?.id;
  if (!id) throw new Error('Not authenticated');
  return id;
};

const currentArtistId = async (): Promise<string> => {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('Artist')
    .select('id')
    .eq('userId', userId)
    .single();
  if (error || !data) throw new Error('Artist profile not found');
  return data.id;
};

// ─── Route‑based compatibility layer ───────────────────────────────────────────
// Maps old Express API patterns to Supabase queries so consuming pages keep
// working unchanged.

type ApiResponse<T> = { data: T };
type Params = Record<string, string | number | boolean | undefined>;

const api = {
  async get<T = unknown>(
    url: string,
    config?: { params?: Params },
  ): Promise<ApiResponse<T>> {
    const p = config?.params ?? {};

    // ── Artworks ───────────────────────────────────────────────────────────
    if (url === '/artworks') {
      let q = supabase
        .from('Artwork')
        .select('*, artist:Artist(*, user:User(name, avatarUrl))')
        .eq('status', 'LISTED')
        .order('createdAt', { ascending: false });
      if (p.category) q = q.eq('category', String(p.category));
      if (p.search) q = q.ilike('title', `%${String(p.search)}%`);
      return { data: ensureArray(throwIfError(await q)) as unknown as T };
    }

    if (url === '/artworks/mine') {
      const artistId = await currentArtistId();
      const q = supabase
        .from('Artwork')
        .select('*')
        .eq('artistId', artistId)
        .order('createdAt', { ascending: false });
      return { data: ensureArray(throwIfError(await q)) as unknown as T };
    }

    if (url.match(/^\/artworks\/mine\/[^/]+$/)) {
      const id = url.split('/').pop()!;
      const q = supabase.from('Artwork').select('*').eq('id', id).single();
      return { data: throwIfError(await q) as unknown as T };
    }

    if (url.match(/^\/artworks\/[^/]+\/reviews$/)) {
      const id = url.split('/')[2];
      const q = supabase.from('ArtworkReview').select('*, user:User(name, avatarUrl)').eq('artworkId', id).order('createdAt', { ascending: false });
      return { data: ensureArray((await q).data ?? []) as unknown as T };
    }

    if (url.match(/^\/artworks\/[^/]+\/similar$/)) {
      const id = url.split('/')[2];
      const artRes = await supabase.from('Artwork').select('category').eq('id', id).single();
      if (artRes.error || !artRes.data) return { data: [] as unknown as T };
      const q = supabase.from('Artwork').select('*, artist:Artist(*, user:User(name, avatarUrl))').eq('status', 'LISTED').eq('category', artRes.data.category).neq('id', id).limit(6);
      return { data: ensureArray((await q).data ?? []) as unknown as T };
    }

    if (url === '/notifications') {
      const userId = await currentUserId();
      const q = supabase.from('Notification').select('*').eq('userId', userId).order('createdAt', { ascending: false }).limit(30);
      return { data: ensureArray((await q).data ?? []) as unknown as T };
    }

    if (url === '/notifications/unread-count') {
      const userId = await currentUserId();
      const q = supabase.from('Notification').select('id', { count: 'exact', head: true }).eq('userId', userId).eq('isRead', false);
      const res = await q;
      return { data: (res.count ?? 0) as unknown as T };
    }

    if (url.match(/^\/artworks\/[^/]+$/)) {
      const id = url.split('/').pop()!;
      const q = supabase
        .from('Artwork')
        .select('*, artist:Artist(*, user:User(name, avatarUrl))')
        .eq('id', id)
        .single();
      return { data: throwIfError(await q) as unknown as T };
    }

    // ── Users / Artists ────────────────────────────────────────────────────
    if (url === '/users/artists') {
      const q = supabase
        .from('Artist')
        .select('*, user:User(name, avatarUrl)')
        .eq('verificationStatus', 'APPROVED');
      const rows = throwIfError(await q) as Record<string, unknown>[];
      const mapped = (rows ?? []).map((a) => ({
        ...a,
        name: (a.user as { name?: string })?.name ?? '',
        avatarUrl: (a.user as { avatarUrl?: string })?.avatarUrl ?? undefined,
      }));
      return { data: mapped as unknown as T };
    }

    if (url.match(/^\/users\/artists\/[^/]+$/)) {
      const id = url.split('/').pop()!;
      const q = supabase
        .from('Artist')
        .select('*, user:User(name, avatarUrl, email), artworks:Artwork(*)')
        .eq('id', id)
        .single();
      const row = throwIfError(await q) as Record<string, unknown>;
      return {
        data: {
          ...row,
          name: (row.user as { name?: string })?.name ?? '',
          avatarUrl: (row.user as { avatarUrl?: string })?.avatarUrl ?? undefined,
        } as unknown as T,
      };
    }

    if (url === '/users/profile') {
      const userId = await currentUserId();
      const q = supabase
        .from('User')
        .select('*, wallet:Wallet(*), kyc:Kyc(*)')
        .eq('id', userId)
        .single();
      return { data: throwIfError(await q) as unknown as T };
    }

    if (url === '/users/profile/overview') {
      const userId = await currentUserId();
      const [userRes, walletRes, payRes, ordersRes, discRes] =
        await Promise.all([
          supabase.from('User').select('id, name, email, role, isVerified').eq('id', userId).single(),
          supabase.from('Wallet').select('*').eq('userId', userId).maybeSingle(),
          supabase.from('Payment').select('*').eq('userId', userId).order('createdAt', { ascending: false }).limit(20),
          supabase.from('Order').select('*, artwork:Artwork(id, title, status)').eq('buyerId', userId).order('createdAt', { ascending: false }),
          supabase.from('Discussion').select('id, title, body, createdAt').eq('authorId', userId).order('createdAt', { ascending: false }),
        ]);
      const walletData = walletRes.data;
      const walletId = walletData?.id;
      let txns: Record<string, unknown>[] = [];
      if (walletId) {
        const r = await supabase.from('WalletTransaction').select('*').eq('walletId', walletId).order('createdAt', { ascending: false }).limit(20);
        txns = r.data ?? [];
      }
      // Fetch user's own listings (only if artist)
      let listings: Record<string, unknown>[] = [];
      const artistRes = await supabase.from('Artist').select('id').eq('userId', userId).maybeSingle();
      if (artistRes.data?.id) {
        const lr = await supabase.from('Artwork').select('id, title, price, status, createdAt').eq('artistId', artistRes.data.id).order('createdAt', { ascending: false });
        listings = lr.data ?? [];
      }
      const orders = ordersRes.data ?? [];
      const totalEarnings = orders
        .filter((o: Record<string, unknown>) => o.status === 'DELIVERED' || o.status === 'COMPLETED')
        .reduce((s: number, o: Record<string, unknown>) => s + Number(o.totalAmount ?? 0), 0);
      return {
        data: {
          user: userRes.data,
          wallet: walletData,
          transactions: txns,
          payments: payRes.data ?? [],
          purchases: orders,
          listings,
          discussions: discRes.data ?? [],
          earnings: totalEarnings,
        } as unknown as T,
      };
    }

    if (url === '/users/dashboard-stats') {
      const [usersRes, ordersRes, artRes, bidsRes, ticketsRes, kycRes] = await Promise.all([
        supabase.from('User').select('id, role, isVerified, createdAt'),
        supabase.from('Order').select('id, totalAmount, status, createdAt, buyerId, artwork:Artwork(title)'),
        supabase.from('Artwork').select('id, status'),
        supabase.from('Bid').select('id, status').in('status', ['ACTIVE', 'UPCOMING']),
        supabase.from('SupportTicket').select('id, status').eq('status', 'OPEN'),
        supabase.from('Kyc').select('id, status').eq('status', 'PENDING'),
      ]);
      const users = usersRes.data ?? [];
      const orders = ordersRes.data ?? [];
      const arts = artRes.data ?? [];
      // Build usersByRole
      const roleCounts: Record<string, number> = {};
      users.forEach((u: Record<string, unknown>) => {
        const role = String(u.role ?? 'CUSTOMER');
        roleCounts[role] = (roleCounts[role] ?? 0) + 1;
      });
      const usersByRole = Object.entries(roleCounts).map(([role, count]) => ({ role, count }));
      return {
        data: {
          totalUsers: users.length,
          totalOrders: orders.length,
          totalArtworks: arts.length,
          totalRevenue: orders.reduce((s: number, o: Record<string, unknown>) => s + Number(o.totalAmount ?? 0), 0),
          activeBids: (bidsRes.data ?? []).length,
          openTickets: (ticketsRes.data ?? []).length,
          pendingKyc: (kycRes.data ?? []).length,
          usersByRole,
          recentUsers: users.slice(0, 10),
          recentOrders: orders.slice(0, 10),
        } as unknown as T,
      };
    }

    if (url === '/users/manager-stats') {
      const [ordersRes, artRes, bidsRes, ticketsRes, kycRes, pendingArtRes, pendingArtistRes] = await Promise.all([
        supabase.from('Order').select('id, totalAmount, status, createdAt, buyerId, artwork:Artwork(title)'),
        supabase.from('Artwork').select('id, status'),
        supabase.from('Bid').select('id, status').in('status', ['ACTIVE', 'UPCOMING']),
        supabase.from('SupportTicket').select('id, status').eq('status', 'OPEN'),
        supabase.from('Kyc').select('id, status').eq('status', 'PENDING'),
        supabase.from('Artwork').select('id, title, price, category, createdAt, artist:Artist(user:User(name))').eq('status', 'PENDING_REVIEW').order('createdAt', { ascending: false }).limit(10),
        supabase.from('Artist').select('id, specialty, verificationStatus, user:User(name, email)').eq('verificationStatus', 'PENDING').limit(10),
      ]);
      const orders = ordersRes.data ?? [];
      const arts = artRes.data ?? [];
      return {
        data: {
          totalOrders: orders.length,
          totalArtworks: arts.length,
          totalRevenue: orders.reduce((s: number, o: Record<string, unknown>) => s + Number(o.totalAmount ?? 0), 0),
          activeBids: (bidsRes.data ?? []).length,
          openTickets: (ticketsRes.data ?? []).length,
          pendingKyc: (kycRes.data ?? []).length,
          pendingArtworks: pendingArtRes.data ?? [],
          pendingArtists: pendingArtistRes.data ?? [],
          recentOrders: orders.slice(0, 10),
        } as unknown as T,
      };
    }

    // ── Bids ───────────────────────────────────────────────────────────────
    if (url === '/bids/active') {
      const q = supabase
        .from('Bid')
        .select('*, artwork:Artwork(*), artist:Artist(*, user:User(name))')
        .in('status', ['ACTIVE', 'UPCOMING'])
        .order('startsAt', { ascending: true });
      return { data: ensureArray(throwIfError(await q)) as unknown as T };
    }

    if (url.match(/^\/bids\/[^/]+$/) && !url.includes('/place')) {
      const id = url.split('/').pop()!;
      const q = supabase
        .from('Bid')
        .select('*, artwork:Artwork(*), artist:Artist(*, user:User(name)), participants:BidParticipant(*, user:User(id, name))')
        .eq('id', id)
        .single();
      return { data: throwIfError(await q) as unknown as T };
    }

    // ── Events ─────────────────────────────────────────────────────────────
    if (url === '/events') {
      let q = supabase.from('Event').select('*').order('startsAt', { ascending: true });
      if (p.type) q = q.eq('type', String(p.type));
      return { data: ensureArray(throwIfError(await q)) as unknown as T };
    }

    if (url.match(/^\/events\/[^/]+$/) && !url.includes('/my-registration') && !url.includes('/register')) {
      const id = url.split('/').pop()!;
      const q = supabase.from('Event').select('*').eq('id', id).single();
      return { data: throwIfError(await q) as unknown as T };
    }

    if (url.match(/^\/events\/[^/]+\/my-registration$/)) {
      const parts = url.split('/');
      const eventId = parts[2];
      const userId = await currentUserId();
      const q = supabase
        .from('EventRegistration')
        .select('*')
        .eq('eventId', eventId)
        .eq('userId', userId)
        .maybeSingle();
      return { data: (await q).data as unknown as T };
    }

    // ── Discussions ────────────────────────────────────────────────────────
    if (url === '/discussions') {
      let q = supabase
        .from('Discussion')
        .select('*, author:User(name, avatarUrl)');
      if (p.sort === 'trending') {
        q = q.order('upvotes', { ascending: false });
      } else {
        q = q.order('createdAt', { ascending: false });
      }
      const rows = throwIfError(await q) as Record<string, unknown>[];
      const mapped = (rows ?? []).map((d) => ({
        ...d,
        tags: Array.isArray(d.tags) ? d.tags : [],
        authorName: (d.author as { name?: string })?.name ?? 'Unknown',
        authorAvatar: (d.author as { avatarUrl?: string })?.avatarUrl ?? undefined,
      }));
      return { data: mapped as unknown as T };
    }

    if (url.match(/^\/discussions\/[^/]+$/) && !url.includes('/replies')) {
      const id = url.split('/').pop()!;
      const [discRes, repliesRes] = await Promise.all([
        supabase.from('Discussion').select('*, author:User(name, avatarUrl)').eq('id', id).single(),
        supabase.from('DiscussionReply').select('*, author:User(name, avatarUrl)').eq('discussionId', id).order('createdAt', { ascending: true }),
      ]);
      const disc = throwIfError(discRes) as Record<string, unknown>;
      return {
        data: {
          ...disc,
          tags: Array.isArray(disc.tags) ? disc.tags : [],
          authorName: (disc.author as { name?: string })?.name ?? 'Unknown',
          authorAvatar: (disc.author as { avatarUrl?: string })?.avatarUrl ?? undefined,
          replies: (repliesRes.data ?? []).map((r: Record<string, unknown>) => ({
            ...r,
            authorName: (r.author as { name?: string })?.name ?? 'Unknown',
            authorAvatar: (r.author as { avatarUrl?: string })?.avatarUrl ?? undefined,
          })),
        } as unknown as T,
      };
    }

    // ── Orders ─────────────────────────────────────────────────────────────
    if (url === '/orders/my') {
      const userId = await currentUserId();
      const q = supabase
        .from('Order')
        .select('*, artwork:Artwork(title)')
        .eq('buyerId', userId)
        .order('createdAt', { ascending: false });
      return { data: ensureArray(throwIfError(await q)) as unknown as T };
    }

    // ── Payments ───────────────────────────────────────────────────────────
    if (url === '/payments/my') {
      const userId = await currentUserId();
      const q = supabase
        .from('Payment')
        .select('*, order:Order(artwork:Artwork(title))')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });
      return { data: ensureArray(throwIfError(await q)) as unknown as T };
    }

    // ── Delivery ───────────────────────────────────────────────────────────
    if (url === '/delivery/my') {
      const userId = await currentUserId();
      const q = supabase
        .from('DeliveryAssignment')
        .select('*, order:Order(*, artwork:Artwork(title), buyer:User(name, phone))')
        .eq('deliveryUserId', userId)
        .order('createdAt', { ascending: false });
      return { data: ensureArray(throwIfError(await q)) as unknown as T };
    }

    // ── Support ────────────────────────────────────────────────────────────
    if (url.startsWith('/support/all')) {
      const urlObj = new URL(url, 'http://localhost');
      const status = urlObj.searchParams.get('status');
      let q = supabase
        .from('SupportTicket')
        .select('*, user:User(name), assignee:User(name), order:Order(status, totalAmount)')
        .order('createdAt', { ascending: false });
      if (status) q = q.eq('status', status);
      return { data: ensureArray(throwIfError(await q)) as unknown as T };
    }

    throw new Error(`Unhandled GET route: ${url}`);
  },

  // ── POST ───────────────────────────────────────────────────────────────────
  async post<T = unknown>(url: string, body?: Record<string, unknown>): Promise<ApiResponse<T>> {
    // ── Discussions ──────────────────────────────────────────────────────
    if (url === '/discussions') {
      const userId = await currentUserId();
      const q = supabase.from('Discussion').insert({
        id: uuid(),
        authorId: userId,
        title: body?.title,
        body: body?.body,
        artworkId: body?.artworkId || null,
        tags: body?.tags ?? [],
        upvotes: 0,
        replyCount: 0,
        isPinned: false,
        createdAt: new Date().toISOString(),
      }).select().single();
      return { data: throwIfError(await q) as unknown as T };
    }

    if (url.match(/^\/discussions\/[^/]+\/replies$/)) {
      const parts = url.split('/');
      const discussionId = parts[2];
      const userId = await currentUserId();
      const q = supabase.from('DiscussionReply').insert({
        id: uuid(),
        discussionId,
        authorId: userId,
        body: body?.body,
        upvotes: 0,
        createdAt: new Date().toISOString(),
      }).select().single();
      const reply = throwIfError(await q);
      const rpcResult = await supabase.rpc('increment_reply_count', { disc_id: discussionId });
      if (rpcResult.error) {
        // fallback: increment manually
        const r = await supabase.from('Discussion').select('replyCount').eq('id', discussionId).single();
        if (r.data) {
          await supabase.from('Discussion').update({ replyCount: (r.data.replyCount ?? 0) + 1 }).eq('id', discussionId);
        }
      }
      return { data: reply as unknown as T };
    }

    // ── Bids ────────────────────────────────────────────────────────────
    if (url === '/bids') {
      const artistId = await currentArtistId();
      const q = supabase.from('Bid').insert({
        id: uuid(),
        artworkId: body?.artworkId,
        artistId,
        startingPrice: Number(body?.startingPrice),
        minIncrement: Number(body?.minIncrement),
        currentHighest: Number(body?.startingPrice),
        startsAt: body?.startsAt,
        endsAt: body?.endsAt,
        status: 'UPCOMING',
      }).select().single();
      return { data: throwIfError(await q) as unknown as T };
    }

    if (url.match(/^\/bids\/[^/]+\/place$/)) {
      const parts = url.split('/');
      const bidId = parts[2];
      const userId = await currentUserId();
      const amount = Number(body?.amount);
      const bidRes = await supabase.from('Bid').select('currentHighest, minIncrement').eq('id', bidId).single();
      if (bidRes.error) throw new Error(bidRes.error.message);
      const bid = bidRes.data;
      if (amount < (bid.currentHighest ?? 0) + (bid.minIncrement ?? 0)) {
        throw new Error(`Bid must be at least ₹${(bid.currentHighest ?? 0) + (bid.minIncrement ?? 0)}`);
      }
      // Reset previous winning flags
      await supabase.from('BidParticipant').update({ isWinning: false }).eq('bidId', bidId);
      const insertRes = await supabase.from('BidParticipant').insert({
        id: uuid(),
        bidId, userId, amount, isWinning: true,
        placedAt: new Date().toISOString(),
      }).select().single();
      throwIfError(insertRes);
      await supabase.from('Bid').update({
        currentHighest: amount,
        currentWinnerId: userId,
      }).eq('id', bidId);
      return { data: insertRes.data as unknown as T };
    }

    // ── Events ──────────────────────────────────────────────────────────
    if (url.match(/^\/events\/[^/]+\/register$/)) {
      const parts = url.split('/');
      const eventId = parts[2];
      const userId = await currentUserId();
      const q = supabase.from('EventRegistration').insert({
        id: uuid(),
        eventId, userId, status: 'REGISTERED',
        registeredAt: new Date().toISOString(),
      }).select().single();
      return { data: throwIfError(await q) as unknown as T };
    }

    // ── Reviews ────────────────────────────────────────────────────────
    if (url.match(/^\/artworks\/[^/]+\/reviews$/)) {
      const artworkId = url.split('/')[2];
      const userId = await currentUserId();
      const existing = await supabase.from('ArtworkReview').select('id').eq('artworkId', artworkId).eq('userId', userId).maybeSingle();
      if (existing.data) throw new Error('You have already reviewed this artwork.');
      const q = supabase.from('ArtworkReview').insert({
        id: uuid(), artworkId, userId,
        rating: Number(body?.rating),
        comment: body?.comment || null,
        createdAt: new Date().toISOString(),
      }).select('*, user:User(name, avatarUrl)').single();
      return { data: throwIfError(await q) as unknown as T };
    }

    // ── Return Request ──────────────────────────────────────────────────
    if (url.match(/^\/orders\/[^/]+\/return$/)) {
      const orderId = url.split('/')[2];
      const userId = await currentUserId();
      const q = supabase.from('SupportTicket').insert({
        id: uuid(), userId, orderId,
        subject: `Return Request for Order #${orderId.slice(0, 8)}`,
        description: String(body?.reason || 'Customer requested return.'),
        status: 'OPEN',
        priority: 'HIGH',
        createdAt: new Date().toISOString(),
      }).select().single();
      return { data: throwIfError(await q) as unknown as T };
    }

    // ── Mark notification read ──────────────────────────────────────────
    if (url.match(/^\/notifications\/[^/]+\/read$/)) {
      const id = url.split('/')[2];
      const q = supabase.from('Notification').update({ isRead: true }).eq('id', id).select().single();
      return { data: throwIfError(await q) as unknown as T };
    }

    if (url === '/notifications/read-all') {
      const userId = await currentUserId();
      await supabase.from('Notification').update({ isRead: true }).eq('userId', userId).eq('isRead', false);
      return { data: null as unknown as T };
    }

    // ── Artworks ────────────────────────────────────────────────────────
    if (url === '/artworks') {
      const artistId = await currentArtistId();
      const images = body?.images;
      const q = supabase.from('Artwork').insert({
        id: uuid(),
        artistId,
        title: body?.title,
        description: body?.description,
        price: Number(body?.price),
        category: body?.category,
        medium: body?.medium,
        dimensions: body?.dimensions || null,
        images: Array.isArray(images) ? images : typeof images === 'string' ? images.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        status: 'PENDING_REVIEW',
        viewCount: 0,
        createdAt: new Date().toISOString(),
      }).select().single();
      return { data: throwIfError(await q) as unknown as T };
    }

    // ── Support ─────────────────────────────────────────────────────────
    if (url.match(/^\/support\/[^/]+\/assign$/)) {
      const parts = url.split('/');
      const ticketId = parts[2];
      const q = supabase.from('SupportTicket').update({
        assignedTo: body?.assigneeId as string,
        status: 'IN_PROGRESS',
        updatedAt: new Date().toISOString(),
      }).eq('id', ticketId).select().single();
      return { data: throwIfError(await q) as unknown as T };
    }

    // ── Payments (stub – requires Edge Function for Razorpay secret) ──
    if (url === '/payments/create-order' || url === '/payments/verify') {
      throw new Error(
        'Payment processing requires a server-side Supabase Edge Function. ' +
        'Configure Razorpay via Edge Functions to enable payments.',
      );
    }

    throw new Error(`Unhandled POST route: ${url}`);
  },

  // ── PUT ────────────────────────────────────────────────────────────────────
  async put<T = unknown>(url: string, body?: Record<string, unknown>): Promise<ApiResponse<T>> {
    if (url === '/users/profile') {
      const userId = await currentUserId();
      const q = supabase.from('User').update({
        name: body?.name,
        phone: body?.phone,
        avatarUrl: body?.avatarUrl,
        updatedAt: new Date().toISOString(),
      }).eq('id', userId).select().single();
      return { data: throwIfError(await q) as unknown as T };
    }

    if (url.match(/^\/artworks\/[^/]+\/approve$/)) {
      const id = url.split('/')[2];
      const q = supabase.from('Artwork').update({ status: 'LISTED' }).eq('id', id).select().single();
      return { data: throwIfError(await q) as unknown as T };
    }

    if (url.match(/^\/artworks\/[^/]+\/reject$/)) {
      const id = url.split('/')[2];
      const q = supabase.from('Artwork').update({ status: 'REMOVED' }).eq('id', id).select().single();
      return { data: throwIfError(await q) as unknown as T };
    }

    if (url.match(/^\/artworks\/[^/]+\/artist-verify$/)) {
      const id = url.split('/')[2];
      const q = supabase.from('Artist').update({ verificationStatus: 'APPROVED' }).eq('id', id).select().single();
      return { data: throwIfError(await q) as unknown as T };
    }

    if (url.match(/^\/artworks\/[^/]+$/)) {
      const id = url.split('/').pop()!;
      const images = body?.images;
      const q = supabase.from('Artwork').update({
        title: body?.title,
        description: body?.description,
        price: body?.price != null ? Number(body.price) : undefined,
        category: body?.category,
        medium: body?.medium,
        dimensions: body?.dimensions,
        images: Array.isArray(images) ? images : typeof images === 'string' ? images.split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
      }).eq('id', id).select().single();
      return { data: throwIfError(await q) as unknown as T };
    }

    throw new Error(`Unhandled PUT route: ${url}`);
  },

  // ── DELETE ─────────────────────────────────────────────────────────────────
  async delete<T = unknown>(url: string): Promise<ApiResponse<T>> {
    if (url.match(/^\/artworks\/[^/]+$/)) {
      const id = url.split('/').pop()!;
      const q = supabase.from('Artwork').delete().eq('id', id);
      throwIfError(await q);
      return { data: null as unknown as T };
    }

    throw new Error(`Unhandled DELETE route: ${url}`);
  },

  // ── PATCH ──────────────────────────────────────────────────────────────────
  async patch<T = unknown>(url: string, body?: Record<string, unknown>): Promise<ApiResponse<T>> {
    if (url.match(/^\/delivery\/[^/]+\/status$/)) {
      const parts = url.split('/');
      const id = parts[2];
      const status = body?.status as string;
      const extra: Record<string, unknown> = { status, updatedAt: new Date().toISOString() };
      if (status === 'PICKED_UP') extra.pickedUpAt = new Date().toISOString();
      if (status === 'DELIVERED') extra.deliveredAt = new Date().toISOString();
      const q = supabase.from('DeliveryAssignment').update(extra)
        .eq('id', id).select().single();
      return { data: throwIfError(await q) as unknown as T };
    }

    if (url.match(/^\/support\/[^/]+\/status$/)) {
      const parts = url.split('/');
      const id = parts[2];
      const status = body?.status as string;
      const extra: Record<string, unknown> = { status, updatedAt: new Date().toISOString() };
      if (status === 'RESOLVED') extra.resolvedAt = new Date().toISOString();
      const q = supabase.from('SupportTicket').update(extra)
        .eq('id', id).select().single();
      return { data: throwIfError(await q) as unknown as T };
    }

    throw new Error(`Unhandled PATCH route: ${url}`);
  },
};

/** Extract a human-readable error message. */
export const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong';
};

export default api;
