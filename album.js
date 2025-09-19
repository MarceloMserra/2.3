// ========= helpers =========
const $ = (sel) => document.querySelector(sel);
const asArray = (x) => (Array.isArray(x) ? x : x ? [x] : []);
async function getJSON(url) {
  try {
    const r = await fetch(url, { cache: "no-store" }); if (!r.ok) throw 0; return await r.json();
  } catch { return null; }
}

// ========= Cloudinary =========
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

// ========= Lógica do Lightbox (Versão Simplificada e Corrigida) =========
let lightboxItems = [];
let currentLightboxIndex = 0;
const lightbox = $("#lightbox");
const lightboxContainer = $("#lightbox-container");
const prevBtn = $("#lb-prev");
const nextBtn = $("#lb-next");
const closeBtn = $("#lb-close");

function updateLightboxContent() {
  const item = lightboxItems[currentLightboxIndex];
  lightboxContainer.innerHTML = ''; // Limpa antes de adicionar

  if (item.tipo === 'video') {
    const url = item.src || '';
    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'relative w-full max-w-5xl aspect-video';
    let videoId = '';
    const idMatch = url.match(/(?:v=|\/|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    videoId = idMatch ? idMatch[1] : '';
    if (videoId) {
      videoWrapper.innerHTML = `<iframe class="w-full h-full" src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
      lightboxContainer.appendChild(videoWrapper);
    }
  } else {
    const img = document.createElement('img');
    img.className = 'max-w-[90vw] max-h-[90vh] object-contain';
    img.src = cloudAny(item.src, { w: 2200 });
    lightboxContainer.appendChild(img);
  }
}

function openLightbox(index) {
  currentLightboxIndex = index;
  updateLightboxContent();
  lightbox.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.add('hidden');
  document.body.style.overflow = 'auto';
  lightboxContainer.innerHTML = ''; // Limpa o conteúdo ao fechar
}

function navigateLightbox(direction) {
  currentLightboxIndex = (currentLightboxIndex + direction + lightboxItems.length) % lightboxItems.length;
  updateLightboxContent();
}

// ========= Lógica Principal da Página =========
(async () => {
  const id = parseInt(new URLSearchParams(window.location.search).get('id'));
  const data = await getJSON("/_content/galeria.json") || {};
  const albuns = asArray(data.albuns) || [];
  const album = albuns[id];

  if (!album || isNaN(id)) {
    $("#album-title").textContent = "Álbum não encontrado";
    return;
  }

  $("#album-title").textContent = album.titulo || "Álbum";
  $("#album-desc").textContent = album.descricao || "";

  const fotos = asArray(album.fotos_multi).flat().map(item => (typeof item === 'object' && item.imagem) ? item.imagem : item).filter(Boolean);
  const videos = asArray(album.videos).map(item => item.url).filter(Boolean);
  
  lightboxItems = [ // Atribui os itens à variável global
    ...fotos.map(src => ({ tipo: "foto", src })),
    ...videos.map(src => ({ tipo: "video", src }))
  ];

  const grid = $("#album-grid");
  if (lightboxItems.length === 0) {
    grid.innerHTML = '<p class="text-gray-400 col-span-full text-center">Este álbum ainda não tem mídias.</p>';
    return;
  }

  lightboxItems.forEach((item, i) => {
    const wrap = document.createElement("div");
    wrap.className = "rounded-lg overflow-hidden bg-gray-900 relative aspect-square cursor-pointer group";
    
    if (item.tipo === 'video') {
      const thumb = document.createElement('div');
      thumb.className = 'w-full h-full bg-black flex items-center justify-center';
      let videoId = '';
      const idMatch = (item.src || '').match(/(?:v=|\/|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      videoId = idMatch ? idMatch[1] : '';
      if (videoId) {
        thumb.innerHTML = `<img src="https://i.ytimg.com/vi/${videoId}/hqdefault.jpg" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity">`;
      }
      thumb.innerHTML += `<div class="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-5xl"><i class="fas fa-play-circle"></i></div>`;
      wrap.appendChild(thumb);
    } else {
      const img = document.createElement("img");
      img.src = cloudAny(item.src, { w: 600 });
      img.className = "w-full h-full object-contain";
      wrap.appendChild(img);
    }
    
    wrap.addEventListener("click", () => openLightbox(i));
    grid.appendChild(wrap);
  });

  // Conecta os botões e o teclado aos seus eventos
  prevBtn.addEventListener('click', () => navigateLightbox(-1));
  nextBtn.addEventListener('click', () => navigateLightbox(1));
  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target.dataset.close === 'lightbox') closeLightbox(); });

  document.addEventListener('keydown', e => {
    if (lightbox.classList.contains('hidden')) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") navigateLightbox(1);
    if (e.key === "ArrowLeft") navigateLightbox(-1);
  });
})();