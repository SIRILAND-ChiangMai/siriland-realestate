/* SIRILAND Professional 2026 - properties.js generator */
function sirilandGeneratePropertiesJs(properties) {
  return "const properties = " + JSON.stringify(properties || [], null, 2) + ";\n";
}
function sirilandGeneratePropertiesJson(properties) {
  return JSON.stringify(properties || [], null, 2);
}
