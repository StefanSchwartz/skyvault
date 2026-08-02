import { describe, it, expect } from 'vitest';
import { filterAndSortPosts } from './searchEngine';

describe('Search & Sorting Engine', () => {
  const posts = [
    {
      uri: 'uri-1',
      savedAt: '2026-08-01T10:00:00Z',
      author: { handle: 'charlie.bsky.social', displayName: 'Charlie' },
      record: { text: 'Learning AT Protocol development' }
    },
    {
      uri: 'uri-2',
      savedAt: '2026-07-15T10:00:00Z',
      author: { handle: 'alice.bsky.social', displayName: 'Alice' },
      record: { text: 'Beautiful sunset photo' },
      embed: { $type: 'app.bsky.embed.images#view', images: [{ fullsize: 'img.png' }] }
    }
  ];

  it('should filter posts by query matching text or handle', () => {
    const result = filterAndSortPosts(posts, { searchQuery: 'protocol', sortOrder: 'newest' });
    expect(result.length).toBe(1);
    expect(result[0].uri).toBe('uri-1');
  });

  it('should filter posts by media type', () => {
    const result = filterAndSortPosts(posts, { mediaFilter: 'images', sortOrder: 'newest' });
    expect(result.length).toBe(1);
    expect(result[0].uri).toBe('uri-2');
  });

  it('should sort posts reverse chronologically (newest first)', () => {
    const result = filterAndSortPosts(posts, { sortOrder: 'newest' });
    expect(result[0].uri).toBe('uri-1');
  });

  it('should sort posts chronologically (oldest first)', () => {
    const result = filterAndSortPosts(posts, { sortOrder: 'oldest' });
    expect(result[0].uri).toBe('uri-2');
  });

  it('should sort posts by author handle alphabetically', () => {
    const result = filterAndSortPosts(posts, { sortOrder: 'author' });
    expect(result[0].author.handle).toBe('alice.bsky.social');
  });
});
