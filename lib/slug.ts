/**
 * Derives a URL-safe project slug from a display name. Used for the live
 * preview in the Create Project dialog, so it must run on every keystroke and
 * tolerate partially typed input.
 *
 * Letters, digits and combining marks from any script are kept, so a name
 * written entirely in non-Latin characters (e.g. "東京") still yields a usable
 * slug instead of an empty string. ASCII input normalizes exactly as before:
 * Latin diacritics are folded away and every other character collapses to a
 * single hyphen.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    // Recompose so marks that survive the strip (Japanese dakuten, Hangul
    // jamo) rejoin their base character instead of being dropped below.
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}
