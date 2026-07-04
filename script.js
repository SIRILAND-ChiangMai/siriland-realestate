let currentLang = "en";

function propertyImageHTML(p) {
  if (p.image) {
    return `
      <img 
        class="property-photo" 
        src="${p.image}" 
        alt="${p.title}" 
        loading="lazy"
        onerror="this.parentElement.innerHTML='<div class=&quot;card-img&quot;>${p.label || p.type}</div>'"
      >
    `;
  }

  return `<div class="card-img">${p.label || p.type}</div>`;
}

function renderProperties() {
  const city = document.getElementById("cityFilter").value;
  const type = document.getElementById("typeFilter").value;
  const deal = document.getElementById("dealFilter").value;
  const search = document.getElementById("searchInput").value.toLowerCase();

  const filtered = properties.filter(p => {
    return (city === "all" || p.city === city) &&
           (type === "all" || p.type === type) &&
           (deal === "all" || p.deal === deal) &&
           (
             p.title.toLowerCase().includes(search) ||
             p.description.toLowerCase().includes(search)
           );
  });

  const grid = document.getElementById("propertyGrid");

  if (!filtered.length) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;font-weight:bold;">No properties found.</p>`;
    return;
  }

  grid.innerHTML = filtered.map(p => `
    <article class="card">
      <div class="photo-wrap">
        ${propertyImageHTML(p)}
      </div>

      <div class="card-content">
        <div class="meta">${p.city} • ${p.type} • ${p.deal}</div>
        <h3>${p.title}</h3>
        <div class="price">${p.price}</div>
        <p>${p.description}</p>

        <div class="chips">
          <span>${p.size}</span>
          <span>${p.bedrooms}</span>
        </div>

        <div class="card-actions">
          <a class="mini-btn goldmini" href="${p.map}" target="_blank">Google Maps</a>
          <a class="mini-btn" href="https://line.me/R/ti/p/@realcreamthailand" target="_blank">LINE</a>
        </div>
      </div>
    </article>
  `).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  ["cityFilter", "typeFilter", "dealFilter", "searchInput"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", renderProperties);
  });

  renderProperties();
});
