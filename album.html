// ===================== Funções Utilitárias (compartilhadas) =====================
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

const asArray = (x) => (Array.isArray(x) ? x : x ? [x] : []);
const pick = (obj, keys, def = undefined) => {
  if (!obj) return def;
  for (const k of keys) if (obj[k] !== undefined) return obj[k];
  return def;
};

// ===================== Cloudinary =====================
const CLOUDINARY_CLOUD = "dae2wp1hy"; // Cloud Name do Movimento 2.3

function cloudAny(url, { w = 800 } = {}) {
  if (!url) return '';
  if (/^https?:\/\/res\.cloudinary\.com\//.test(url)) {
    const parts = url.split("/upload/");
    if (parts.length > 1) {
      if (/\b(c_|w_|h_)/.test(parts[1])) return url; // já tem transformação
      const t = `f_auto,q_auto,dpr_auto,c_limit,w_${w}`;
      return url.replace("/upload/", `/upload/${t}/`);
    }
  }
  const abs = new URL(url, window.location.origin).href;
  const t = `f_auto,q_auto,dpr_auto,c_limit,w_${w}`;
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/fetch/${t}/${encodeURIComponent(abs)}`;
}

// ===================== Lógica da Página do Álbum =====================
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const albumId = parseInt(params.get('id'));

  const tituloEl = $("#album-titulo");
  const descricaoEl = $("#album-descricao");
  const gridEl = $("#album-grid");

  if (isNaN(albumId)) {
    tituloEl.textContent = "Álbum não encontrado";
    return;
  }

  const data = await getJSON("/_content/galeria.json");
  const albuns = asArray(data.albuns);
  const album = albuns[albumId];

  if (!album) {
    tituloEl.textContent = "Álbum não encontrado";
    return;
  }

  tituloEl.textContent = album.titulo || "Álbum sem título";
  descricaoEl.textContent = album.descricao || "";
  gridEl.innerHTML = ""; // Limpa a área

  // ===== AJUSTE FINAL APLICADO AQUI =====
  let fotosArray = [];
  if (album.fotos) {
    // Se 'album.fotos' for um texto (string), quebra ele pela vírgula.
    // Se já for uma lista (array), usa a lista diretamente.
    fotosArray = typeof album.fotos === 'string' ? album.fotos.split(',') : asArray(album.fotos);
  }
  
  const todasAsMidias = [
    ...fotosArray.map(src => ({ tipo: 'imagem', src: src.trim() })), // .trim() remove espaços extras
    ...asArray(album.videos).map(item => ({ tipo: 'video', src: item.url }))
  ];
  // =====================================
  
  if (todasAsMidias.length === 0) {
    gridEl.innerHTML = '<p class="text-gray-400 col-span-full text-center">Este álbum ainda não tem mídias.</p>';
    return;
  }

  todasAsMidias.forEach(item => {
    const card = document.createElement('div');
    card.className = "rounded-lg bg-gray-800 overflow-hidden cursor-pointer aspect-square flex items-center justify-center";

    if (item.tipo === 'imagem' && item.src) { // Adicionada verificação se src existe
      card.innerHTML = `
        <img src="${cloudAny(item.src, { w: 600 })}" alt="Foto do álbum" class="w-full h-full object-contain transition-transform duration-300 hover:scale-105">
      `;
      card.addEventListener('click', () => {
        basicLightbox.create(`<img src="${cloudAny(item.src, { w: 1800 })}">`).show();
      });
    } else if (item.tipo === 'video' && item.src) { // Adicionada verificação se src existe
      card.innerHTML = `
        <div class="w-full h-full bg-black flex items-center justify-center relative">
          <p class="text-gray-400">Vídeo</p>
          <div class="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-5xl">
            <i class="fas fa-play-circle"></i>
          </div>
        </div>
      `;
      card.addEventListener('click', () => {
        const videoUrl = item.src.replace('watch?v=', 'embed/');
        basicLightbox.create(`
          <div class="w-full" style="padding-top: 56.25%; position: relative;">
            <iframe src="${videoUrl}" frameborder="0" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe>
          </div>
        `).show();
      });
    }
    gridEl.appendChild(card);
  });
});