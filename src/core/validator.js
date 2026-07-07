/* SIRILAND Professional 2026 - property validation */
const SIRILAND_REQUIRED_LANGS = ["en", "th", "tr", "zh"];
function sirilandValidateProperty(property, allProperties = []) {
  const errors = [];
  const warnings = [];
  ["id", "title", "city", "type", "deal", "status", "price"].forEach((key) => {
    if (!property || !String(property[key] || "").trim()) errors.push(`${key} is required`);
  });
  const duplicates = allProperties.filter((p) => String(p.id) === String(property.id));
  if (duplicates.length > 1) errors.push(`Duplicate property ID: ${property.id}`);
  if (!Array.isArray(property.images) || property.images.length === 0) warnings.push("Property has no images");
  SIRILAND_REQUIRED_LANGS.forEach((lang) => {
    if (!property.descriptions || !String(property.descriptions[lang] || "").trim()) warnings.push(`Missing ${lang} description`);
  });
  return { ok: errors.length === 0, errors, warnings };
}
