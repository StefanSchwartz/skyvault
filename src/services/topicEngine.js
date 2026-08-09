/**
 * Topic Engine for SkyVault
 * Combines ML/NLP topic classification, TF-IDF keyphrase extraction,
 * word boundary tokenization, stemming, and fallback dynamic topic clustering.
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

export const KEYWORD_RULES = {
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

export const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s',
  'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself',
  'just', 'know', 'let\'s', 'like', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself',
  'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such',
  'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t',
  'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves',
  'http', 'https', 'com', 'org', 'net', 'www', 'amp', 'rt', 'via', 'check', 'out', 'new', 'building', 'built', 'post', 'posts', 'today'
]);

/**
 * Escapes regex special characters in a string.
 */
export function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Creates a strict word boundary Regex for a given keyword or multi-word phrase.
 */
export function createKeywordRegex(kw) {
  const escaped = escapeRegExp(kw);
  const startBoundary = /^\w/.test(kw) ? '\\b' : '';
  const endBoundary = /\w$/.test(kw) ? '\\b' : '';
  return new RegExp(`${startBoundary}${escaped}${endBoundary}`, 'i');
}

/**
 * Rule-based suffix stemmer for English words.
 */
export function stemWord(word) {
  if (!word || typeof word !== 'string') return '';
  let w = word.toLowerCase().trim();
  if (w.length <= 3) return w;

  if (w.endsWith('ing') && w.length > 5) w = w.slice(0, -3);
  else if (w.endsWith('ies') && w.length > 4) w = w.slice(0, -3) + 'y';
  else if (w.endsWith('ers') && w.length > 5) w = w.slice(0, -3);
  else if (w.endsWith('er') && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith('ors') && w.length > 5) w = w.slice(0, -3);
  else if (w.endsWith('or') && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith('tions') && w.length > 6) w = w.slice(0, -5);
  else if (w.endsWith('tion') && w.length > 5) w = w.slice(0, -4);
  else if (w.endsWith('es') && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) w = w.slice(0, -1);
  else if (w.endsWith('ed') && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith('ment') && w.length > 6) w = w.slice(0, -4);

  return w;
}

/**
 * Tokenizes text into normalized lower-case tokens, stripping URLs & mentions.
 */
export function tokenize(text = '') {
  if (!text) return [];
  const cleaned = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/@[\w.]+/gi, '')
    .replace(/[^a-z0-9\s]/gi, ' ');

  return cleaned.split(/\s+/).filter(Boolean);
}

/**
 * Extracts candidate unigram and bigram terms from text, skipping stopwords.
 */
export function extractCandidateTerms(text = '') {
  const rawTokens = tokenize(text);
  const candidateTerms = [];

  const filteredTokens = rawTokens.filter(t => !STOPWORDS.has(t) && t.length >= 2);

  for (const token of filteredTokens) {
    candidateTerms.push(token);
  }

  for (let i = 0; i < rawTokens.length - 1; i++) {
    const w1 = rawTokens[i];
    const w2 = rawTokens[i + 1];
    if (!STOPWORDS.has(w1) && !STOPWORDS.has(w2) && w1.length >= 2 && w2.length >= 2) {
      candidateTerms.push(`${w1} ${w2}`);
    }
  }

  return candidateTerms;
}

/**
 * Computes TF-IDF scores across a collection of posts.
 */
