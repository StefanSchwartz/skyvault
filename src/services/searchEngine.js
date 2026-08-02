import { getPostAllTopics } from './topicEngine';

/**
 * Filters and sorts saved posts based on search query, media type filter, active tag, and sort order.
 */
export function filterAndSortPosts(posts, { searchQuery, mediaFilter, activeTagFilter, sortOrder, customTagsMap }) {
  if (!posts || !Array.isArray(posts)) return [];

  const query = (searchQuery || '').trim().toLowerCase();

  const filtered = posts.filter(post => {
    // 1. Full-Text Search Query Filter
    if (query) {
      const text = (post.record?.text || '').toLowerCase();
      const authorHandle = (post.author?.handle || '').toLowerCase();
      const authorName = (post.author?.displayName || '').toLowerCase();
      const { allTags } = getPostAllTopics(post, customTagsMap);
      const tagsText = allTags.join(' ').toLowerCase();

      const matchesQuery =
        text.includes(query) ||
        authorHandle.includes(query) ||
        authorName.includes(query) ||
        tagsText.includes(query);

      if (!matchesQuery) return false;
    }

    // 2. Media Type Filter
    if (mediaFilter && mediaFilter !== 'all') {
      const embedType = post.embed?.$type || '';
      
      if (mediaFilter === 'images') {
        const isImageEmbed = embedType.includes('embed.images') || (post.embed?.images && post.embed.images.length > 0);
        if (!isImageEmbed) return false;
      } else if (mediaFilter === 'video') {
        const isVideoEmbed = embedType.includes('embed.video') || embedType.includes('embed.external') && post.embed?.external?.uri?.match(/\.(mp4|m3u8|webm)/);
        if (!isVideoEmbed) return false;
      } else if (mediaFilter === 'links') {
        const isLinkEmbed = embedType.includes('embed.external');
        if (!isLinkEmbed) return false;
      } else if (mediaFilter === 'quotes') {
        const isQuoteEmbed = embedType.includes('embed.record');
        if (!isQuoteEmbed) return false;
      } else if (mediaFilter === 'text_only') {
        if (post.embed) return false;
      }
    }

    // 3. Active Tag / Topic Filter
    if (activeTagFilter && activeTagFilter !== 'all') {
      const { autoTopicIds, customTags } = getPostAllTopics(post, customTagsMap);
      const normalizedActiveTag = activeTagFilter.toLowerCase().replace(/^#/, '');

      const matchesAutoTopic = autoTopicIds.includes(normalizedActiveTag);
      const matchesCustomTag = customTags.some(t => t.toLowerCase() === normalizedActiveTag);

      if (!matchesAutoTopic && !matchesCustomTag) return false;
    }

    return true;
  });

  // 4. Sorting
  return filtered.sort((a, b) => {
    const timeA = new Date(a.savedAt || a.indexedAt || a.record?.createdAt || 0).getTime();
    const timeB = new Date(b.savedAt || b.indexedAt || b.record?.createdAt || 0).getTime();

    if (sortOrder === 'oldest') {
      return timeA - timeB; // Chronological (oldest saved/posted first)
    } else if (sortOrder === 'author') {
      const handleA = (a.author?.handle || '').toLowerCase();
      const handleB = (b.author?.handle || '').toLowerCase();
      return handleA.localeCompare(handleB);
    } else {
      return timeB - timeA; // Reverse Chronological (newest saved/posted first, default)
    }
  });
}
