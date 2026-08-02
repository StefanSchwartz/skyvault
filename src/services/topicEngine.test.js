import { describe, it, expect } from 'vitest';
import { classifyPostAuto, getPostAllTopics, groupPostsByAuthor, groupPostsByTopic } from './topicEngine';

describe('Topic Engine', () => {
  it('should auto-classify dev/code posts correctly', () => {
    const post = {
      uri: 'at://did:plc:1/app.bsky.feed.post/1',
      record: { text: 'Building a new open source #react application in TypeScript!' }
    };
    const topics = classifyPostAuto(post);
    expect(topics).toContain('dev');
  });

  it('should auto-classify art posts correctly', () => {
    const post = {
      uri: 'at://did:plc:1/app.bsky.feed.post/2',
      record: { text: 'Check out my new digital illustration created in Blender! #art' }
    };
    const topics = classifyPostAuto(post);
    expect(topics).toContain('art');
  });

  it('should group posts by author', () => {
    const posts = [
      { uri: '1', author: { handle: 'alice.bsky.social' } },
      { uri: '2', author: { handle: 'bob.bsky.social' } },
      { uri: '3', author: { handle: 'alice.bsky.social' } }
    ];
    const groups = groupPostsByAuthor(posts);
    expect(groups.length).toBe(2);
    expect(groups[0].author.handle).toBe('alice.bsky.social');
    expect(groups[0].posts.length).toBe(2);
  });

  it('should incorporate custom user tags into topic groups', () => {
    const posts = [
      { uri: 'post1', record: { text: 'Hello world' } }
    ];
    const customTagsMap = { post1: ['project-idea'] };
    const groups = groupPostsByTopic(posts, customTagsMap);

    const customGroup = groups.find(g => g.name === '#project-idea');
    expect(customGroup).toBeDefined();
    expect(customGroup.posts.length).toBe(1);
  });
});
