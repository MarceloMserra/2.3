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
  renderCarousel();
  renderEvents();
  renderGallery();
});

// --- Irmandade (Carrossel) - COM EFEITO COVERFLOW ---
async function renderCarousel() {
  const container = $("#irmandade-container");
  if (!container) return;
  const data = await getJSON("/_content/groups.json") || {};
  const list = asArray(data.groups) || [];
  if (!list.length) return;
  container.innerHTML = "";
  list.forEach((group) => {
    const name = pick(group, ["name", "nome"]);
    const emblem = pick(group, ["emblem", "logo"]);
    const slide = document.createElement('div');
    slide.className = "swiper-slide"; // Apenas a classe base é necessária aqui
    slide.innerHTML = `
      <div class="flex items-center justify-center h-full">
        <img src="${cloudAny(emblem, { w: 400 })}" alt="${name}" class="max-h-36 w-auto object-contain" title="${name}">
      </div>
    `;
    container.appendChild(slide);
  });

  // NOVA CONFIGURAÇÃO DO SWIPER COM EFEITO DE RODA 3D
  new Swiper('.irmandade-carousel', {
    effect: 'coverflow', // Ativa o efeito de "roda"
    grabCursor: true,    // Mostra a mãozinha ao passar o mouse
    centeredSlides: true,  // Garante que um slide fique sempre no centro
    slidesPerView: 'auto', // Deixa o Swiper calcular quantos slides cabem
    loop: true,            // Cria um loop infinito
    autoplay: {
      delay: 2500,         // Pausa de 2.5 segundos em cada brasão
      disableOnInteraction: false, // Não para ao ser tocado pelo usuário
    },
    coverflowEffect: {
      rotate: 50,       // Rotação dos slides laterais
      stretch: 0,
      depth: 100,       // Profundidade do efeito 3D
      modifier: 1,
      slideShadows: false, // Remove sombras desnecessárias
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
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