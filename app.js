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
      // Redireciona para a página de obrigado
      window.location.href = "/Obrigado.html";
    } catch {
      alert("Não foi possível enviar. Tente novamente.");
    } finally {
      btn && (btn.disabled = false);
    }
  });
}

// Scroll-to-top (opcional)
const scrollToTopBtn = document.querySelector(".scroll-to-top");
if (scrollToTopBtn) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) scrollToTopBtn.classList.add("active");
    else scrollToTopBtn.classList.remove("active");
  }, { passive: true });
  scrollToTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

// ===================== Conteúdo dinâmico =====================
document.addEventListener("DOMContentLoaded", () => {
  renderCarousel();
  renderEvents();
  renderGallery();
});

// --- Irmandade (carrossel/lista de grupos) ---
async function renderCarousel() {
  const container = $("#irmandade-container");
  if (!container) return;

  const data =
    (await getJSON("/_content/groups.json")) ||
    (await getJSON("/data/groups.json")) ||
    {};

  const list = asArray(data.groups) || [];

  if (!list.length) return;

  container.innerHTML = "";
  list.forEach((group) => {
    const name = pick(group, ["name", "nome"], "Grupo");
    const emblem = pick(group, ["emblem", "logo"]);
    
    // Adicionamos a classe 'swiper-slide' que é essencial para o carrossel
    const slide = el("div", "swiper-slide p-2 flex items-center justify-center"); 
    slide.innerHTML = `
      <img src="${cloudAny(emblem, { w: 500 })}"
           alt="${name}"
           class="mx-auto h-32 md:h-40 object-contain"
           title="${name}">
    `;
    container.appendChild(slide);
  });

  // INICIA O CARROSSEL AQUI
  new Swiper('.irmandade-carousel', {
    loop: true,
    slidesPerView: 2, // 2 logos visíveis em telas pequenas
    spaceBetween: 10,
    autoplay: {
      delay: 1000, // Tempo de 1 segundo
      disableOnInteraction: false,
    },
    breakpoints: {
      // telas maiores
      640: { slidesPerView: 3, spaceBetween: 20 },
      768: { slidesPerView: 4, spaceBetween: 30 },
      1024: { slidesPerView: 5, spaceBetween: 40 },
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  });
}

// --- Eventos (cards) ---
async function renderEvents() {
  const container = $("#eventos-container"); // Corrigido de #events-container para #eventos-container
  if (!container) return;

  const data =
    (await getJSON("/_content/events.json")) ||
    (await getJSON("/data/events.json")) ||
    {};

  const list =
    asArray(data.events) ||
    asArray(data.itens) ||
    asArray(data.items) ||
    asArray(data.lista) || [];

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

    const card = el("div", "rounded shadow bg-gray-900 border border-gray-800 overflow-hidden");
    card.innerHTML = `
      <div class="overflow-hidden h-48">
        <img src="${cloudAny(image, { w: 1000 })}" alt="Imagem do evento ${name}" class="w-full h-48 object-cover">
      </div>
      <div class="p-4">
        <h3 class="text-lg font-bold">${name}</h3>
        ${date ? `<p class="text-sm text-gray-300">${date}${place ? " — " + place : ""}</p>` : ""}
        ${desc ? `<p class="mt-2 text-gray-400 text-sm">${desc}</p>` : ""}
      </div>
    `;
    container.appendChild(card);
  });
}

// --- Galeria (agora com álbuns e lightbox) ---
async function renderGallery() {
  const container = $("#galeria-container");
  if (!container) return;

  const data = await getJSON("/_content/galeria.json") || {};
  const albuns = asArray(data.albuns) || [];

  if (!albuns.length) {
    container.innerHTML = `<p class="text-center text-gray-400">Nenhuma foto publicada ainda.</p>`;
    return;
  }

  container.innerHTML = "";
  albuns.forEach((album) => {
    const titulo = pick(album, ["titulo", "title"], "Álbum");
    const capa = pick(album, ["capa", "cover"]);
    const midias = asArray(album.midias) || [];

    const card = el("div", "rounded-lg bg-gray-800 border border-gray-700 overflow-hidden shadow-lg cursor-pointer transform hover:scale-105 transition-transform duration-300");
    card.innerHTML = `
      <div class="overflow-hidden h-56">
        <img src="${cloudAny(capa, { w: 800 })}" alt="Capa do álbum ${titulo}" class="w-full h-full object-cover">
      </div>
      <div class="p-4">
        <h3 class="text-lg font-bold truncate">${titulo}</h3>
        <p class="text-sm text-gray-400">${midias.length} mídias</p>
      </div>
    `;

    // Ação de clique para abrir o Lightbox
    card.addEventListener('click', () => {
      const carouselItems = midias.map(midia => {
        if (midia.tipo === 'video' && midia.url) {
          // Para vídeos, usamos um iframe
          return `<div class="video-container" style="padding-top: 56.25%; position: relative;">
                    <iframe src="${midia.url.replace('watch?v=', 'embed/')}" frameborder="0" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe>
                  </div>`;
        }
        // Para imagens
        return `<img src="${cloudAny(midia.src, { w: 1600 })}">`;
      }).join('');

      // Cria e mostra a galeria com basicLightbox (se houver itens)
      if(carouselItems) {
        const instance = basicLightbox.create(`
            <div class="w-full h-full">${carouselItems}</div>
        `);
        instance.show();
      }
    });

    container.appendChild(card);
  });
}