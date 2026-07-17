// Strip soup/protein/side mentions from a meal description so descriptions
// describe the base food, not fixed accompaniments (users pick those in the
// customizer).
const SOUP_WORDS = [
  "ewedu",
  "gbegiri",
  "egusi",
  "efo riro",
  "efo",
  "okro",
  "okra",
  "ogbono",
  "banga",
  "oha",
  "vegetable soup",
];

export function cleanMealDescription(desc: string | null | undefined): string {
  if (!desc) return "";
  let s = desc;
  // "served with X", "with X and Y", "and gbegiri", etc.
  s = s.replace(
    /\b(served\s+with|with|and)\s+([a-z ,&+]*?(ewedu|gbegiri|egusi|efo\s*riro|okro|okra|ogbono|banga|oha|stew|soup)[a-z ,&+]*)/gi,
    "",
  );
  // Any leftover standalone soup word
  const re = new RegExp(`\\b(${SOUP_WORDS.join("|")})\\b`, "gi");
  s = s.replace(re, "");
  // Cleanup punctuation
  s = s.replace(/\s*,\s*,+/g, ", ");
  s = s.replace(/\s{2,}/g, " ");
  s = s.replace(/\s+([.,;])/g, "$1");
  s = s.replace(/[,\s]+\./g, ".");
  s = s.replace(/^[\s,.-]+|[\s,-]+$/g, "");
  return s.trim();
}
