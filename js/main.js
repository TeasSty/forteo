(() => {
  'use strict';

  const PLACEHOLDER = 'assets/img/placeholder.svg';

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

  function productImage(product) {
    const src = product.image || PLACEHOLDER;
    return `
      <picture>
        <source type="image/svg+xml" srcset="${src}">
        <img src="${src}" alt="${product.name}" width="800" height="600" loading="lazy" decoding="async">
      </picture>`;
  }

  function renderCatalog() {
    const grid = document.getElementById('catalog-grid');
    if (!grid || typeof FORTEO === 'undefined') return;

    grid.innerHTML = FORTEO.products.map(p => `
      <article class="product-card" id="${p.id}">
        <div class="product-card__media">
          ${productImage(p)}
        </div>
        <div class="product-card__body">
          <span class="product-card__tag">${p.inStock ? 'В наличии' : 'На заказ'}</span>
          <h3>${p.name}</h3>
          <p>Цена и наличие — в группе ВКонтакте</p>
          <a href="${p.vkLink}" target="_blank" rel="noopener noreferrer">Уточнить в VK →</a>
        </div>
      </article>
    `).join('');
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
        showStatus('Выберите способ связи ниже — WhatsApp или VK. Отправка на сервер не настроена.', 'info');
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
        showStatus('Не удалось отправить форму. Позвоните или напишите в WhatsApp / VK — кнопки ниже.', 'error');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Отправить заявку'; }
      }
    });
  }

  initNav();
  renderCatalog();
  initForm();
})();