export function computeCorpusTfIdf(posts = []) {
  if (!Array.isArray(posts) || posts.length === 0) {
    return { idf: {}, docTfIdf: [] };
  }

  const numDocs = posts.length;
  const docTermFreqs = [];
  const docFreq = {};

  for (const post of posts) {
    const text = post.record?.text || post.text || '';
    const terms = extractCandidateTerms(text);
    const termCounts = {};
    const uniqueTermsInDoc = new Set();

    for (const term of terms) {
      termCounts[term] = (termCounts[term] || 0) + 1;
      uniqueTermsInDoc.add(term);
    }

    const totalTerms = terms.length || 1;
    const tfMap = {};
    for (const [term, count] of Object.entries(termCounts)) {
      tfMap[term] = count / totalTerms;
    }
    docTermFreqs.push(tfMap);

    for (const term of uniqueTermsInDoc) {
      docFreq[term] = (docFreq[term] || 0) + 1;
    }
  }

  const idfMap = {};
  for (const [term, df] of Object.entries(docFreq)) {
    idfMap[term] = Math.log((1 + numDocs) / (1 + df)) + 1;
  }

  const docTfIdf = docTermFreqs.map((tfMap) => {
    const scores = {};
    for (const [term, tf] of Object.entries(tfMap)) {
      scores[term] = tf * (idfMap[term] || 1);
    }
    return scores;
  });

  return { idf: idfMap, docTfIdf, docFreq };
}

/**
 * Extracts top keyphrases using TF-IDF weighting (if corpus provided) or term weighting.
 */
