import { BskyAgent } from '@atproto/api';

/**
 * Creates and initializes a Bluesky Agent.
 */
export function createAgent(service = 'https://bsky.social') {
  return new BskyAgent({ service });
}

/**
 * Authenticates with Bluesky PDS using handle/email and App Password,
 * and fetches official user profile details (avatar, displayName).
 */
export async function loginWithAppPassword(identifier, password) {
  const cleanIdentifier = identifier.trim().replace(/^@/, '');
  const agent = createAgent();

  console.log('[SkyVault Auth] Initiating login for handle/email:', cleanIdentifier);
  const loginRes = await agent.login({
    identifier: cleanIdentifier,
    password: password.trim()
  });

  console.log('[SkyVault Auth] Login successful. DID:', loginRes.data.did, 'Handle:', loginRes.data.handle);

  let fullProfile = null;
  try {
    const profileRes = await agent.getProfile({ actor: loginRes.data.did });
    fullProfile = profileRes.data;
    console.log('[SkyVault Auth] User profile retrieved:', fullProfile);
  } catch (err) {
    console.warn('[SkyVault Auth] Failed to fetch full profile:', err.message);
  }

  const sessionData = {
    ...loginRes.data,
    avatar: fullProfile?.avatar || null,
    displayName: fullProfile?.displayName || loginRes.data.handle
  };

  return { agent, session: sessionData };
}

/**
 * Resumes an existing AT Protocol session and refreshes user profile.
 */
export async function resumeAgentSession(sessionData) {
  if (!sessionData) return null;
  try {
    const agent = createAgent(sessionData.service || 'https://bsky.social');
    await agent.resumeSession(sessionData);
    console.log('[SkyVault Auth] Resumed existing session for DID:', sessionData.did);

    try {
      const profileRes = await agent.getProfile({ actor: sessionData.did });
      agent.session.avatar = profileRes.data?.avatar || sessionData.avatar || null;
      agent.session.displayName = profileRes.data?.displayName || sessionData.displayName || sessionData.handle;
    } catch (e) {
      // keep existing session data if profile refresh fails
    }

    return agent;
  } catch (err) {
    console.warn('[SkyVault Auth] Session resumption failed:', err.message);
    return null;
  }
}

/**
 * Extracts quote post target URI from post embed structures.
 */
function extractQuotePostUri(post) {
  if (!post || !post.embed) return null;
  const embedType = post.embed.$type || '';
  if (embedType.includes('embed.record')) {
    if (post.embed.record?.uri) return post.embed.record.uri;
    if (post.embed.record?.record?.uri) return post.embed.record.record.uri;
  }
  return null;
}

/**
 * Given a list of hydrated postView objects, batch-fetches any quoted post
 * targets that aren't already hydrated in the embed.
 */
async function enrichWithQuotedPosts(agent, posts) {
  const quoteUrisNeeded = new Set();
  for (const post of posts) {
    const quoteUri = extractQuotePostUri(post);
    if (quoteUri && !post.embed?.record?.author) {
      // embed.record.author missing means the quoted post isn't fully hydrated
      quoteUrisNeeded.add(quoteUri);
    }
  }

  const quotedPostsMap = new Map();
  if (quoteUrisNeeded.size > 0) {
    const urisArr = Array.from(quoteUrisNeeded);
    console.log(`[SkyVault Hydrator] Fetching ${urisArr.length} quoted post(s) not yet hydrated`);
    const BATCH_SIZE = 25;
    for (let i = 0; i < urisArr.length; i += BATCH_SIZE) {
      try {
        const res = await agent.getPosts({ uris: urisArr.slice(i, i + BATCH_SIZE) });
        for (const qp of (res.data?.posts || [])) {
          quotedPostsMap.set(qp.uri, qp);
        }
      } catch (err) {
        console.warn('[SkyVault Hydrator] Failed to fetch quoted posts:', err.message);
      }
    }
  }

  return posts.map(post => {
    const quoteUri = extractQuotePostUri(post);
    const quotedPost = quoteUri
      ? (post.embed?.record?.author ? post.embed.record : quotedPostsMap.get(quoteUri)) || null
      : null;
    return { ...post, quotedPost };
  });
}

