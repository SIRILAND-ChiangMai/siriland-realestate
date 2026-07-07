/* SIRILAND Professional 2026 - Facebook text parser */
function sirilandPick(regex, text) { const match = String(text || "").match(regex); return match ? match[1].trim() : ""; }
function sirilandDetectCity(text) {
  if (/bangkok|bkk|sathorn|suanplu|rama|กรุงเทพ|สาทร/i.test(text)) return "Bangkok";
  if (/chiang mai|nimman|maya|เชียงใหม่|เจ็ดยอด/i.test(text)) return "Chiang Mai";
  if (/phichit|พิจิตร/i.test(text)) return "Phichit";
  if (/phitsanulok|พิษณุโลก/i.test(text)) return "Phitsanulok";
  return "";
}
function sirilandDetectType(text) {
  if (/condo|condominium|คอนโด/i.test(text)) return "Condo";
  if (/house|villa|บ้าน|pool villa/i.test(text)) return "House";
  if (/land|ที่ดิน|ไร่|งาน|ตารางวา/i.test(text)) return "Land";
  if (/commercial|shophouse|อาคารพาณิชย์|ตึก/i.test(text)) return "Commercial";
  return "";
}
function sirilandParseFacebookPost(text) {
  const title = String(text || "").split(/\n/).map(x => x.trim()).find(x => x.length > 8 && !/ราคา|price|tel|line|โทร|whatsapp|ติดต่อ/i.test(x)) || "New Property";
  return {
    title,
    city: sirilandDetectCity(text),
    type: sirilandDetectType(text),
    price: sirilandPick(/(?:price|ราคา|ขาย|เช่า|฿)\s*[:：]?\s*([0-9,.]+\s*(?:MB|M|ล้าน|บาท|THB|฿)?(?:\s*\/\s*month)?)/i, text) || sirilandPick(/([0-9,.]+\s*(?:MB|ล้าน|THB\/month|บาท\/เดือน|บาท))/i, text),
    area: sirilandPick(/([0-9,.]+\s*(?:sq\.?m\.?|sqm|ตร\.ม\.|ตารางเมตร|sq\.?w\.?|ตร\.ว\.|ไร่|งาน))/i, text),
    bedrooms: sirilandPick(/([0-9]+\s*(?:bedrooms?|bed room|br|นอน|ห้องนอน))/i, text),
    bathrooms: sirilandPick(/([0-9]+\s*(?:bathrooms?|bath room|ba|น้ำ|ห้องน้ำ))/i, text),
    map: sirilandPick(/(https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps|www\.google\.com\/maps)[^\s]+)/i, text),
  };
}
