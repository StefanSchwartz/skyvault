import React, { useState } from 'react';
import { RichText } from './RichText';
import { useBookmarks } from '../context/BookmarkContext';
import { getPostAllTopics } from '../services/topicEngine';
import { Heart, Repeat, MessageSquare, BookmarkCheck, Plus, ExternalLink, User as UserIcon } from 'lucide-react';

/**
 * Extracts and normalizes image objects from any Bluesky embed structure
 * (e.g. app.bsky.embed.images#view, recordWithMedia#view, record blob CIDs).
 */
export function extractPostImages(post) {
  if (!post) return [];
  const images = [];
  const authorDid = post.author?.did || '';

  const processImgObj = (img) => {
    if (!img) return;
    let thumb = img.thumb;
    let fullsize = img.fullsize;
    const alt = img.alt || 'Bluesky post media';

    // If thumb/fullsize missing, check for blob image ref or CID
    const cid = img.image?.ref?.$link || img.image?.cid || img.cid;
    if ((!thumb || !fullsize) && cid && authorDid) {
      if (!thumb) thumb = `https://cdn.bsky.app/img/feed_thumbnail/plain/${authorDid}/${cid}@jpeg`;
      if (!fullsize) fullsize = `https://cdn.bsky.app/img/feed_fullsize/plain/${authorDid}/${cid}@jpeg`;
    }

    if (thumb || fullsize) {
      images.push({
        thumb: thumb || fullsize,
        fullsize: fullsize || thumb,
        alt
      });
    }
  };

  // 1. Direct app.bsky.embed.images#view
  if (post.embed?.images && Array.isArray(post.embed.images)) {
    post.embed.images.forEach(processImgObj);
  }

  // 2. app.bsky.embed.recordWithMedia#view (media inside quote posts)
  if (post.embed?.media?.images && Array.isArray(post.embed.media.images)) {
    post.embed.media.images.forEach(processImgObj);
  }

  // 3. Record level fallback post.record.embed.images
  if (images.length === 0 && post.record?.embed?.images && Array.isArray(post.record.embed.images)) {
    post.record.embed.images.forEach(processImgObj);
  }

  return images;
}

