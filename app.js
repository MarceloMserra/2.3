// ===================== Funções Utilitárias =====================
const $ = (sel) => document.querySelector(sel);
const asArray = (x) => (Array.isArray(x) ? x : x ? [x] : []);
const pick = (obj, keys, def = undefined) => {
  if (!obj) return def; for (const k of keys) if (obj[k] !== undefined) return obj[k]; return def;
};
async function getJSON(url) {
  try {
    const r = await fetch(url, { cache: "no-store" }); if (!r.ok) throw new Error(r.statusText); return await r.json();
  } catch (e) { console.warn("Falha ao buscar JSON:", url, e); return null; }
}

// ===================== Cloudinary =====================
const CLOUDINARY_CLOUD = "dae2wp1hy";
function cloudAny(url, { w = 800 } = {}) {
  if (!url || typeof url !== 'string') return '';
  const t = `f_auto,q_auto:best,e_brightness:20,dpr_auto,c_limit,w_${w}`;
  if (/^https?:\/\/res\.cloudinary\.com\//.test(url)) {
    const parts = url.split("/upload/");
    if (parts.length > 1) {
      if (/\b(c_|w_|h_)/.test(parts[1])) return url;
      return url.replace("/upload/", `/upload/${t}/`);
    }
  }
  const abs = new URL(url, window.location.origin).href;
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/fetch/${t}/${encodeURIComponent(abs)}`;
}

// ===================== Conteúdo Dinâmico =====================
document.addEventListener("DOMContentLoaded", () => {
  renderRingCarousel();
  renderEvents();
  renderGallery();
});

// --- Irmandade (Carrossel 3D com Início Aleatório) ---
async function renderRingCarousel() {
  const ringContainer = $("#ring-container");
  if (!ringContainer) return;

  const data = await getJSON("/_content/groups.json") || {};
  let list = asArray(data.groups) || []; // Usamos 'let' para poder modificar a lista
  if (list.length < 1) return;

  // ===== ADIÇÃO PARA INÍCIO ALEATÓRIO =====
  // Embaralha a lista de grupos usando o algoritmo Fisher-Yates
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  // ==========================================

  ringContainer.innerHTML = "";

  list.forEach(group => {
    const name = pick(group, ["name", "nome"]);
    const emblem = pick(group, ["emblem", "logo"]);
    const item = document.createElement('div');
    item.className = 'item';
    item.innerHTML = `<div class="badge"><img src="${cloudAny(emblem, { w: 300 })}" alt="${name}" title="${name}"></div>`;
    ringContainer.appendChild(item);
  });

  const items = [...ringContainer.querySelectorAll('.item')];
  const n = items.length;
  
  const rootStyle = getComputedStyle(document.documentElement);
  const itemWidth = parseInt(rootStyle.getPropertyValue('--w'));
  const itemGap = 40;

  const circumference = n * (itemWidth + itemGap);
  const newRadius = Math.max(250, circumference / (2 * Math.PI));

  document.documentElement.style.setProperty('--raio', `${newRadius}px`);
  
  ringContainer.style.transform = `translateZ(calc(${newRadius}px * -1.2))`;

  items.forEach((item, i) => {
    const angDeg = (360 / n) * i;
    item.style.transform = `rotateY(${angDeg}deg) translateZ(${newRadius}px)`;
  });
}

// --- Eventos (Cards) ---
async function renderEvents() {
  const container = $("#eventos-container");
  if (!container) return;
  const data = await getJSON("/_content/events.json") || {};
  const list = asArray(data.events) || [];
  if (!list.length) { container.innerHTML = `<p class="text-center text-gray-500">Nenhum evento disponível.</p>`; return; }
  container.innerHTML = "";
  list.forEach((event) => {
    const card = document.createElement('div');
    card.className = "rounded shadow bg-gray-900 border border-gray-800 overflow-hidden";
    const image = pick(event, ["image", "imagem"]);
    card.innerHTML = `
      <div class="overflow-hidden h-48 bg-gray-800 flex items-center justify-center">
        <img src="${cloudAny(image, { w: 800 })}" alt="Evento" class="w-full h-full object-contain">
      </div>
      <div class="p-4">
        <h3 class="text-lg font-bold">${pick(event, ["name", "titulo"], "Evento")}</h3>
        <p class="text-sm text-gray-300">${[pick(event, ["date", "data"], ""), pick(event, ["place", "local"], "")].filter(Boolean).join(" — ")}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

// --- Galeria (Cards dos Álbuns) ---
async function renderGallery() {
  const container = $("#galeria-container");
  if (!container) return;
  const data = await getJSON("/_content/galeria.json") || {};
  const albuns = asArray(data.albuns) || [];
  if (!albuns.length) { container.innerHTML = `<p class="text-center text-gray-400">Nenhum álbum publicado ainda.</p>`; return; }
  container.innerHTML = "";
  albuns.forEach((album, index) => {
    const card = document.createElement('a');
    card.href = `album.html?id=${index}`;
    card.className = "rounded-lg bg-gray-800 border border-gray-700 overflow-hidden shadow-lg block transform hover:scale-105 transition-transform duration-300";
    const capa = pick(album, ["capa", "cover"]);
    card.innerHTML = `
      <div class="overflow-hidden h-56 bg-gray-900 flex items-center justify-center">
        <img src="${cloudAny(capa, { w: 800 })}" alt="Capa" class="w-full h-full object-contain">
      </div>
      <div class="p-4">
        <h3 class="text-lg font-bold truncate">${pick(album, ["titulo", "title"], "Álbum")}</h3>
        <p class="text-sm text-gray-400">Clique para ver</p>
      </div>
    `;
    container.appendChild(card);
  });
}

// --- UI Básica ---
const menuToggle = $("#menuToggle");
const mobileMenu = $("#mobileMenu");
if (menuToggle && mobileMenu) {
  menuToggle.addEventListener("click", () => mobileMenu.classList.toggle("hidden"));
}