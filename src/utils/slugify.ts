/**
 * Turns arbitrary user input into a string safe to use as a Postgres
 * unquoted identifier (schema/table name): lowercase, [a-z0-9_] only,
 * never starting with a digit.
 */
export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!slug) {
    throw new Error("Cannot derive a schema name from an empty value");
  }

  return /^[0-9]/.test(slug) ? `_${slug}` : slug;
}
