// ===================== utils =====================
const $ = (sel) => document.querySelector(sel);

async function getJSON(url) {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(r.statusText);
    return await r.json();
  } catch (e) {
    console.warn("Falha ao buscar JSON:", url, e);
    return null;
  }
}
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}
const asArray = (x) => (Array.isArray(x) ? x : x ? [x] : []);
const pick = (obj, keys, def = undefined) => {
  if (!obj) return def;
  for (const k of keys) if (obj[k] !== undefined) return obj[k];
  return def;
};

// ===================== Cloudinary (fetch) =====================
const CLOUDINARY_CLOUD = "dae2wp1hy";

const isCloudinary = (url) => /^https?:\/\/res\.cloudinary\.com\//.test(url || "");
function cloudPortrait(url, { w = 1000 } = {}) {
  if (!url || !isCloudinary(url)) return url;
  const parts = url.split("/upload/");
  if (parts.length > 1) {
    const firstSeg = (parts[1] || "").split("/")[0];
    const hasTransforms = /\b(c_|w_|h_|ar_|g_|z_)/.test(firstSeg);
    if (hasTransforms) return url;
  }
  const t = `f_auto,q_auto,dpr_auto,c_fill,g_auto:subject,w_${w}`;
  return url.replace("/upload/", `/upload/${t}/`);
}
function cloudAny(url, { w = 1000 } = {}) {
  if (!url) return url;
  if (isCloudinary(url)) return cloudPortrait(url, { w });
  const abs = new URL(url, window.location.origin).href;
  const t = `f_auto,q_auto,dpr_auto,c_fill,g_auto:subject,w_${w}`;
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/fetch/${t}/${encodeURIComponent(abs)}`;
}

// ===================== UI básica =====================
const menuToggle = $("#menuToggle");
const mobileMenu = $("#mobileMenu");
if (menuToggle && mobileMenu) {
  menuToggle.addEventListener("click", () => mobileMenu.classList.toggle("hidden"));
}
const scrollToTopBtn = document.querySelector(".scroll-to-top");
if (scrollToTopBtn) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) scrollToTopBtn.classList.remove("hidden");
    else scrollToTopBtn.classList.add("hidden");
  }, { passive: true });
  scrollToTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

// ===================== boot =====================
document.addEventListener("DOMContentLoaded", async () => {
  await renderIrmandade();
  await renderEventos();
  await renderAlbuns();
});

// ---------- Irmandade ----------
async function renderIrmandade() {
  const container = $("#irmandade-container");
  if (!container) return;

  const data =
    (await getJSON("/_content/groups.json")) ||
    (await getJSON("/_content/irmandade.json")) ||
    (await getJSON("/data/groups.json")) ||
    (await getJSON("/data/irmandade.json")) ||
    {};

  const list =
    asArray(data.groups) ||
    asArray(data.itens)  ||
    asArray(data.items)  ||
    asArray(data.lista)  || [];

  if (!list.length) return;

  container.innerHTML = "";
  list.forEach((group) => {
    const name = pick(group, ["name", "nome", "title", "titulo"], "Grupo");
    const emblem = pick(group, ["emblem", "logo", "icone", "image", "imagem"]);
    const card = el("div", "p-2 flex items-center justify-center bg-white rounded shadow");
    card.innerHTML = `
      <img src="${cloudAny(emblem, { w: 500 })}" alt="${name}" class="h-24 object-contain" title="${name}">
    `;
    container.appendChild(card);
  });
}

// ---------- Eventos ----------
async function renderEventos() {
  const container = $("#eventos-container");
  if (!container) return;

  const data =
    (await getJSON("/_content/events.json")) ||
    (await getJSON("/data/events.json")) ||
    {};

  const list =
    asArray(data.events) ||
    asArray(data.itens)  ||
    asArray(data.items)  ||
    asArray(data.lista)  || [];

  if (!list.length) {
    container.innerHTML = `<p class="text-center text-gray-400">Nenhum evento disponível.</p>`;
    return;
  }

  container.innerHTML = "";
  list.forEach((event) => {
    const name  = pick(event, ["name", "titulo", "title"], "Evento");
    const date  = pick(event, ["date", "data"], "");
    const image = pick(event, ["image", "imagem", "banner", "capa"]);
    const place = pick(event, ["place", "local", "location"], "");

    const card = el("div", "rounded bg-white border overflow-hidden shadow");
    card.innerHTML = `
      <div class="overflow-hidden h-48">
        <img src="${cloudAny(image, { w: 1200 })}" alt="Evento ${name}" class="w-full h-48 object-cover">
      </div>
      <div class="p-4">
        <h3 class="text-lg font-bold">${name}</h3>
        ${date || place ? `<p class="text-sm text-gray-600">${[date, place].filter(Boolean).join(" — ")}</p>` : ""}
      </div>
    `;
    container.appendChild(card);
  });
}

// ---------- Álbuns (lista na home) ----------
async function renderAlbuns() {
  const container = $("#albuns-container");
  if (!container) return;

  const data =
    (await getJSON("/_content/galeria.json")) ||
    (await getJSON("/_content/gallery.json")) ||
    (await getJSON("/data/galeria.json"))     ||
    (await getJSON("/data/gallery.json"))     ||
    {};

  const albuns =
    asArray(data.albuns) ||
    asArray(data["álbuns"]) ||
    asArray(data.albums) || [];

  if (!albuns.length) {
    container.innerHTML = `<p class="text-center text-gray-400">Nenhum álbum publicado ainda.</p>`;
    return;
  }

  container.innerHTML = "";
  albuns.forEach((album, idx) => {
    const titulo = pick(album, ["titulo", "title", "nome"], "Álbum");
    const descricao = pick(album, ["descricao", "descrição", "description"], "");
    const capa = pick(album, ["capa", "cover", "thumb", "thumbnail", "imagem", "image"]);

    const card = el("a", "block rounded bg-white overflow-hidden shadow hover:shadow-lg transition", "");
    card.href = `/album.html?id=${idx}`;
    card.innerHTML = `
      <div class="h-48 overflow-hidden bg-gray-100">
        <img src="${cloudAny(capa, { w: 1000 })}" alt="${titulo}" class="w-full h-48 object-cover">
      </div>
      <div class="p-4">
        <h3 class="text-lg font-bold">${titulo}</h3>
        ${descricao ? `<p class="text-sm text-gray-600 mt-1">${descricao}</p>` : ""}
        <span class="inline-block mt-3 text-sky-600 font-medium">Abrir álbum →</span>
      </div>
    `;
    container.appendChild(card);
  });
}
