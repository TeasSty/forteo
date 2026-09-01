(() => {
  'use strict';

  const PLACEHOLDER = 'assets/img/placeholder.svg';
  const PAGE_SIZE = 24;
  const state = {
    products: [],
    filtered: [],
    page: 1,
    category: 'all',
    query: '',
    sort: 'default',
    priceMin: null,
    priceMax: null,
  };

  const fmt = n => n.toLocaleString('ru-RU') + ' ₽';

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function setParam(name, value) {
    const url = new URL(window.location.href);
    if (!value || value === 'all' || value === 'default') url.searchParams.delete(name);
    else url.searchParams.set(name, value);
    history.replaceState(null, '', url);
  }

  function categoryLabel(id) {
    return FORTEO.productCategories.find(c => c.id === id)?.name || 'Каталог';
  }

  /** Лучший доступный URL изображения */
  function productImageSrc(product) {
    return product.imageLocal || product.imageHd || product.image || PLACEHOLDER;
  }

  function productImage(product, opts = {}) {
    const src = productImageSrc(product);
    const w = opts.large ? 360 : 180;
    const h = opts.large ? 360 : 180;
    return `<img class="product-img" src="${src}" alt="${escapeHtml(product.name)}" width="${w}" height="${h}" loading="lazy" decoding="async">`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function orderMessage(product) {
    return encodeURIComponent(`Здравствуйте! Интересует товар с сайта Фортэо:\n${product.name}\nЦена: ${product.priceFormatted || fmt(product.price)}`);
  }

  function renderProductCard(product) {
    const price = product.priceFormatted || (product.price ? fmt(product.price) : 'Цена по запросу');
    return `
      <article class="product-card" data-id="${escapeHtml(product.id)}">
        <button class="product-card__link" type="button" aria-label="Открыть: ${escapeHtml(product.name)}">
          <div class="product-card__media">${productImage(product)}</div>
          <div class="product-card__body">
            <span class="product-card__tag">${product.inStock ? 'В наличии' : 'На заказ'}</span>
            <h3>${escapeHtml(product.name)}</h3>
            <p class="product-card__price">${price}</p>
          </div>
        </button>
        <div class="product-card__actions">
          <a class="btn btn--primary btn--sm" href="https://wa.me/${FORTEO.whatsapp}?text=${orderMessage(product)}" target="_blank" rel="noopener noreferrer">Заказать</a>
          <a class="btn btn--ghost btn--sm" href="${FORTEO.vkMessage}?text=${orderMessage(product)}" target="_blank" rel="noopener noreferrer">VK</a>
        </div>
      </article>`;
  }

  function applyFilters() {
    let list = [...state.products];

    if (state.category !== 'all') {
      list = list.filter(p => p.category === state.category);
    }

    if (state.query) {
      const q = state.query.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }

    if (state.priceMin != null) list = list.filter(p => p.price >= state.priceMin);
    if (state.priceMax != null) list = list.filter(p => p.price <= state.priceMax);

    switch (state.sort) {
      case 'price-asc':
        list.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-desc':
        list.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        break;
      default:
        break;
    }

    state.filtered = list;
    if (state.page > Math.max(1, Math.ceil(list.length / PAGE_SIZE))) state.page = 1;
  }

  function renderCatalog() {
    const grid = document.getElementById('catalog-grid');
    const countEl = document.getElementById('catalog-count');
    const pagination = document.getElementById('catalog-pagination');
    if (!grid) return;

    applyFilters();

    const total = state.filtered.length;
    const start = (state.page - 1) * PAGE_SIZE;
    const pageItems = state.filtered.slice(start, start + PAGE_SIZE);

    if (countEl) {
      countEl.textContent = total
        ? `${total} ${pluralize(total, 'товар', 'товара', 'товаров')}`
        : 'Ничего не найдено';
    }

    grid.innerHTML = pageItems.length
      ? pageItems.map(renderProductCard).join('')
      : `<div class="catalog-empty"><p>По вашему запросу ничего не найдено. Попробуйте другую категорию или <a href="tel:+79800935048">позвоните нам</a>.</p></div>`;

    grid.querySelectorAll('.product-card__link').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.product-card')?.dataset.id;
        const product = state.products.find(p => p.id === id);
        if (product) openModal(product);
      });
    });

    renderPagination(pagination, total);
  }

  function pluralize(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19) return many;
    if (mod10 === 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return few;
    return many;
  }

  function renderPagination(container, total) {
    if (!container) return;
    const pages = Math.ceil(total / PAGE_SIZE);
    if (pages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '<nav class="pagination" aria-label="Страницы каталога">';
    if (state.page > 1) {
      html += `<button type="button" class="pagination__btn" data-page="${state.page - 1}">← Назад</button>`;
    }
    html += `<span class="pagination__info">${state.page} / ${pages}</span>`;
    if (state.page < pages) {
      html += `<button type="button" class="pagination__btn" data-page="${state.page + 1}">Далее →</button>`;
    }
    html += '</nav>';
    container.innerHTML = html;

    container.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.page = Number(btn.dataset.page);
        renderCatalog();
        document.getElementById('catalog-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function renderCategoryFilters() {
    const nav = document.getElementById('catalog-filters');
    if (!nav) return;

    nav.innerHTML = FORTEO.productCategories.map(cat => {
      const count = cat.id === 'all'
        ? state.products.length
        : state.products.filter(p => p.category === cat.id).length;
      const active = state.category === cat.id ? ' is-active' : '';
      return `<button type="button" class="filter-chip${active}" data-category="${cat.id}">${cat.name}<span>${count}</span></button>`;
    }).join('');

    nav.querySelectorAll('[data-category]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.category = btn.dataset.category;
        state.page = 1;
        setParam('cat', state.category);
        renderCategoryFilters();
        renderCatalog();
        updatePageTitle();
      });
    });
  }

  function updatePageTitle() {
    const sub = document.getElementById('catalog-subtitle');
    if (sub && state.category !== 'all') {
      sub.textContent = categoryLabel(state.category) + ' — актуальные цены и фото из каталога Фортэо.';
    }
  }

  function openModal(product) {
    const modal = document.getElementById('product-modal');
    if (!modal) return;

    modal.querySelector('.product-modal__title').textContent = product.name;
    modal.querySelector('.product-modal__price').textContent = product.priceFormatted || fmt(product.price);
    modal.querySelector('.product-modal__category').textContent = categoryLabel(product.category);
    modal.querySelector('.product-modal__img').src = productImageSrc(product);
    modal.querySelector('.product-modal__img').alt = product.name;
    modal.querySelector('.product-modal__wa').href = `https://wa.me/${FORTEO.whatsapp}?text=${orderMessage(product)}`;
    modal.querySelector('.product-modal__vk').href = `${FORTEO.vkMessage}?text=${orderMessage(product)}`;
    modal.querySelector('.product-modal__phone').href = FORTEO.offer.ctaHref;

    modal.hidden = false;
    document.body.classList.add('modal-open');
    modal.querySelector('.product-modal__close')?.focus();
  }

  function closeModal() {
    const modal = document.getElementById('product-modal');
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  }

  function initModal() {
    const modal = document.getElementById('product-modal');
    if (!modal) return;

    modal.querySelector('.product-modal__backdrop')?.addEventListener('click', closeModal);
    modal.querySelector('.product-modal__close')?.addEventListener('click', closeModal);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !modal.hidden) closeModal();
    });
  }

  function initControls() {
    const search = document.getElementById('catalog-search');
    const sort = document.getElementById('catalog-sort');
    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');

    search?.addEventListener('input', () => {
      state.query = search.value.trim();
      state.page = 1;
      renderCatalog();
    });

    sort?.addEventListener('change', () => {
      state.sort = sort.value;
      state.page = 1;
      setParam('sort', state.sort);
      renderCatalog();
    });

    const applyPrice = () => {
      state.priceMin = priceMin?.value ? Number(priceMin.value) : null;
      state.priceMax = priceMax?.value ? Number(priceMax.value) : null;
      state.page = 1;
      renderCatalog();
    };
    priceMin?.addEventListener('change', applyPrice);
    priceMax?.addEventListener('change', applyPrice);

    const cat = getParam('cat');
    if (cat) state.category = cat;
    const sortParam = getParam('sort');
    if (sortParam) {
      state.sort = sortParam;
      if (sort) sort.value = sortParam;
    }
  }

  async function loadProducts() {
    const res = await fetch('js/products.json');
    if (!res.ok) throw new Error('products.json not found');
    const data = await res.json();
    state.products = data.products || [];
    if (typeof FORTEO !== 'undefined') {
      FORTEO.stats.products = state.products.length;
    }
    return data;
  }

  async function initCatalogPage() {
    if (!document.getElementById('catalog-grid')) return;

    const loading = document.getElementById('catalog-loading');
    try {
      await loadProducts();
      if (loading) loading.hidden = true;
      renderCategoryFilters();
      renderCatalog();
      initControls();
      initModal();
      updatePageTitle();

      const highlight = getParam('highlight');
      if (highlight) {
        const product = state.products.find(p => p.id === highlight);
        if (product) openModal(product);
      }
    } catch (err) {
      if (loading) loading.textContent = 'Не удалось загрузить каталог. Откройте vk.ru/mebel_fort или позвоните нам.';
      console.error(err);
    }
  }

  async function renderFeatured() {
    const grid = document.getElementById('featured-grid');
    if (!grid) return;

    try {
      const data = await loadProducts();
      const featured = pickFeatured(data.products, 12);
      grid.innerHTML = featured.map(p => `<div class="swiper-slide">${renderProductCard(p)}</div>`).join('');

      grid.querySelectorAll('.product-card__link').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.closest('.product-card')?.dataset.id;
          window.location.href = `catalog.html?highlight=${encodeURIComponent(id || '')}`;
        });
      });

      if (typeof Swiper !== 'undefined' && document.querySelector('.featured-swiper')) {
        new Swiper('.featured-swiper', {
          slidesPerView: 1.2,
          spaceBetween: 16,
          navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
          breakpoints: {
            640: { slidesPerView: 2.2 },
            900: { slidesPerView: 3.2 },
            1200: { slidesPerView: 4 },
          },
        });
      }
    } catch {
      grid.innerHTML = '<div class="swiper-slide"><p class="catalog-loading"><a href="catalog.html">Перейти в каталог →</a></p></div>';
    }
  }

  function pickFeatured(products, n) {
    const picks = [];
    const buckets = ['tables-chairs', 'kitchen', 'living', 'bedroom', 'soft'];
    for (const cat of buckets) {
      const item = products.find(p => p.category === cat && (p.imageLocal || p.image));
      if (item) picks.push(item);
    }
    for (const p of products) {
      if ((p.imageLocal || p.image) && !picks.includes(p) && p.price >= 20000) picks.push(p);
      if (picks.length >= n) break;
    }
    for (const p of products) {
      if ((p.imageLocal || p.image) && !picks.includes(p)) picks.push(p);
      if (picks.length >= n) break;
    }
    return picks.slice(0, n);
  }

  /** Изображение категории из первого товара */
  function categoryCoverImage(products, categoryId) {
    const p = products.find(x => x.category === categoryId && (x.imageLocal || x.image));
    return p ? productImageSrc(p) : null;
  }

  window.ForteoCatalog = {
    initCatalogPage,
    renderFeatured,
    loadProducts,
    productImageSrc,
    categoryCoverImage,
    fmt,
  };
})();