/**
 * Fetches SAVED POSTS (Bookmarks) using app.bsky.bookmark.getBookmarks.
 *
 * In the 0.20.x API, each bookmark item has:
 *   - item.subject  → { uri, cid } of the bookmarked record
 *   - item.item     → fully hydrated postView (or blockedPost / notFoundPost)
 *   - item.createdAt → when it was bookmarked
 */
export async function fetchSavedPosts(agent) {
  if (!agent?.hasSession) {
    console.warn('[SkyVault Debug] fetchSavedPosts called without an active session');
    return [];
  }

  // console.group('%c[SkyVault Debug] Fetching Saved Bookmarks', 'color: #3b82f6; font-size: 13px; font-weight: bold;');
  // console.log('Handle:', agent.session?.handle, '| DID:', agent.session?.did);

  const hydratedPosts = [];
  let cursor = undefined;
  let pageNum = 0;

  while (hydratedPosts.length < 500) {
    pageNum++;
    // console.log(`[SkyVault Debug] Requesting bookmarks page ${pageNum} (cursor: ${cursor || 'start'})...`);

    let res = null;
    try {
      // The correct call path in @atproto/api 0.20.x:
      // agent.api.app.bsky.bookmark.getBookmarks()
      res = await agent.api.app.bsky.bookmark.getBookmarks({ limit: 100, cursor });
      // console.log(`[SkyVault Debug] Page ${pageNum} raw response:`, res);
    } catch (err) {
      // console.error('[SkyVault Debug] getBookmarks call failed:', err.message, err);
      break;
    }

    if (!res?.data) {
      // console.warn('[SkyVault Debug] Response had no data object:', res);
      break;
    }

    const { bookmarks, cursor: nextCursor } = res.data;
    console.log(`[SkyVault Debug] Page ${pageNum}: received ${bookmarks?.length ?? 0} bookmark item(s), nextCursor:`, nextCursor);

    if (!Array.isArray(bookmarks) || bookmarks.length === 0) {
      // console.log('[SkyVault Debug] Empty bookmarks array — no more pages.');
      break;
    }

    for (let i = 0; i < bookmarks.length; i++) {
      const bm = bookmarks[i];
      // console.log(`[SkyVault Debug] Bookmark #${i + 1}:`, bm);

      // bm.item is the hydrated postView (or blockedPost / notFoundPost)
      const postView = bm.item;
      const itemType = postView?.$type || '';

      if (!postView || itemType.includes('notFoundPost') || itemType.includes('blockedPost')) {
        // console.warn(`  -> Bookmark #${i + 1} is ${itemType || 'missing'} — skipping`);
        continue;
      }

      // Attach bookmark-specific metadata to the post object
      hydratedPosts.push({
        ...postView,
        bookmarkUri: bm.subject?.uri || null,
        savedAt: bm.createdAt || new Date().toISOString(),
        recordType: 'bookmark'
      });
      // console.log(`  -> Added post: ${postView.uri}`);
    }

    if (!nextCursor) {
      // console.log('[SkyVault Debug] No nextCursor — reached last page.');
      break;
    }
    cursor = nextCursor;
  }

  // console.log(`[SkyVault Debug] Total bookmarks collected before quote enrichment: ${hydratedPosts.length}`);

  const enriched = await enrichWithQuotedPosts(agent, hydratedPosts);
  // console.log(`[SkyVault Debug] Final bookmark post count: ${enriched.length}`, enriched);
  console.groupEnd();

  return enriched;
}

/**
 * Fetches LIKED POSTS for the authenticated user via repo listRecords.
 */
