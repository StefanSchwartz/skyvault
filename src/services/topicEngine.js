/**
 * Topic Engine for SkyVault
 * Combines NLP keyword heuristics + domain analysis + custom user tagging.
 */

export const AUTO_TOPIC_CATEGORIES = {
  DEV: { id: 'dev', name: 'Technology & Code', icon: '💻', color: 'hsl(215, 85%, 60%)' },
  ART: { id: 'art', name: 'Art & Design', icon: '🎨', color: 'hsl(330, 85%, 60%)' },
  NEWS: { id: 'news', name: 'News & Society', icon: '📰', color: 'hsl(38, 95%, 55%)' },
  SCIENCE: { id: 'science', name: 'Science & Nature', icon: '🔬', color: 'hsl(160, 75%, 45%)' },
  GAMING: { id: 'gaming', name: 'Gaming & Media', icon: '🎮', color: 'hsl(270, 80%, 65%)' },
  LINKS: { id: 'links', name: 'Links & Articles', icon: '🔗', color: 'hsl(190, 85%, 50%)' },
  GENERAL: { id: 'general', name: 'General & Discussion', icon: '💬', color: 'hsl(220, 20%, 60%)' }
};

const KEYWORD_RULES = {
  dev: [
    'code', 'coding', 'github', 'developer', 'dev', 'javascript', 'typescript', 'python',
    'react', 'vue', 'node', 'rust', 'golang', 'ai', 'llm', 'machine learning', 'gpt',
    'claude', 'software', 'api', 'web', 'database', 'frontend', 'backend', 'css', 'html',
    'linux', 'git', 'open source', 'algorithm', 'vibe'
  ],
  art: [
    'art', 'artist', 'artwork', 'illustration', 'illustrator', 'drawing', 'design',
    'ui', 'ux', 'typography', 'render', 'blender', '3d', 'animation', 'photography',
    'photo', 'sketch', 'digital art', 'paint', 'painting', 'concept art'
  ],
  news: [
    'news', 'politics', 'political', 'election', 'policy', 'government', 'economy',
    'journalism', 'journalists', 'congress', 'senate', 'supreme court', 'law', 'climate policy',
    'democracy', 'president'
  ],
  science: [
    'science', 'space', 'astronomy', 'nasa', 'physics', 'quantum', 'biology', 'climate',
    'nature', 'research', 'paper', 'university', 'study', 'telescope', 'jwst', 'mars'
  ],
  gaming: [
    'game', 'gaming', 'gamedev', 'gamer', 'steam', 'nintendo', 'playstation', 'xbox',
    'movie', 'cinema', 'film', 'music', 'album', 'song', 'tv', 'anime', 'manga', 'trailer'
  ]
};

/**
 * Auto-classifies a post based on its text, hashtags, and embed features.
 */
export function classifyPostAuto(post) {
  const text = (post.record?.text || '').toLowerCase();
  const hashtags = extractHashtags(text);
  const matchedTopics = new Set();

  // Check keyword rules against text and hashtags
  for (const [topicKey, keywords] of Object.entries(KEYWORD_RULES)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        matchedTopics.add(topicKey);
        break;
      }
    }
  }

  // Check external embeds for link categorization
  if (post.embed && post.embed.$type === 'app.bsky.embed.external#view') {
    matchedTopics.add('links');
  }

  // Default to General if no specific topic matched
  if (matchedTopics.size === 0) {
    matchedTopics.add('general');
  }

  return Array.from(matchedTopics);
}

/**
 * Extracts hashtags from post text.
 */
export function extractHashtags(text) {
  const hashtagRegex = /#([\w\d_]+)/g;
  const matches = [];
  let match;
  while ((match = hashtagRegex.exec(text)) !== null) {
    matches.push(match[1].toLowerCase());
  }
  return matches;
}

/**
 * Gets all topics for a post, combining auto-classified categories and custom user tags.
 */
export function getPostAllTopics(post, customTagsMap = {}) {
  const autoTopicIds = classifyPostAuto(post);
  const customTags = customTagsMap[post.uri] || [];

  return {
    autoTopicIds,
    customTags,
    allTags: [
      ...autoTopicIds.map(id => AUTO_TOPIC_CATEGORIES[id.toUpperCase()]?.name || id),
      ...customTags
    ]
  };
}

/**
 * Groups a collection of posts by Author handle.
 */
export function groupPostsByAuthor(posts) {
  const groupsMap = new Map();

  for (const post of posts) {
    const handle = post.author?.handle || 'unknown';
    if (!groupsMap.has(handle)) {
      groupsMap.set(handle, {
        author: post.author,
        posts: []
      });
    }
    groupsMap.get(handle).posts.push(post);
  }

  // Sort groups by total posts descending
  return Array.from(groupsMap.values()).sort((a, b) => b.posts.length - a.posts.length);
}

/**
 * Groups a collection of posts by Topic (both auto-topics and custom tags).
 */
export function groupPostsByTopic(posts, customTagsMap = {}) {
  const topicMap = new Map();

  for (const post of posts) {
    const { autoTopicIds, customTags } = getPostAllTopics(post, customTagsMap);

    // Process auto-topic categories
    for (const topicId of autoTopicIds) {
      const cat = AUTO_TOPIC_CATEGORIES[topicId.toUpperCase()] || {
        id: topicId,
        name: topicId,
        icon: '🏷️',
        color: 'hsl(210, 30%, 50%)'
      };
      if (!topicMap.has(cat.id)) {
        topicMap.set(cat.id, {
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          isCustom: false,
          posts: []
        });
      }
      topicMap.get(cat.id).posts.push(post);
    }

    // Process custom user tags
    for (const customTag of customTags) {
      const tagId = `custom:${customTag.toLowerCase()}`;
      if (!topicMap.has(tagId)) {
        topicMap.set(tagId, {
          id: tagId,
          name: `#${customTag}`,
          icon: '🏷️',
          color: 'hsl(280, 70%, 60%)',
          isCustom: true,
          posts: []
        });
      }
      topicMap.get(tagId).posts.push(post);
    }
  }

  // Sort groups by number of posts descending
  return Array.from(topicMap.values()).sort((a, b) => b.posts.length - a.posts.length);
}
