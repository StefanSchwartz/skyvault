import React from 'react';

/**
 * Parses and renders Bluesky RichText text with clickable links, hashtags, and mentions.
 * Uses post facets if available, or falls back to regex matching.
 */
export function RichText({ text = '', facets = [] }) {
  if (!text) return null;

  // If AT Protocol facets exist, sort them by byte index and render segments
  if (facets && facets.length > 0) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const bytes = encoder.encode(text);
    const sortedFacets = [...facets].sort((a, b) => a.index.byteStart - b.index.byteStart);

    const segments = [];
    let lastByteIndex = 0;

    for (let i = 0; i < sortedFacets.length; i++) {
      const facet = sortedFacets[i];
      const { byteStart, byteEnd } = facet.index;

      if (byteStart > lastByteIndex) {
        const plainText = decoder.decode(bytes.subarray(lastByteIndex, byteStart));
        segments.push(<span key={`plain-${lastByteIndex}`}>{plainText}</span>);
      }

      const facetText = decoder.decode(bytes.subarray(byteStart, byteEnd));
      const feature = facet.features?.[0];

      if (feature) {
        if (feature.$type === 'app.bsky.richtext.facet#link') {
          segments.push(
            <a
              key={`link-${byteStart}`}
              href={feature.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="rich-text-link"
              onClick={e => e.stopPropagation()}
            >
              {facetText}
            </a>
          );
        } else if (feature.$type === 'app.bsky.richtext.facet#tag') {
          segments.push(
            <span key={`tag-${byteStart}`} className="rich-text-hashtag">
              #{feature.tag || facetText.replace(/^#/, '')}
            </span>
          );
        } else if (feature.$type === 'app.bsky.richtext.facet#mention') {
          segments.push(
            <a
              key={`mention-${byteStart}`}
              href={`https://bsky.app/profile/${feature.did}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rich-text-mention"
              onClick={e => e.stopPropagation()}
            >
              {facetText}
            </a>
          );
        } else {
          segments.push(<span key={`feat-${byteStart}`}>{facetText}</span>);
        }
      } else {
        segments.push(<span key={`facet-${byteStart}`}>{facetText}</span>);
      }

      lastByteIndex = byteEnd;
    }

    if (lastByteIndex < bytes.length) {
      const remainingText = decoder.decode(bytes.subarray(lastByteIndex));
      segments.push(<span key={`plain-${lastByteIndex}`}>{remainingText}</span>);
    }

    return <p className="post-text">{segments}</p>;
  }

  // Regex fallback parser
  const parts = text.split(/(\s+)/);
  const elements = parts.map((part, index) => {
    if (part.startsWith('http://') || part.startsWith('https://')) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="rich-text-link"
          onClick={e => e.stopPropagation()}
        >
          {part.length > 35 ? part.slice(0, 32) + '...' : part}
        </a>
      );
    } else if (part.startsWith('#') && part.length > 1) {
      return (
        <span key={index} className="rich-text-hashtag">
          {part}
        </span>
      );
    } else if (part.startsWith('@') && part.length > 1) {
      return (
        <a
          key={index}
          href={`https://bsky.app/profile/${part.slice(1)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rich-text-mention"
          onClick={e => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });

  return <p className="post-text">{elements}</p>;
}
