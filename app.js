// --- LÓGICA DO MENU MOBILE, FORMULÁRIO E SCROLL (SEU CÓDIGO ORIGINAL) ---

// Lógica do menu mobile
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
}


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
          window.location.href = '/Obrigado.html'; // Redireciona para página de obrigado local
        } else {
          console.error('Ocorreu um erro no envio do formulário.');
          alert('Ocorreu um erro no envio. Tente novamente.');
        }
      } catch (error) {
        console.error('Erro de conexão:', error);
        alert('Erro de conexão. Verifique sua internet.');
      }
    });
}


// Lógica do Botão de Scroll to Top
const scrollToTopBtn = document.querySelector('.scroll-to-top');
if (scrollToTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.style.opacity = '1';
        } else {
            scrollToTopBtn.style.opacity = '0';
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
        if (!container) return;
        
        try {
            const response = await fetch('/_content/groups/index.json');
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            const groups = await response.json();

            if (groups && groups.items && groups.items.length > 0) {
                container.innerHTML = ''; 
                groups.items.forEach(group => {
                    const slide = document.createElement('div');
                    slide.className = 'swiper-slide';
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

        const swiper = new Swiper('.irmandade-carousel', {
            loop: true,
            slidesPerView: 2,
            spaceBetween: 20,
            autoplay: { delay: 2500, disableOnInteraction: false },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            breakpoints: { 768: { slidesPerView: 5, spaceBetween: 30 } }
        });
    };
    
    // --- LÓGICA DOS EVENTOS (NOVA LÓGICA ADICIONADA AQUI) ---
    const renderEvents = async () => {
        console.log("Buscando eventos...");
        const container = document.getElementById('eventos-container');
        if (!container) return; // Se o container não existir na página, não faz nada.

        try {
            const response = await fetch('/_content/events/index.json');
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            const events = await response.json();

            if (events && events.items && events.items.length > 0) {
                container.innerHTML = ''; // Limpa o container
                events.items.forEach(event => {
                    // Formata a data para um formato mais amigável (ex: 18/09/2025)
                    const eventDate = new Date(event.date);
                    const formattedDate = eventDate.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });

                    // Cria o HTML para o card do evento
                    const eventCard = `
                        <div class="event-card bg-gray-900 rounded-lg overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300">
                            <img src="${event.image}" alt="Imagem do evento ${event.name}" class="w-full h-48 object-cover">
                            <div class="p-6">
                                <div class="flex justify-between items-center mb-3">
                                    <span class="bg-yellow-400 text-black text-sm font-bold px-3 py-1 rounded-full">${event.location}</span>
                                    <span class="text-gray-400 font-bold">${formattedDate}</span>
                                </div>
                                <h3 class="text-xl font-bold text-white mb-2">${event.name}</h3>
                                <p class="text-gray-300 mb-4">${event.description.substring(0, 100)}...</p>
                                <a href="#" class="text-yellow-400 font-bold hover:text-yellow-500 transition">SAIBA MAIS →</a>
                            </div>
                        </div>
                    `;
                    container.innerHTML += eventCard;
                });
            } else {
                container.innerHTML = `<p class="text-center w-full col-span-3">Nenhum evento cadastrado no momento.</p>`;
            }

        } catch(error) {
            console.error("Falha ao carregar os eventos:", error);
            container.innerHTML = `<p class="text-center w-full col-span-3 text-red-500">Não foi possível carregar os eventos.</p>`;
        }
    };

    // --- LÓGICA DA GALERIA ---
    const renderGallery = () => { console.log("Buscando álbuns..."); };

    // Roda todas as funções de renderização
    renderCarousel();
    renderEvents();
    renderGallery();
});