export async function fetchLikedPosts(agent) {
  if (!agent?.hasSession) return [];

  console.group('%c[SkyVault Debug] Fetching Liked Posts', 'color: #ec4899; font-size: 13px; font-weight: bold;');

  let cursor = undefined;
  let pageNum = 0;
  let hydratedPosts = [];

  while (hydratedPosts.length < 500) {
    const rawLikes = [];
    pageNum++;
    console.log(`[SkyVault Debug] Requesting Liked Posts page ${pageNum} (cursor: ${cursor || 'start'})...`);

    let res = null;

    try {
      res = await agent.api.com.atproto.repo.listRecords({
        repo: agent.session.did,
        collection: 'app.bsky.feed.like',
        limit: 100,
        cursor: cursor
      });
      console.log('[SkyVault Debug] Likes listRecords response:', res?.data);
    } catch (err) {
      console.warn('[SkyVault Debug] Failed to fetch liked posts:', err);
    }

    if (!res?.data) {
      console.warn('[SkyVault Debug] Response had no data object:', res);
      break;
    }

    const { records, cursor: nextCursor } = res.data;
    console.log(`[SkyVault Debug] Page ${pageNum}: received ${records?.length ?? 0} Liked Post item(s), nextCursor:`, nextCursor);

    for (const rec of (records || [])) {
      const uri = rec.value?.subject?.uri;
      if (uri) {
        rawLikes.push({
          subjectUri: uri,
          recordUri: rec.uri,
          savedAt: rec.value?.createdAt || new Date().toISOString(),
          recordType: 'like'
        });
      }
    }

    if (rawLikes.length === 0) {
      console.groupEnd();
      return [];
    }

    // Batch hydrate liked post URIs
    const likedPostsMap = new Map();
    const BATCH_SIZE = 25;
    for (let i = 0; i < rawLikes.length; i += BATCH_SIZE) {
      const batch = rawLikes.slice(i, i + BATCH_SIZE).map(l => l.subjectUri);
      try {
        const res = await agent.getPosts({ uris: batch });
        for (const p of (res.data?.posts || [])) likedPostsMap.set(p.uri, p);
      } catch (err) {
        console.error('[SkyVault Debug] Failed to hydrate liked posts batch:', err);
      }
    }

    const hydratedLikes = rawLikes
      .map(item => {
        const post = likedPostsMap.get(item.subjectUri);
        if (!post) return null;
        return { ...post, bookmarkUri: item.recordUri, savedAt: item.savedAt, recordType: 'like' };
      })
      .filter(Boolean);

    hydratedPosts = hydratedPosts.concat(hydratedLikes);

    if (!nextCursor) {
      console.log('[SkyVault Debug] No nextCursor — reached last page.');
      break;
    }
    cursor = nextCursor;
  }

  const enriched = await enrichWithQuotedPosts(agent, hydratedPosts);
  console.log(`[SkyVault Debug] Final liked post count: ${enriched.length}`, enriched);
  console.groupEnd();

  return enriched;
}

/**
 * Removes a saved post record (Unsave bookmark or Unlike like record).
 */
export async function unsavePostRecord(agent, post) {
  if (!agent?.hasSession) throw new Error('Not authenticated');

  const { uri, bookmarkUri, recordType } = post;
  const targetRecordUri = bookmarkUri || uri;
  const rkey = targetRecordUri.split('/').pop();

  if (recordType === 'like' || targetRecordUri.includes('app.bsky.feed.like')) {
    await agent.api.com.atproto.repo.deleteRecord({
      repo: agent.session.did,
      collection: 'app.bsky.feed.like',
      rkey
    });
    return true;
  }

  // Bookmark deletion
  try {
    await agent.api.app.bsky.bookmark.deleteBookmark({ uri: targetRecordUri });
    return true;
  } catch (e) {
    console.warn('[SkyVault] deleteBookmark call failed, trying repo deleteRecord:', e.message);
    await agent.api.com.atproto.repo.deleteRecord({
      repo: agent.session.did,
      collection: 'app.bsky.bookmark.bookmark',
      rkey
    });
    return true;
  }
}