export function extractKeyphrases(text = '', topN = 5, corpusPosts = []) {
  if (!text) return [];

  const candidateTerms = extractCandidateTerms(text);
  if (candidateTerms.length === 0) return [];

  if (corpusPosts.length > 0) {
    const { idf } = computeCorpusTfIdf(corpusPosts);
    const termCounts = {};
    for (const term of candidateTerms) {
      termCounts[term] = (termCounts[term] || 0) + 1;
    }
    const total = candidateTerms.length;

    const scored = Object.entries(termCounts).map(([term, count]) => {
      const tf = count / total;
      const idfScore = idf[term] || (Math.log(1 + corpusPosts.length) + 1);
      const bigramBoost = term.includes(' ') ? 1.3 : 1.0;
      return { term, score: tf * idfScore * bigramBoost };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topN).map(item => item.term);
  } else {
    const termCounts = {};
    for (const term of candidateTerms) {
      termCounts[term] = (termCounts[term] || 0) + 1;
    }

    const scored = Object.entries(termCounts).map(([term, count]) => {
      const isBigram = term.includes(' ');
      const boost = isBigram ? 1.5 : 1.0;
      return { term, score: count * boost };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topN).map(item => item.term);
  }
}

/**
 * Checks if a post text matches a keyword, using word boundary regex or stemmed token match.
 */
export function matchKeywordRule(text, kw) {
  // 1. Strict regex word boundary check
  const regex = createKeywordRegex(kw);
  if (regex.test(text)) {
    return true;
  }

  // 2. Stemmed single-word match if kw is single word
  if (!kw.includes(' ')) {
    const stemmedKw = stemWord(kw);
    const tokens = tokenize(text);
    for (const token of tokens) {
      if (stemWord(token) === stemmedKw) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Auto-classifies a post based on its text, hashtags, and embed features.
 */
export function classifyPostAuto(post) {
  const text = (post.record?.text || post.text || '');
  const matchedTopics = new Set();

  // Check keyword rules against text with strict word boundaries and smart stemming
  for (const [topicKey, keywords] of Object.entries(KEYWORD_RULES)) {
    for (const kw of keywords) {
      if (matchKeywordRule(text, kw)) {
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
      ...autoTopicIds.map(id => {
        const catKey = id.toUpperCase();
        if (AUTO_TOPIC_CATEGORIES[catKey]) {
          return AUTO_TOPIC_CATEGORIES[catKey].name;
        }
        if (id.startsWith('cluster:')) {
          const name = id.replace('cluster:', '').replace(/_/g, ' ');
          return name.charAt(0).toUpperCase() + name.slice(1);
        }
        return id;
      }),
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

  return Array.from(groupsMap.values()).sort((a, b) => b.posts.length - a.posts.length);
}

/**
 * Helper to slugify a term for dynamic cluster IDs.
 */
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Helper to format cluster term as title string.
 */
function formatClusterName(text) {
  return text
    .split(/[\s_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Generates deterministic HSL color for dynamic clusters.
 */
function generateClusterColor(slug) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

/**
 * Performs dynamic fallback topic clustering on posts that do not match predefined topics.
 */
export function clusterUnmatchedPosts(unmatchedPosts) {
  if (!Array.isArray(unmatchedPosts) || unmatchedPosts.length === 0) {
    return new Map();
  }

  const postKeyphraseMap = new Map();
  const phraseDocCount = {};

  for (const post of unmatchedPosts) {
    const text = post.record?.text || post.text || '';
    const phrases = extractKeyphrases(text, 3, unmatchedPosts);
    postKeyphraseMap.set(post, phrases);

    const uniquePhrases = new Set(phrases);
    for (const phrase of uniquePhrases) {
      phraseDocCount[phrase] = (phraseDocCount[phrase] || 0) + 1;
    }
  }

  const clusterCandidates = Object.entries(phraseDocCount)
    .filter(([phrase, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1]);

  const clusterMap = new Map();

  if (clusterCandidates.length === 0) {
    return clusterMap;
  }

  const assignedPosts = new Set();

  for (const [phrase] of clusterCandidates) {
    const slug = slugify(phrase);
    const clusterId = `cluster:${slug}`;

    const matchingPosts = unmatchedPosts.filter(post => {
      if (assignedPosts.has(post)) return false;
      const text = post.record?.text || post.text || '';
      return matchKeywordRule(text, phrase);
    });

    if (matchingPosts.length >= 2) {
      clusterMap.set(clusterId, {
        id: clusterId,
        name: formatClusterName(phrase),
        icon: '🏷️',
        color: generateClusterColor(slug),
        isCustom: false,
        isDynamicCluster: true,
        posts: matchingPosts
      });

      for (const p of matchingPosts) {
        assignedPosts.add(p);
      }
    }
  }

  return clusterMap;
}

/**
 * Groups a collection of posts by Topic (predefined categories, custom tags, and dynamic topic clusters).
 */
export function groupPostsByTopic(posts, customTagsMap = {}) {
  const topicMap = new Map();
  const unmatchedPosts = [];

  for (const post of posts) {
    const autoTopicIds = classifyPostAuto(post);
    const customTags = customTagsMap[post.uri] || [];

    const isPredefinedMatch = autoTopicIds.some(id => id !== 'general');
    const hasCustomTags = customTags.length > 0;

    if (!isPredefinedMatch && !hasCustomTags) {
      unmatchedPosts.push(post);
      continue;
    }

    // Process matched auto-topic categories
    for (const topicId of autoTopicIds) {
      if (topicId === 'general') continue;

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

  // Fallback Dynamic Topic Clustering for unmatched posts
  if (unmatchedPosts.length > 0) {
    const dynamicClusters = clusterUnmatchedPosts(unmatchedPosts);
    const clusteredPostSet = new Set();

    for (const [clusterId, clusterObj] of dynamicClusters.entries()) {
      topicMap.set(clusterId, clusterObj);
      for (const p of clusterObj.posts) {
        clusteredPostSet.add(p);
      }
    }

    // Unclustered remaining posts go to General & Discussion
    const remainingGeneralPosts = unmatchedPosts.filter(p => !clusteredPostSet.has(p));
    if (remainingGeneralPosts.length > 0) {
      const genCat = AUTO_TOPIC_CATEGORIES.GENERAL;
      if (!topicMap.has(genCat.id)) {
        topicMap.set(genCat.id, {
          id: genCat.id,
          name: genCat.name,
          icon: genCat.icon,
          color: genCat.color,
          isCustom: false,
          posts: []
        });
      }
      topicMap.get(genCat.id).posts.push(...remainingGeneralPosts);
    }
  }

  // Sort groups by number of posts descending
  return Array.from(topicMap.values()).sort((a, b) => b.posts.length - a.posts.length);
}
