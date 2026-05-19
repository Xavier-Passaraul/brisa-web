/* ============================================================
   BRISA ESTÉTICA FENIX — main.js
   Mismo sistema que Fenix Salón Unisex.
   Módulos:
   1. Cursor personalizado
   2. Navegación (scroll + hamburger)
   3. Reveal on scroll
   4. Hero entrada animada
   5. Galería drag-to-scroll
   6. Admin: dropzone, preview, localStorage
   7. Integración: cargar fotos del admin en el landing
   8. Helpers
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ── Detectar contexto: admin o landing ─────────────────── */
  const isAdmin   = document.querySelector('.dropzone') !== null;
  const isLanding = !isAdmin;

  /* ============================================================
     1. CURSOR PERSONALIZADO
     ============================================================ */
  const cursorDot      = document.querySelector('.cursor');
  const cursorFollower = document.querySelector('.cursor-follower');

  if (cursorDot && cursorFollower && window.matchMedia('(pointer: fine)').matches) {
    let followerX = 0, followerY = 0, mouseX = 0, mouseY = 0;

    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.left = mouseX + 'px';
      cursorDot.style.top  = mouseY + 'px';
    });

    const animateFollower = () => {
      /* Lerp suave hacia la posición del mouse */
      followerX += (mouseX - followerX) * 0.12;
      followerY += (mouseY - followerY) * 0.12;
      cursorFollower.style.left = followerX + 'px';
      cursorFollower.style.top  = followerY + 'px';
      requestAnimationFrame(animateFollower);
    };
    animateFollower();

    /* Expandir cursor en elementos interactivos */
    document.querySelectorAll('a, button, .service-card, .gallery__item, .dropzone').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursorDot.classList.add('is-hovering');
        cursorFollower.classList.add('is-hovering');
      });
      el.addEventListener('mouseleave', () => {
        cursorDot.classList.remove('is-hovering');
        cursorFollower.classList.remove('is-hovering');
      });
    });
  }


  /* ============================================================
     2. NAVEGACIÓN
     ============================================================ */
  const nav        = document.querySelector('.nav');
  const hamburger  = document.querySelector('.nav__hamburger');
  const mobileMenu = document.querySelector('.nav__mobile-menu');

  /* Clase scrolled al bajar 80px */
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Menú hamburguesa */
  if (hamburger && mobileMenu) {
    const toggleMenu = () => {
      const isOpen = hamburger.classList.toggle('is-open');
      mobileMenu.classList.toggle('is-open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
      hamburger.setAttribute('aria-expanded', isOpen);
      mobileMenu.setAttribute('aria-hidden', !isOpen);
    };

    hamburger.addEventListener('click', toggleMenu);

    /* Cerrar al tocar un link del menú mobile */
    document.querySelectorAll('.nav__mobile-menu .nav__link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('is-open');
        mobileMenu.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });

    /* Cerrar con Escape */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && hamburger.classList.contains('is-open')) toggleMenu();
    });
  }


  /* ============================================================
     3. REVEAL ON SCROLL
     ============================================================ */
  const revealEls = document.querySelectorAll('.reveal');

  if (revealEls.length > 0) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => observer.observe(el));
  }


  /* ============================================================
     4. HERO — Entrada animada
     ============================================================ */
  const heroLeft = document.querySelector('.hero__left');
  if (heroLeft) {
    setTimeout(() => heroLeft.classList.add('is-loaded'), 100);
  }


  /* ============================================================
     5. GALERÍA — Drag-to-scroll
     ============================================================ */
  const galleryWrapper = document.querySelector('.gallery__scroll-wrapper');
  const galleryTrack   = document.querySelector('.gallery__track');
  const btnPrev        = document.querySelector('.gallery__btn--prev');
  const btnNext        = document.querySelector('.gallery__btn--next');

  if (galleryWrapper && galleryTrack) {
    let isDragging = false, startX = 0, scrollLeft = 0;

    galleryWrapper.addEventListener('mousedown', e => {
      isDragging = true;
      startX     = e.pageX - galleryWrapper.offsetLeft;
      scrollLeft = galleryWrapper.scrollLeft;
      galleryTrack.classList.add('is-paused');
    });

    galleryWrapper.addEventListener('mouseleave', () => {
      if (isDragging) { isDragging = false; galleryTrack.classList.remove('is-paused'); }
    });

    galleryWrapper.addEventListener('mouseup', () => {
      isDragging = false;
      galleryTrack.classList.remove('is-paused');
    });

    galleryWrapper.addEventListener('mousemove', e => {
      if (!isDragging) return;
      e.preventDefault();
      const x    = e.pageX - galleryWrapper.offsetLeft;
      const walk = (x - startX) * 1.5;
      galleryWrapper.scrollLeft = scrollLeft - walk;
    });

    /* Touch swipe para mobile */
    let touchStartX = 0;
    galleryWrapper.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      galleryTrack.classList.add('is-paused');
    }, { passive: true });

    galleryWrapper.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      galleryWrapper.scrollLeft += diff * 2;
      galleryTrack.classList.remove('is-paused');
    }, { passive: true });

    /* Botones de control */
    if (btnPrev) btnPrev.addEventListener('click', () => galleryWrapper.scrollBy({ left: -300, behavior: 'smooth' }));
    if (btnNext) btnNext.addEventListener('click', () => galleryWrapper.scrollBy({ left:  300, behavior: 'smooth' }));
  }


  /* ============================================================
     6. ADMIN — Carga de fotos
     Clave localStorage: "brisa_photos" (separado de Fenix)
     ============================================================ */
  if (isAdmin) {

    const dropzone    = document.querySelector('.dropzone');
    const fileInput   = document.querySelector('.dropzone__input');
    const previewGrid = document.querySelector('.preview-grid');
    const previewEmpty= document.querySelector('.preview-empty');
    const countEl     = document.querySelector('.admin-actions__count');
    const clearBtn    = document.querySelector('.admin-clear-btn');
    const exportBtn   = document.querySelector('.admin-export-btn');

    /* Estado: array de fotos */
    let photos = loadPhotos();
    renderGrid();

    /* Dropzone: drag & drop */
    if (dropzone) {
      ['dragenter','dragover','dragleave','drop'].forEach(evt => {
        document.addEventListener(evt, e => e.preventDefault());
      });

      dropzone.addEventListener('dragenter', () => dropzone.classList.add('is-active'));
      dropzone.addEventListener('dragover',  () => dropzone.classList.add('is-active'));
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-active'));

      dropzone.addEventListener('drop', e => {
        dropzone.classList.remove('is-active');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        processFiles(files);
      });
    }

    /* Input file */
    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const files = Array.from(fileInput.files).filter(f => f.type.startsWith('image/'));
        processFiles(files);
        fileInput.value = '';
      });
    }

    /* Limpiar todo */
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('¿Eliminar todas las fotos?')) {
          photos = [];
          savePhotos();
          renderGrid();
          showToast('Todas las fotos eliminadas');
        }
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        showToast(`${photos.length} fotos guardadas en el navegador`);
      });
    }

    /* ── Procesar archivos ── */
    function processFiles(files) {
      if (!files.length) { showToast('Solo se aceptan imágenes'); return; }

      const available = 30 - photos.length;
      if (available <= 0) { showToast('Máximo 30 fotos. Eliminá alguna primero.'); return; }

      files.slice(0, available).forEach(file => {
        const reader = new FileReader();

        reader.onload = e => {
          /* Comprimir sin convertir a grayscale — fotos en color */
          compressImage(e.target.result, 900, dataUrl => {
            photos.push({
              id:      Date.now() + Math.random(),
              name:    file.name.replace(/\.[^/.]+$/, ''),
              dataUrl,
              slot:    photos.length
            });
            savePhotos();
            renderGrid();
            showToast('Foto cargada correctamente');
          });
        };

        reader.onerror = () => showToast(`Error al leer ${file.name}`);
        reader.readAsDataURL(file);
      });

      if (files.length > available) {
        showToast(`Solo se cargaron ${available} fotos (límite 30)`);
      }
    }

    /* ── Comprimir imagen — EN COLOR (sin grayscale) ── */
    function compressImage(dataUrl, maxWidth, callback) {
      const img  = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width  = maxWidth;
        }

        canvas.width  = width;
        canvas.height = height;
        const ctx     = canvas.getContext('2d');

        /* Sin ctx.filter = 'grayscale' — imágenes en color */
        ctx.drawImage(img, 0, 0, width, height);

        callback(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.src = dataUrl;
    }

    /* ── Renderizar grilla de previews ── */
    function renderGrid() {
      if (!previewGrid) return;
      previewGrid.innerHTML = '';

      if (previewEmpty) {
        previewEmpty.style.display = photos.length === 0 ? 'block' : 'none';
      }

      if (countEl) countEl.textContent = `${photos.length} / 30 fotos`;

      photos.forEach((photo, index) => {
        const item = document.createElement('div');
        item.className    = 'preview-item reveal';
        item.dataset.id   = photo.id;

        item.innerHTML = `
          <img src="${photo.dataUrl}"
               alt="Foto de Brisa Estética: ${escapeHtml(photo.name)}"
               loading="lazy" />
          <div class="preview-item__overlay"
               role="group"
               aria-label="Acciones para ${escapeHtml(photo.name)}">
            <button class="preview-item__delete"
                    aria-label="Eliminar foto ${escapeHtml(photo.name)}">✕</button>
          </div>
          <div class="preview-item__name" title="${escapeHtml(photo.name)}">
            ${escapeHtml(photo.name)}
          </div>
        `;

        item.querySelector('.preview-item__delete').addEventListener('click', () => {
          deletePhoto(photo.id);
        });

        previewGrid.appendChild(item);

        requestAnimationFrame(() => {
          setTimeout(() => item.classList.add('is-visible'), index * 60);
        });
      });
    }

    /* ── Eliminar foto ── */
    function deletePhoto(id) {
      const item = previewGrid.querySelector(`[data-id="${id}"]`);
      const name = photos.find(p => p.id === id)?.name || '';

      if (item) {
        item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        item.style.opacity    = '0';
        item.style.transform  = 'scale(0.9)';
        setTimeout(() => {
          photos = photos.filter(p => p.id !== id);
          savePhotos();
          renderGrid();
          showToast(`"${name}" eliminada`);
        }, 300);
      }
    }

    /* ── localStorage con clave propia de Brisa ── */
    function savePhotos() {
      try {
        localStorage.setItem('brisa_photos', JSON.stringify(photos));
      } catch (e) {
        console.warn('localStorage lleno, liberando espacio...');
        if (photos.length > 1) { photos = photos.slice(1); savePhotos(); }
      }
    }

    function loadPhotos() {
      try {
        return JSON.parse(localStorage.getItem('brisa_photos') || '[]');
      } catch (e) { return []; }
    }

  } /* END isAdmin */


  /* ============================================================
     7. INTEGRACIÓN LANDING — cargar fotos de brisa_photos
     ============================================================ */
  if (isLanding) {
    try {
      const storedPhotos = JSON.parse(localStorage.getItem('brisa_photos') || '[]');
      const track        = document.querySelector('.gallery__track');

      if (track && storedPhotos.length > 0) {
        storedPhotos.forEach(photo => {
          if (track.querySelector(`[data-photo-id="${photo.id}"]`)) return;

          const item = document.createElement('div');
          item.className       = 'gallery__item';
          item.dataset.photoId = photo.id;

          item.innerHTML = `
            <img src="${photo.dataUrl}"
                 alt="Foto de Brisa Estética: ${escapeHtml(photo.name)}"
                 loading="lazy" />
            <span class="gallery__caption" aria-hidden="true">${escapeHtml(photo.name)}</span>
          `;

          /* Insertar antes del primer item estático */
          const firstStatic = track.querySelector('.gallery__item--static');
          if (firstStatic) track.insertBefore(item, firstStatic);
          else track.appendChild(item);
        });
      }
    } catch (e) {
      console.warn('No se pudieron cargar las fotos:', e);
    }
  }


  /* ============================================================
     8. HELPERS
     ============================================================ */

  /* Toast de notificación */
  function showToast(message, duration = 3000) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    requestAnimationFrame(() => toast.classList.add('is-visible'));

    clearTimeout(toast._hideTimeout);
    toast._hideTimeout = setTimeout(() => toast.classList.remove('is-visible'), duration);
  }

  /* Escapar HTML para prevenir XSS */
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  /* Smooth scroll en links internos */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });

}); /* END DOMContentLoaded */
