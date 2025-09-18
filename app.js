// --- LÓGICA DO MENU MOBILE, FORMULÁRIO E SCROLL (SEU CÓDIGO ORIGINAL) ---

// Lógica do menu mobile
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
menuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

// Lógica do Formulário Formspree
const form = document.getElementById('form');
if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const formData = new FormData(form);
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
          window.location.href = 'https://movimento2ponto3.netlify.app/obrigado'; // Redireciona para página de obrigado
        } else {
          console.error('Ocorreu um erro no envio do formulário.');
        }
      } catch (error) {
        console.error('Erro de conexão:', error);
      }
    });
}


// Lógica do Botão de Scroll to Top
const scrollToTopBtn = document.querySelector('.scroll-to-top');
if (scrollToTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('active', 'flex'); // Garante que ele apareça
            scrollToTopBtn.classList.remove('hidden');
        } else {
            scrollToTopBtn.classList.remove('active', 'flex');
            scrollToTopBtn.classList.add('hidden');
        }
    });
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// --- SCRIPT PRINCIPAL PARA CONTEÚDO DINÂMICO ---
document.addEventListener('DOMContentLoaded', () => {
    
    // --- LÓGICA DO CARROSSEL DA IRMANDADE ---
    const renderCarousel = async () => {
        console.log("Buscando brasões dos grupos...");
        const container = document.getElementById('irmandade-container');
        
        try {
            // Busca a lista de grupos cadastrados
            const response = await fetch('/_content/groups/index.json');
            if (!response.ok) {
                throw new Error(`Erro ao buscar os grupos: ${response.statusText}`);
            }
            const groups = await response.json();

            if (groups && groups.items && groups.items.length > 0) {
                // Limpa qualquer conteúdo de exemplo
                container.innerHTML = ''; 
                
                // Para cada grupo encontrado, cria um slide no carrossel
                groups.items.forEach(group => {
                    const slide = document.createElement('div');
                    slide.className = 'swiper-slide';
                    // Usa a imagem do brasão que você subiu no painel
                    slide.innerHTML = `<img src="${group.emblem}" alt="${group.name}" class="mx-auto h-24 object-contain" title="${group.name}">`;
                    container.appendChild(slide);
                });
            } else {
                container.innerHTML = `<p class="text-center w-full">Nenhum grupo cadastrado ainda.</p>`;
            }

        } catch (error) {
            console.error("Falha ao carregar os grupos da irmandade:", error);
            container.innerHTML = `<p class="text-center w-full text-red-500">Não foi possível carregar os grupos.</p>`;
        }

        // Inicializa o Swiper DEPOIS que os slides foram adicionados
        const swiper = new Swiper('.irmandade-carousel', {
            loop: true,
            slidesPerView: 2, // Mostra 2 em telas pequenas
            spaceBetween: 20,
            autoplay: {
                delay: 2500, // 2.5 segundos
                disableOnInteraction: false,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            breakpoints: {
                // quando a tela for >= 768px
                768: {
                    slidesPerView: 5,
                    spaceBetween: 30
                }
            }
        });
    };
    
    // --- LÓGICA DOS EVENTOS ---
    const renderEvents = () => { console.log("Buscando eventos..."); };

    // --- LÓGICA DA GALERIA ---
    const renderGallery = () => { console.log("Buscando álbuns..."); };

    // Roda todas as funções de renderização
    renderCarousel();
    renderEvents();
    renderGallery();
});