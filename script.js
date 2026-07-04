let galleryImages = [];
let galleryIndex = 0;

function getImages(p) {
  if (Array.isArray(p.images) && p.images.length > 0) {
    return p.images;
  }
  if (p.image) {
    return [p.image];
  }
  return [];
}

function propertyImageHTML(p, index) {
  const imgs = getImages(p);

  if (imgs.length > 0) {
    return `
      <div class="photo-wrap" onclick="openGallery(${index}, 0)">
        <img 
          class="property-photo" 
          src="${imgs[0]}" 
          alt="${p.title}" 
          loading="lazy"
          onerror="this.parentElement.innerHTML='<div class=&quot;card-img&quot;>${p.label || p.type}</div>'"
        >
        <span class="photo-count">📸 ${imgs.length}</span>
      </div>
    `;
  }

  return `<div class="card-img">${p.label || p.type}</div>`;
}

function renderProperties() {
  const city = document.getElementById("cityFilter").value;
  const type = document.getElementById("typeFilter").value;
  const deal = document.getElementById("dealFilter").value;
  const search = document.getElementById("searchInput").value.toLowerCase();

  const filtered = properties.filter(p =>
    (city === "all" || p.city === city) &&
    (type === "all" || p.type === type) &&
    (deal === "all" || p.deal === deal) &&
    (
      p.title.toLowerCase().includes(search) ||
      p.description.toLowerCase().includes(search)
    )
  );

  const grid = document.getElementById("propertyGrid");

  if (!filtered.length) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;font-weight:bold;">No properties found.</p>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const realIndex = properties.indexOf(p);

    return `
      <article class="card">
        ${propertyImageHTML(p, realIndex)}

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
    `;
  }).join("");
}

function openGallery(propertyIndex, startIndex) {
  galleryImages = getImages(properties[propertyIndex]);

  if (!galleryImages.length) return;

  galleryIndex = startIndex || 0;
  updateGallery();

  document.getElementById("galleryModal").classList.remove("hidden");
}

function closeGallery() {
  document.getElementById("galleryModal").classList.add("hidden");
}

function updateGallery() {
  document.getElementById("galleryImage").src = galleryImages[galleryIndex];
  document.getElementById("galleryCounter").textContent =
    `${galleryIndex + 1} / ${galleryImages.length}`;
}

function nextImage() {
  if (!galleryImages.length) return;

  galleryIndex = (galleryIndex + 1) % galleryImages.length;
  updateGallery();
}

function prevImage() {
  if (!galleryImages.length) return;

  galleryIndex = (galleryIndex - 1 + galleryImages.length) % galleryImages.length;
  updateGallery();
}

document.addEventListener("DOMContentLoaded", () => {
  ["cityFilter", "typeFilter", "dealFilter", "searchInput"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", renderProperties);
  });

  renderProperties();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeGallery();
  if (e.key === "ArrowRight") nextImage();
  if (e.key === "ArrowLeft") prevImage();
});
