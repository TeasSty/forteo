(() => {
  'use strict';

  function initNav() {
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.site-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function initHeaderScroll() {
    const header = document.getElementById('site-header');
    if (!header || !header.classList.contains('site-header--hero')) return;

    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 60);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function buildMessage(data) {
    const lines = ['Здравствуйте! Заявка с сайта Фортэо.'];
    if (data.name) lines.push(`Имя: ${data.name}`);
    if (data.phone) lines.push(`Телефон: ${data.phone}`);
    if (data.topic) lines.push(`Интересует: ${data.topic}`);
    if (data.message) lines.push(data.message);
    return lines.join('\n');
  }

  function initForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const status = document.getElementById('form-status');
    const waBtn = document.getElementById('form-wa');
    const vkBtn = document.getElementById('form-vk');

    function getData() {
      return {
        name: form.name?.value.trim() || '',
        phone: form.phone?.value.trim() || '',
        topic: form.topic?.value.trim() || '',
        message: form.message?.value.trim() || '',
      };
    }

    function validate(data) {
      if (!data.phone && !data.name) {
        showStatus('Укажите имя или телефон, чтобы мы могли связаться.', 'error');
        return false;
      }
      return true;
    }

    function showStatus(text, type) {
      if (!status) return;
      status.textContent = text;
      status.className = `form-status is-visible form-status--${type}`;
    }

    function updateLinks() {
      const data = getData();
      const text = encodeURIComponent(buildMessage(data));
      if (waBtn && typeof FORTEO !== 'undefined') {
        waBtn.href = `https://wa.me/${FORTEO.whatsapp}?text=${text}`;
      }
      if (vkBtn && typeof FORTEO !== 'undefined') {
        vkBtn.href = `${FORTEO.vkMessage}?text=${text}`;
      }
    }

    form.querySelectorAll('input, textarea, select').forEach(el => {
      el.addEventListener('input', updateLinks);
    });
    updateLinks();

    waBtn?.addEventListener('click', e => {
      if (!validate(getData())) e.preventDefault();
    });
    vkBtn?.addEventListener('click', e => {
      if (!validate(getData())) e.preventDefault();
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data = getData();
      if (!validate(data)) return;

      const isNetlify = form.hasAttribute('data-netlify');
      if (!isNetlify) {
        showStatus('Выберите способ связи ниже — WhatsApp или VK.', 'info');
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Отправка…'; }

      try {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString(),
        });
        if (res.ok) {
          showStatus('Заявка отправлена. Мы перезвоним в рабочее время.', 'info');
          form.reset();
          updateLinks();
        } else {
          throw new Error('Server error');
        }
      } catch {
        showStatus('Не удалось отправить форму. Позвоните или напишите в WhatsApp / VK.', 'error');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Отправить заявку'; }
      }
    });
  }

  async function renderCategoryTiles() {
    const grid = document.getElementById('category-tiles');
    if (!grid || typeof FORTEO === 'undefined' || !window.ForteoCatalog) return;

    try {
      const data = await ForteoCatalog.loadProducts();
      const cats = FORTEO.productCategories
        .filter(c => c.id !== 'all' && c.id !== 'other')
        .slice(0, 8);

      grid.innerHTML = cats.map(cat => {
        const count = data.products.filter(p => p.category === cat.id).length;
        const img = ForteoCatalog.categoryCoverImage(data.products, cat.id);
        const bg = img
          ? `<div class="category-tile__bg"><img src="${img}" alt="" loading="lazy" decoding="async"></div>`
          : '';
        return `
          <a class="category-tile" href="catalog.html?cat=${cat.id}">
            ${bg}
            <span class="category-tile__name">${cat.name}</span>
            <span class="category-tile__count">${count} товаров</span>
          </a>`;
      }).join('');
    } catch {
      grid.innerHTML = FORTEO.productCategories
        .filter(c => c.id !== 'all' && c.id !== 'other')
        .slice(0, 8)
        .map(cat => `
          <a class="category-tile" href="catalog.html?cat=${cat.id}">
            <span class="category-tile__name">${cat.name}</span>
          </a>
        `).join('');
    }
  }

  async function setHeroImage() {
    const img = document.getElementById('hero-product-img');
    const bg = document.getElementById('hero-bg');
    if (!img || !window.ForteoCatalog) return;

    try {
      const data = await ForteoCatalog.loadProducts();
      const hero = data.products.find(p => p.category === 'kitchen' && (p.imageLocal || p.image) && p.price > 45000)
        || data.products.find(p => p.category === 'living' && (p.imageLocal || p.image))
        || data.products.find(p => p.imageLocal || p.image);

      if (hero) {
        const src = ForteoCatalog.productImageSrc(hero);
        img.src = src;
        img.alt = hero.name;
        if (bg) {
          bg.innerHTML = `<img src="${src}" alt="" loading="eager">`;
        }
        const cap = document.getElementById('hero-caption');
        if (cap) cap.textContent = `${hero.name} — ${hero.priceFormatted || ''}`;
      }
    } catch { /* placeholder stays */ }
  }

  initNav();
  initHeaderScroll();
  initForm();
  renderCategoryTiles();
  setHeroImage();

  if (window.ForteoCatalog) {
    ForteoCatalog.renderFeatured();
    ForteoCatalog.initCatalogPage();
  }
})();
