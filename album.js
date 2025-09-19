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

// ========= lightbox state & controls =========
let LB_ITEMS = [];
let LB_INDEX = 0;
let isLightboxOpen = false;

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
  ctrls.innerHTML = "";

  const mkBtn = (id, text, pos) => {
    const b = document.createElement("button");
    b.id = id;
    b.innerHTML = text;
    b.className = "lightbox-btn";
    b.style.position = "fixed";
    pos.split(" ").forEach(p => {
        if (p === 'top-1/2') b.style.top = '50%';
        if (p === '-translate-y-1/2') b.style.transform = 'translateY(-50%)';
        if (p === 'left-4') b.style.left = '1rem';
        if (p === 'right-4') b.style.right = '1rem';
        if (p === 'top-4') b.style.top = '1rem';
    });
    return b;
  };

  const prev = mkBtn("lb-prev", "‹", "left-4 top-1/2 -translate-y-1/2");
  const next = mkBtn("lb-next", "›", "right-4 top-1/2 -translate-y-1/2");
  const close = mkBtn("lb-close", "✕", "right-4 top-4");

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

  img.src = cloudAny(item.src, { w: 2200 });
  img.alt = item.alt || "";

  // MUDANÇA: Controla o display explicitamente
  lb.style.display = "flex";
  isLightboxOpen = true;
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  const lb = $("#lightbox");
  if (!lb) return;

  // MUDANÇA: Controla o display explicitamente
  lb.style.display = "none";
  isLightboxOpen = false;
  document.body.style.overflow = "auto";
}

// ========= página do álbum =========
(async () => {
  const params = new URLSearchParams(location.search);
  const id = Number(params.get("id") || "0");
  const data = await getJSON("/_content/galeria.json") || {};
  const albuns = asArray(data.albuns) || [];
  const album = albuns[id];

  if (!album) { $("#album-title").textContent = "Álbum não encontrado"; return; }

  const titulo = pick(album, ["titulo", "title"], "Álbum");
  const descricao = pick(album, ["descricao"], "");
  
  $("#album-title").textContent = titulo;
  $("#album-desc").textContent = descricao;

  const fotos = asArray(album.fotos_multi).flat().map(item => (typeof item === 'object' && item.imagem) ? item.imagem : item).filter(Boolean);
  const videos = asArray(pick(album, ["videos"], []));
  
  LB_ITEMS = [
    ...fotos.map(src => ({ tipo: "foto", src, alt: titulo })),
    ...videos.map(v => ({ tipo: "video", src: v.url || v.src || "" }))
  ].filter(it => it.src);

  const grid = $("#album-grid");
  if (!grid) return;
  
  if (LB_ITEMS.length === 0) { grid.innerHTML = `<p class="text-gray-400 col-span-full text-center">Este álbum ainda não tem mídias.</p>`; return; }

  grid.innerHTML = "";
  LB_ITEMS.forEach((item, i) => {
    const wrap = document.createElement("div");
    wrap.className = "rounded-lg overflow-hidden bg-gray-900 relative aspect-square cursor-pointer";
    const img = document.createElement("img");
    img.src = cloudAny(item.src, { w: 600 });
    img.alt = titulo;
    img.className = "w-full h-full object-contain";
    img.addEventListener("click", () => openLightboxIndex(i));
    wrap.appendChild(img);
    grid.appendChild(wrap);
  });

  const lb = $("#lightbox");
  lb.addEventListener("click", (e) => { if (e.target.dataset.close === "lightbox" || e.target === lb) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (!isLightboxOpen) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") openLightboxIndex(LB_INDEX + 1);
    if (e.key === "ArrowLeft") openLightboxIndex(LB_INDEX - 1);
  });
})();