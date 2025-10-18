/**
 * Generate a SEO-friendly ID from product name, category, and ID
 * Example: "Chanel No 5" + "Women" + "abc123" -> "chanel-no-5-women-abc123"
 */
export function generateFriendlyId(name: string, category: string | null, id: string): string {
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  const namePart = slugify(name);
  const categoryPart = category ? slugify(category) : '';
  const idPart = id.slice(-8); // Use last 8 characters of ID for uniqueness

  // Combine parts: name-category-id or name-id if no category
  if (categoryPart) {
    return `${namePart}-${categoryPart}-${idPart}`;
  }
  return `${namePart}-${idPart}`;
}

/**
 * Extract the actual ID from a friendly ID
 * Example: "chanel-no-5-women-abc123" -> "abc123" (last segment)
 */
export function extractIdFromFriendlyId(friendlyId: string): string {
  const parts = friendlyId.split('-');
  return parts[parts.length - 1];
}

