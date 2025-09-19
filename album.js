// ========= helpers =========
const $ = (sel) => document.querySelector(sel);
const asArray = (x) => (Array.isArray(x) ? x : x ? [x] : []);
const pick = (obj, keys, def = undefined) => { if (!obj) return def; for (const k of keys) if (obj[k] !== undefined) return obj[k]; return def; };

async function getJSON(url) {
  try {
    const r = await fetch(url, { cache: "no-store" }); if (!r.ok) throw 0; return await r.json();
  } catch { return null; }
}

// ========= Cloudinary (fetch) =========
const CLOUDINARY_CLOUD = "dae2wp1hy";

function cloudAny(url, { w = 1600 } = {}) {
  if (!url || typeof url !== 'string') return '';
  // CORREÇÃO DE BRILHO E QUALIDADE APLICADA AQUI
  const t = `f_auto,q_auto:good,e_brightness:5,dpr_auto,c_limit,w_${w}`;
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

// ========= lightbox state & controls =========
let LB_ITEMS = [];
let LB_INDEX = 0;

function ensureLightboxControls() {
  const lb = $("#lightbox");
  if (!lb) return;
  let ctrls = document.getElementById("lb-ctrls");
  if (!ctrls) {
    ctrls = document.createElement("div");
    ctrls.id = "lb-ctrls";
    ctrls.style.pointerEvents = "none";
    lb.appendChild(ctrls);
  }
  ctrls.innerHTML = ""; // Limpa os botões antigos

  const prev = document.createElement("button");
  prev.id = "lb-prev";
  prev.innerHTML = "‹";
  prev.className = "lightbox-btn left-4 top-1/2 -translate-y-1/2";
  
  const next = document.createElement("button");
  next.id = "lb-next";
  next.innerHTML = "›";
  next.className = "lightbox-btn right-4 top-1/2 -translate-y-1/2";

  const close = document.createElement("button");
  close.id = "lb-close";
  close.innerHTML = "✕";
  close.className = "lightbox-btn right-4 top-4";

  prev.addEventListener("click", (e) => { e.stopPropagation(); openLightboxIndex(LB_INDEX - 1); });
  next.addEventListener("click", (e) => { e.stopPropagation(); openLightboxIndex(LB_INDEX + 1); });
  close.addEventListener("click", closeLightbox);

  ctrls.appendChild(prev);
  ctrls.appendChild(next);
  ctrls.appendChild(close);
}

function openLightboxIndex(i) {
  const lb = $("#lightbox");
  const img = $("#lightbox-img");
  if (!lb || !img || LB_ITEMS.length === 0) return;
  
  LB_INDEX = (i + LB_ITEMS.length) % LB_ITEMS.length;
  const item = LB_ITEMS[LB_INDEX];
  ensureLightboxControls();

  if (item.tipo === "video") {
    // Lógica para vídeo (se necessário no futuro)
  } else {
    img.src = cloudAny(item.src, { w: 2200 }); // Imagem maior para o lightbox
    img.alt = item.alt || "";
  }

  lb.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  const lb = $("#lightbox");
  if (!lb) return;
  lb.classList.add("hidden");
  document.body.style.overflow = "auto";
}

// ========= página do álbum =========
(async () => {
  const params = new URLSearchParams(location.search);
  const id = Number(params.get("id") || "0");

  const data = await getJSON("/_content/galeria.json") || {};
  const albuns = asArray(data.albuns) || [];
  const album = albuns[id];

  if (!album) {
    $("#album-title").textContent = "Álbum não encontrado";
    return;
  }

  const titulo = pick(album, ["titulo", "title", "nome"], "Álbum");
  const descricao = pick(album, ["descricao", "descrição", "description"], "");
  
  $("#album-title").textContent = titulo;
  $("#album-desc").textContent = descricao || "";

  const fotos = asArray(album.fotos_multi).flat().map(item => {
    return (typeof item === 'object' && item.imagem) ? item.imagem : item;
  }).filter(Boolean);

  const videosList = asArray(pick(album, ["videos", "vídeos"], []));
  
  LB_ITEMS = [
    ...fotos.map((src) => ({ tipo: "foto", src, alt: titulo })),
    ...videosList.map((v) => ({ tipo: "video", src: v.url || v.src || "" }))
  ].filter(it => it.src);

  const grid = $("#album-grid");
  if (!grid) return;
  
  if (LB_ITEMS.length === 0) {
      grid.innerHTML = '<p class="text-gray-400 col-span-full text-center">Este álbum ainda não tem mídias.</p>';
      return;
  }

  grid.innerHTML = "";
  LB_ITEMS.forEach((item, i) => {
    const wrap = document.createElement("div");
    wrap.className = "rounded-lg overflow-hidden bg-gray-800 relative aspect-square cursor-pointer";
    
    const img = document.createElement("img");
    img.src = cloudAny(item.src, { w: 600 }); // Imagem menor para a grade
    img.alt = titulo;
    img.className = "w-full h-full object-contain";
    img.addEventListener("click", () => openLightboxIndex(i));
    wrap.appendChild(img);
    
    grid.appendChild(wrap);
  });

  // Event Listeners para o Lightbox (teclado e clique fora)
  const lb = $("#lightbox");
  lb.addEventListener("click", (e) => {
    if (e.target.dataset.close === "lightbox" || e.target === lb) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (lb.classList.contains("hidden")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") openLightboxIndex(LB_INDEX + 1);
    if (e.key === "ArrowLeft")  openLightboxIndex(LB_INDEX - 1);
  });
})();