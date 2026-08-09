import { describe, it, expect } from 'vitest';
import {
  classifyPostAuto,
  getPostAllTopics,
  groupPostsByAuthor,
  groupPostsByTopic,
  tokenize,
  stemWord,
  extractKeyphrases,
  computeCorpusTfIdf,
  clusterUnmatchedPosts,
  matchKeywordRule
} from './topicEngine';

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

  it('should avoid false positives for AI in words like contained, main, email, domain', () => {
    const postContained = { record: { text: 'This feature is contained within the main folder.' } };
    const postEmail = { record: { text: 'Please check your email for the domain update.' } };

    expect(classifyPostAuto(postContained)).not.toContain('dev');
    expect(classifyPostAuto(postEmail)).not.toContain('dev');
    expect(classifyPostAuto(postContained)).toContain('general');
  });

  it('should correctly match Generative AI and AI as dev topic', () => {
    const postGenAI = { record: { text: 'Excited about the future of Generative AI tools!' } };
    const postAI = { record: { text: 'New AI models are revolutionizing software development.' } };

    expect(classifyPostAuto(postGenAI)).toContain('dev');
    expect(classifyPostAuto(postAI)).toContain('dev');
  });

  it('should avoid false positives for Art in words like smart, article, earth, party', () => {
    const postArticle = { record: { text: 'Read a smart article about earth and green energy.' } };
    expect(classifyPostAuto(postArticle)).not.toContain('art');
  });

  it('should perform stemming and tokenize text cleanly', () => {
    expect(tokenize('Hello world! Check https://example.com @user')).toEqual(['hello', 'world', 'check']);
    expect(stemWord('developers')).toBe('develop');
    expect(stemWord('illustrations')).toBe('illustra');
    expect(stemWord('contained')).toBe('contain');
    expect(stemWord('ai')).toBe('ai');
  });

  it('should extract keyphrases using TF-IDF weighting', () => {
    const posts = [
      { uri: '1', record: { text: 'Quantum computing breakthroughs in physics research labs' } },
      { uri: '2', record: { text: 'Quantum computing models and quantum physics experiments' } },
      { uri: '3', record: { text: 'Baking delicious sourdough bread at home' } }
    ];

    const keyphrases = extractKeyphrases(posts[0].record.text, 3, posts);
    expect(keyphrases.some(k => k.includes('quantum') || k.includes('physics'))).toBe(true);
  });

  it('should perform automatic fallback dynamic topic clustering for unmatched posts', () => {
    const posts = [
      { uri: 'p1', record: { text: 'Baking sourdough bread at home with fresh sourdough starter' } },
      { uri: 'p2', record: { text: 'Sourdough bread recipe tips for beginner sourdough bakers' } },
      { uri: 'p3', record: { text: 'Just walking outside enjoying the morning sunshine' } }
    ];

    const groups = groupPostsByTopic(posts);
    const sourdoughGroup = groups.find(g => g.id.startsWith('cluster:') || g.name.toLowerCase().includes('sourdough'));
    expect(sourdoughGroup).toBeDefined();
    expect(sourdoughGroup.posts.length).toBe(2);

    const generalGroup = groups.find(g => g.id === 'general');
    expect(generalGroup).toBeDefined();
    expect(generalGroup.posts.length).toBe(1);
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