export function PostCard({ post }) {
  const { handleUnsavePost, setTagModalPost, customTags } = useBookmarks();
  const [isConfirmingUnsave, setIsConfirmingUnsave] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [quoteAvatarFailed, setQuoteAvatarFailed] = useState(false);

  const { author, record, embed, savedAt, replyCount, repostCount, likeCount, recordType, quotedPost } = post;
  const createdAt = record?.createdAt || savedAt;
  const postText = record?.text || '';
  const facets = record?.facets || [];

  const isBookmark = recordType === 'bookmark';
  const { autoTopicIds, customTags: postCustomTags } = getPostAllTopics(post, customTags);

  // Extract all normalized images for this post
  const postImages = extractPostImages(post);
  const quoteImages = quotedPost ? extractPostImages(quotedPost) : [];

  // Format relative timestamp
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getBlueskyPostUrl = () => {
    if (!post.uri || !author?.handle) return '#';
    const rkey = post.uri.split('/').pop();
    return `https://bsky.app/profile/${author.handle}/post/${rkey}`;
  };

  return (
    <article className="post-card">
      {/* Author Header */}
      <header className="post-header">
        <a
          href={`https://bsky.app/profile/${author?.handle || ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="author-avatar-link"
        >
          {author?.avatar && !avatarFailed ? (
            <img
              src={author.avatar}
              alt={author?.displayName || author?.handle}
              className="author-avatar"
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <div className="author-avatar-fallback">
              <UserIcon size={22} />
            </div>
          )}
        </a>

        <div className="author-info">
          <div className="author-title-row">
            <span className="author-name">{author?.displayName || author?.handle || 'Bluesky User'}</span>
            <span className="author-handle">@{author?.handle || 'user'}</span>
            <span className="bullet-separator">•</span>
            <a
              href={getBlueskyPostUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="post-timestamp"
              title={new Date(createdAt).toLocaleString()}
            >
              {formatTime(createdAt)}
            </a>
            <span className={`source-type-badge ${isBookmark ? 'badge-bookmark' : 'badge-like'}`}>
              {isBookmark ? '🔖 Saved' : '❤️ Liked'}
            </span>
          </div>
        </div>

        {/* Source Badge & External Link */}
        <div className="post-header-actions">
          <a
            href={getBlueskyPostUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="bsky-external-link-btn"
            title="Open in Bluesky app"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="post-body">
        <RichText text={postText} facets={facets} />

        {/* Embedded Images */}
        {postImages.length > 0 && (
          <div className={`post-image-grid images-count-${Math.min(postImages.length, 4)}`}>
            {postImages.slice(0, 4).map((img, idx) => (
              <div
                key={idx}
                className="image-wrapper"
                onClick={() => setSelectedImage(img.fullsize || img.thumb)}
              >
                <img src={img.thumb || img.fullsize} alt={img.alt} loading="lazy" />
              </div>
            ))}
          </div>
        )}

        {/* Embedded External Link Card */}
        {embed && embed.$type === 'app.bsky.embed.external#view' && embed.external && (
          <a
            href={embed.external.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="external-link-card"
          >
            {embed.external.thumb && (
              <img src={embed.external.thumb} alt={embed.external.title} className="external-card-thumb" />
            )}
            <div className="external-card-content">
              <span className="external-card-domain">
                {new URL(embed.external.uri).hostname.replace(/^www\./, '')}
              </span>
              <h4 className="external-card-title">{embed.external.title}</h4>
              {embed.external.description && (
                <p className="external-card-description">{embed.external.description}</p>
              )}
            </div>
          </a>
        )}

        {/* Embedded Video */}
        {embed && embed.$type === 'app.bsky.embed.video#view' && (
          <div className="video-container">
            <video controls poster={embed.playlist || embed.thumbnail} className="post-video">
              <source src={embed.playlist} type="application/x-mpegURL" />
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {/* Full Hydrated Quote Post (1-level deep) */}
        {quotedPost && (
          <div className="quote-post-card">
            <div className="quote-header">
              {quotedPost.author?.avatar && !quoteAvatarFailed ? (
                <img
                  src={quotedPost.author.avatar}
                  alt={quotedPost.author?.handle}
                  className="quote-author-avatar"
                  onError={() => setQuoteAvatarFailed(true)}
                />
              ) : (
                <div className="quote-author-fallback">
                  <UserIcon size={14} />
                </div>
              )}
              <div className="quote-author-meta">
                <span className="quote-author-name">{quotedPost.author?.displayName || quotedPost.author?.handle || 'Bluesky User'}</span>
                <span className="quote-author-handle">@{quotedPost.author?.handle || 'user'}</span>
                <span className="bullet-separator">•</span>
                <span className="quote-time">{formatTime(quotedPost.record?.createdAt || quotedPost.indexedAt)}</span>
              </div>
            </div>

            <div className="quote-body">
              <RichText text={quotedPost.record?.text || quotedPost.text || quotedPost.value?.text || ''} facets={quotedPost.record?.facets || []} />

              {/* Quote Embed Images */}
              {quoteImages.length > 0 && (
                <div className="quote-image-grid">
                  {quoteImages.slice(0, 2).map((qImg, qIdx) => (
                    <img key={qIdx} src={qImg.thumb || qImg.fullsize} alt="Quoted post media" className="quote-embed-img" />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tags Section */}
      <div className="post-tags-container">
        {autoTopicIds.map(topicId => (
          <span key={`auto-${topicId}`} className="tag-pill tag-auto">
            {topicId}
          </span>
        ))}
        {postCustomTags.map(tag => (
          <span key={`custom-${tag}`} className="tag-pill tag-custom">
            #{tag}
          </span>
        ))}
        <button
          className="add-tag-btn"
          onClick={() => setTagModalPost(post)}
          title="Add custom tag to post"
        >
          <Plus size={13} /> Add Tag
        </button>
      </div>

      {/* Footer Actions & Stats */}
      <footer className="post-footer">
        <div className="metrics-group">
          <span className="metric-item" title="Replies">
            <MessageSquare size={16} />
            {replyCount || 0}
          </span>
          <span className="metric-item" title="Reposts">
            <Repeat size={16} />
            {repostCount || 0}
          </span>
          <span className="metric-item" title="Likes">
            <Heart size={16} />
            {likeCount || 0}
          </span>
        </div>

        {/* Unsave / Unlike Action Button */}
        <div className="unsave-container">
          {isConfirmingUnsave ? (
            <div className="unsave-confirm-actions">
              <span className="confirm-label">{isBookmark ? 'Remove saved bookmark?' : 'Unlike post?'}</span>
              <button
                className="confirm-yes-btn"
                onClick={() => {
                  setIsConfirmingUnsave(false);
                  handleUnsavePost(post);
                }}
              >
                Yes, Remove
              </button>
              <button
                className="confirm-no-btn"
                onClick={() => setIsConfirmingUnsave(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className={`unsave-btn ${isBookmark ? 'btn-unsave-bookmark' : 'btn-unlike'}`}
              onClick={() => setIsConfirmingUnsave(true)}
              title={isBookmark ? 'Remove from saved bookmarks' : 'Unlike post'}
            >
              {isBookmark ? <BookmarkCheck size={15} /> : <Heart size={15} />}
              <span>{isBookmark ? 'Saved' : 'Liked'}</span>
            </button>
          )}
        </div>
      </footer>

      {/* Image Lightbox Overlay */}
      {selectedImage && (
        <div className="lightbox-backdrop" onClick={() => setSelectedImage(null)}>
          <div className="lightbox-content">
            <img src={selectedImage} alt="Enlarged view" />
          </div>
        </div>
      )}
    </article>
  );
}
