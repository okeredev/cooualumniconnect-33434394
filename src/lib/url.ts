// Normalize user-provided URLs so they always navigate externally instead of
// being treated as relative paths (e.g. "linkedin.com/in/foo" → "https://linkedin.com/in/foo").
export const normalizeUrl = (url?: string | null): string => {
  if (!url) return "#";
  const trimmed = url.trim();
  if (!trimmed) return "#";
  if (/^(https?:|mailto:|tel:|sms:)/i.test(trimmed)) return trimmed;
  // Strip leading slashes/at-signs that some users paste from social handles
  const cleaned = trimmed.replace(/^\/+/, "").replace(/^@/, "");
  return `https://${cleaned}`;
};
