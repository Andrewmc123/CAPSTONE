// Shared formatting helpers (TikTok-style compact numbers & timestamps)

export function compact(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(num >= 10_000_000 ? 0 : 1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(num >= 10_000 ? 0 : 1).replace(/\.0$/, '') + 'K';
  return String(num);
}

export function timeAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso);
  const seconds = Math.max(1, Math.floor((Date.now() - then.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Splits a caption into text & clickable #hashtag segments
export function splitCaption(body) {
  const parts = [];
  const regex = /#(\w+)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(body || '')) !== null) {
    if (match.index > lastIndex) parts.push({ type: 'text', value: body.slice(lastIndex, match.index) });
    parts.push({ type: 'tag', value: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < (body || '').length) parts.push({ type: 'text', value: body.slice(lastIndex) });
  return parts;
}
