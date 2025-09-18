// ===================== utilidades =====================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

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

// ===================== Cloudinary (igual ao HCP - modo fetch) =====================
const CLOUDINARY_CLOUD = "dae2wp1hy"; // 👈 seu cloud_name

const isCloudinary = (url) => /^https?:\/\/res\.cloudinary\.com\//.test(url || "");

// mantém transforms se já existirem
function cloudPortrait(url, { w = 800 } = {}) {
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

// força QUALQUER URL (local/externa) a passar pelo Cloudinary
function cloudAny(url, { w = 800 } = {}) {
  if (!url) return url;
  if (isCloudinary(url)) return cloudPortrait(url, { w });
  const abs = new URL(url, window.location.origin).href;
  const t = `f_auto,q_auto,dpr_auto,c_fill,g_auto:subject,w_${w}`;
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/fetch/${t}/${encodeURIComponent(abs)}`;
}

// ===================== UI básica: menu, formulário, scroll-to-top =====================

// Menu mobile (opcional, só funciona se existir na página)
const menuToggle = $("#menuToggle");
const mobileMenu = $("#mobileMenu");
if (menuToggle && mobileMenu) {
  menuToggle.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
}

// Form Formspree (opcional)
const form = $("#form");
if (form) {
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const btn = form.querySelector("button[type=submit]");
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());
    try {
      btn && (btn.disabled = true);
      const r = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw 0;
      form.reset();
      alert("Mensagem enviada com sucesso!");
    } catch {
      alert("Não foi possível enviar. Tente novamente.");
    } finally {
      btn && (btn.disabled = false);
    }
  });
}

// Scroll-to-top (opcional)
const scrollToTopBtn = $("#scrollToTop");
if (scrollToTopBtn) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) scrollToTopBtn.classList.remove("hidden");
    else scrollToTopBtn.classList.add("hidden");
  }, { passive: true });
  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ===================== Conteúdo dinâmico =====================
document.addEventListener("DOMContentLoaded", () => {
  renderCarousel();
  renderEvents();
  renderGallery(); // se ainda não tiver, fica “no-op”
});

// --- Irmandade (carrossel/lista de grupos) ---
async function renderCarousel() {
  const container = $("#irmandade-container");
  if (!container) return;

  // tenta vários caminhos comuns
  const data =
    (await getJSON("/_content/groups.json")) ||
    (await getJSON("/_content/irmandade.json")) ||
    (await getJSON("/data/groups.json")) ||
    (await getJSON("/data/irmandade.json")) ||
    {};

  const list =
    asArray(data.groups) ||
    asArray(data.itens) ||
    asArray(data.items) ||
    asArray(data.lista);

  if (!list.length) {
    container.innerHTML = `<p class="text-center text-gray-500">Nenhum grupo encontrado.</p>`;
    return;
  }

  container.innerHTML = "";
  list.forEach((group) => {
    const name = pick(group, ["name", "nome", "title", "titulo"], "Grupo");
    const emblem = pick(group, ["emblem", "logo", "icone", "image", "imagem"]);
    const slide = el("div", "p-2");
    slide.innerHTML = `
      <img src="${cloudAny(emblem, { w: 400 })}"
           alt="${name}"
           class="mx-auto h-24 object-contain"
           title="${name}">
    `;
    container.appendChild(slide);
  });
}

// --- Eventos (cards) ---
async function renderEvents() {
  const container = $("#events-container");
  if (!container) return;

  const data =
    (await getJSON("/_content/events.json")) ||
    (await getJSON("/data/events.json")) ||
    {};

  const list =
    asArray(data.events) ||
    asArray(data.itens) ||
    asArray(data.items) ||
    asArray(data.lista);

  if (!list.length) {
    container.innerHTML = `<p class="text-center text-gray-500">Nenhum evento disponível.</p>`;
    return;
  }

  container.innerHTML = "";
  list.forEach((event) => {
    const name = pick(event, ["name", "titulo", "title"], "Evento");
    const date = pick(event, ["date", "data"], "");
    const image = pick(event, ["image", "imagem", "banner", "capa"]);
    const place = pick(event, ["place", "local", "location"], "");
    const desc  = pick(event, ["description", "descricao", "descrição"], "");

    const card = el("div", "rounded shadow bg-white overflow-hidden");
    card.innerHTML = `
      <div class="overflow-hidden h-48">
        <img src="${cloudAny(image, { w: 1000 })}" alt="Imagem do evento ${name}" class="w-full h-48 object-cover">
      </div>
      <div class="p-4">
        <h3 class="text-lg font-bold">${name}</h3>
        ${date ? `<p class="text-sm text-gray-600">${date}${place ? " — " + place : ""}</p>` : ""}
        ${desc ? `<p class="mt-2 text-gray-700 text-sm">${desc}</p>` : ""}
      </div>
    `;
    container.appendChild(card);
  });
}

// --- Galeria (placeholder; adapte se precisar) ---
function renderGallery() {
  // se não houver galeria ainda, não faz nada.
}
