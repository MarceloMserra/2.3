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

// ========= Lightbox Class (igual ao HCP) =========
class Lightbox {
  constructor(items) {
    this.items = items;
    this.currentIndex = 0;
    this.modal = $("#lightbox");
    this.container = $("#lightbox-container");
    this.prevBtn = $("#lb-prev");
    this.nextBtn = $("#lb-next");
    this.closeBtn = $("#lb-close");
    this.handleKeydown = this.handleKeydown.bind(this);
    
    this.prevBtn.addEventListener('click', () => this.navigate(-1));
    this.nextBtn.addEventListener('click', () => this.navigate(1));
    this.closeBtn.addEventListener('click', () => this.close());
    this.modal.addEventListener('click', e => { if (e.target.dataset.close === 'lightbox') this.close(); });
  }

  open(index) {
    this.currentIndex = index;
    this.updateContent();
    this.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', this.handleKeydown);
  }

  close() {
    this.modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    document.removeEventListener('keydown', this.handleKeydown);
    this.container.innerHTML = ''; // Limpa o conteúdo ao fechar
  }

  navigate(direction) {
    this.currentIndex = (this.currentIndex + direction + this.items.length) % this.items.length;
    this.updateContent();
  }

  updateContent() {
    const item = this.items[this.currentIndex];
    this.container.innerHTML = ''; // Limpa antes de adicionar

    if (item.tipo === 'video') {
      const url = item.src || '';
      const videoWrapper = document.createElement('div');
      videoWrapper.className = 'relative w-full max-w-5xl aspect-video';
      let videoId = '';
      if (/youtube\.com|youtu\.be/.test(url)) {
        const idMatch = url.match(/(?:v=|\/|youtu\.be\/)([A-Za-z0-9_-]{11})/);
        videoId = idMatch ? idMatch[1] : '';
      }
      if (videoId) {
        videoWrapper.innerHTML = `<iframe class="w-full h-full" src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
        this.container.appendChild(videoWrapper);
      }
    } else {
      const img = document.createElement('img');
      img.className = 'max-w-[90vw] max-h-[90vh] object-contain';
      img.src = cloudAny(item.src, { w: 2200 });
      this.container.appendChild(img);
    }
  }

  handleKeydown(e) {
    if (e.key === "Escape") this.close();
    if (e.key === "ArrowRight") this.navigate(1);
    if (e.key === "ArrowLeft") this.navigate(-1);
  }
}

// ========= Lógica da Página =========
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
  
  const allItems = [
    ...fotos.map(src => ({ tipo: "foto", src })),
    ...videos.map(src => ({ tipo: "video", src }))
  ];

  const grid = $("#album-grid");
  const lightbox = new Lightbox(allItems);

  if (allItems.length === 0) {
    grid.innerHTML = '<p class="text-gray-400 col-span-full text-center">Este álbum ainda não tem mídias.</p>';
    return;
  }

  allItems.forEach((item, i) => {
    const wrap = document.createElement("div");
    wrap.className = "rounded-lg overflow-hidden bg-gray-900 relative aspect-square cursor-pointer group";
    
    if(item.tipo === 'video') {
      const thumb = document.createElement('div');
      thumb.className = 'w-full h-full bg-black flex items-center justify-center';
      let videoId = '';
      const idMatch = (item.src || '').match(/(?:v=|\/|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      videoId = idMatch ? idMatch[1] : '';
      if(videoId) {
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
    
    wrap.addEventListener("click", () => lightbox.open(i));
    grid.appendChild(wrap);
  });
})();