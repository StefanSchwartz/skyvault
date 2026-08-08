import { describe, it, expect, vi } from 'vitest';
import { fetchSavedPosts, fetchLikedPosts } from './atproto';

describe('ATProto Fetching Service', () => {
  it('fetchSavedPosts returns empty array when agent has no session', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await fetchSavedPosts(null);
    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith('[SkyVault Debug] fetchSavedPosts called without an active session');
    warnSpy.mockRestore();
  });

  it('fetchLikedPosts returns empty array when agent has no session', async () => {
    const result = await fetchLikedPosts(null);
    expect(result).toEqual([]);
  });

  it('fetchSavedPosts fetches and hydrates bookmarks with quote post enrichment', async () => {
    const mockAgent = {
      hasSession: true,
      session: { handle: 'alice.bsky.social', did: 'did:plc:alice' },
      api: {
        app: {
          bsky: {
            bookmark: {
              getBookmarks: vi.fn().mockResolvedValue({
                data: {
                  bookmarks: [
                    {
                      subject: { uri: 'at://did:plc:alice/app.bsky.feed.post/1' },
                      createdAt: '2026-08-01T12:00:00Z',
                      item: {
                        $type: 'app.bsky.feed.defs#postView',
                        uri: 'at://did:plc:alice/app.bsky.feed.post/1',
                        cid: 'cid1',
                        record: { text: 'Hello ATProto' },
                        embed: {
                          $type: 'app.bsky.embed.record#view',
                          record: { uri: 'at://did:plc:bob/app.bsky.feed.post/2' }
                        }
                      }
                    }
                  ],
                  cursor: null
                }
              })
            }
          }
        }
      },
      getPosts: vi.fn().mockResolvedValue({
        data: {
          posts: [
            {
              uri: 'at://did:plc:bob/app.bsky.feed.post/2',
              cid: 'cid2',
              author: { handle: 'bob.bsky.social' },
              record: { text: 'Quoted post content' }
            }
          ]
        }
      })
    };

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const posts = await fetchSavedPosts(mockAgent);

    expect(posts.length).toBe(1);
    expect(posts[0].bookmarkUri).toBe('at://did:plc:alice/app.bsky.feed.post/1');
    expect(posts[0].savedAt).toBe('2026-08-01T12:00:00Z');
    expect(posts[0].recordType).toBe('bookmark');
    expect(posts[0].quotedPost).toBeDefined();
    expect(posts[0].quotedPost.uri).toBe('at://did:plc:bob/app.bsky.feed.post/2');

    logSpy.mockRestore();
  });

  it('fetchLikedPosts fetches likes list, batch hydrates posts, and enriches quotes', async () => {
    const mockAgent = {
      hasSession: true,
      session: { handle: 'alice.bsky.social', did: 'did:plc:alice' },
      api: {
        com: {
          atproto: {
            repo: {
              listRecords: vi.fn().mockResolvedValue({
                data: {
                  records: [
                    {
                      uri: 'at://did:plc:alice/app.bsky.feed.like/rec1',
                      value: {
                        subject: { uri: 'at://did:plc:carol/app.bsky.feed.post/99' },
                        createdAt: '2026-08-02T10:00:00Z'
                      }
                    }
                  ],
                  cursor: null
                }
              })
            }
          }
        }
      },
      getPosts: vi.fn().mockResolvedValue({
        data: {
          posts: [
            {
              uri: 'at://did:plc:carol/app.bsky.feed.post/99',
              cid: 'cid99',
              record: { text: 'Liked post content' }
            }
          ]
        }
      })
    };

    const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const posts = await fetchLikedPosts(mockAgent);

    expect(posts.length).toBe(1);
    expect(posts[0].uri).toBe('at://did:plc:carol/app.bsky.feed.post/99');
    expect(posts[0].bookmarkUri).toBe('at://did:plc:alice/app.bsky.feed.like/rec1');
    expect(posts[0].savedAt).toBe('2026-08-02T10:00:00Z');
    expect(posts[0].recordType).toBe('like');

    groupSpy.mockRestore();
    groupEndSpy.mockRestore();
    logSpy.mockRestore();
  });
});
