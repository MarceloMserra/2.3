// ========= helpers =========
const $ = (sel) => document.querySelector(sel);
const asArray = (x) => (Array.isArray(x) ? x : x ? [x] : []);
const pick = (obj, keys, def = undefined) => { if (!obj) return def; for (const k of keys) if (obj[k] !== undefined) return obj[k]; return def; };

async function getJSON(url) {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw 0;
    return await r.json();
  } catch { return null; }
}

// ========= Cloudinary (fetch) =========
const CLOUDINARY_CLOUD = "dae2wp1hy";
const isCloudinary = (url) => /^https?:\/\/res\.cloudinary\.com\//.test(url || "");
function cloudPortrait(url, { w = 1600 } = {}) {
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
function cloudAny(url, { w = 1600 } = {}) {
  if (!url) return url;
  if (isCloudinary(url)) return cloudPortrait(url, { w });
  const abs = new URL(url, window.location.origin).href;
  const t = `f_auto,q_auto,dpr_auto,c_fill,g_auto:subject,w_${w}`;
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/fetch/${t}/${encodeURIComponent(abs)}`;
}

// ========= lightbox state =========
let LB_ITEMS = [];
let LB_INDEX = 0;

function ensureLightboxControls() {
  const lb = $("#lightbox");
  if (!lb) return;
  let ctrls = document.getElementById("lb-ctrls");
  if (!ctrls) {
    ctrls = document.createElement("div");
    ctrls.id = "lb-ctrls";
    ctrls.style.position = "fixed";
    ctrls.style.inset = "0";
    ctrls.style.pointerEvents = "none";
    lb.appendChild(ctrls);
  }
  ctrls.innerHTML = "";

  const mkBtn = (id, text, pos) => {
    const b = document.createElement("button");
    b.id = id;
    b.textContent = text;
    b.className = "pointer-events-auto bg-black/60 text-white rounded-full w-10 h-10 grid place-items-center hover:bg-black/80 focus:outline-none";
    b.style.position = "fixed";
    pos.split(" ").forEach(c => b.classList.add(c));
    return b;
  };

  const prev = mkBtn("lb-prev", "‹", "left-4 top-1/2 -translate-y-1/2");
  const next = mkBtn("lb-next", "›", "right-4 top-1/2 -translate-y-1/2");
  const close= mkBtn("lb-close","✕","right-4 top-4");
  const back = document.createElement("a");
  back.textContent = "Voltar ao álbum";
  back.href = "javascript:void(0)";
  back.className = "pointer-events-auto bg-white/90 text-gray-900 rounded px-3 py-1 text-sm hover:bg-white fixed left-4 bottom-4";

  prev.addEventListener("click", (e) => { e.stopPropagation(); openLightboxIndex(LB_INDEX - 1); });
  next.addEventListener("click", (e) => { e.stopPropagation(); openLightboxIndex(LB_INDEX + 1); });
  close.addEventListener("click", closeLightbox);
  back.addEventListener("click", closeLightbox);

  ctrls.appendChild(prev);
  ctrls.appendChild(next);
  ctrls.appendChild(close);
  ctrls.appendChild(back);
}

function openLightboxIndex(i) {
  const lb = $("#lightbox");
  const img = $("#lightbox-img");
  if (!lb || !img) return;
  LB_INDEX = (i + LB_ITEMS.length) % LB_ITEMS.length;
  const item = LB_ITEMS[LB_INDEX];

  ensureLightboxControls();

  if (item.tipo === "video") {
    // Implementação de vídeo se necessário no futuro
  } else {
    img.src = cloudAny(item.src, { w: 2200 });
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

  // CORREÇÃO PRINCIPAL AQUI: .flat() para lidar com a lista dentro da lista
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
    img.src = cloudAny(item.src, { w: 600 });
    img.alt = titulo;
    img.className = "w-full h-full object-contain";
    img.addEventListener("click", () => openLightboxIndex(i));
    wrap.appendChild(img);
    
    grid.appendChild(wrap);
  });

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