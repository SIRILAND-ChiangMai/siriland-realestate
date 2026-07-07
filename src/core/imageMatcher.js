/* SIRILAND Professional 2026 - image path helper */
function sirilandSlugify(text) {
  return String(text || "property").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || "property";
}
function sirilandImagePath(propertyId, fileName, index) {
  const ext = String(fileName || "").toLowerCase().match(/\.(jpe?g|png|webp|gif)$/)?.[1]?.replace("jpeg", "jpg") || "jpg";
  return `images/${sirilandSlugify(propertyId)}-${index}.${ext}`;
}
