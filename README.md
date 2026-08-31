# Фортэо — сайт мебельного центра

Статический многостраничный сайт для [Фортэо](https://vk.ru/mebel_fort) (Воронеж, Лиски).

## Страницы

| Файл | Назначение |
|------|------------|
| `index.html` | Главная |
| `catalog.html` | Каталог в наличии |
| `zakaz.html` | Мебель на заказ |
| `kontakty.html` | Контакты и заявка |

## Локальный запуск

```powershell
cd "C:\Users\popoo\Desktop\фортэо"
python -m http.server 8765
```

Откройте http://localhost:8765

## Данные

Единый источник — `js/data.js` (товары, телефоны, адреса, ссылки).  
После изменения данных обновите HTML, если там дублируются тексты в `<meta>` и Schema.org.

## Фото

Сейчас используется `assets/img/placeholder.svg`. Чтобы добавить реальное фото:

1. Положите файлы в `assets/img/` (WebP + JPG fallback рекомендуется).
2. В `js/data.js` укажите путь в поле `image` у товара.
3. Для hero на главной замените `src` в `<picture>` в `index.html`.

Пример для товара:

```javascript
image: 'assets/img/mirazh-romb.webp'
```

## Форма заявки

На странице контактов заявка отправляется **честно** через WhatsApp или VK — без фиктивного «успеха».

Опционально: Netlify Forms — добавьте в `<form>` атрибуты `data-netlify` и `name="contact"`, задеплойте на Netlify. Успех показывается только при ответе сервера `200`.

## Деплой на GitHub Pages

Сайт настроен для публикации из корня репозитория на GitHub Pages.

**URL:** https://teassty.github.io/forteo/

### Первичная настройка (уже выполнена)

```powershell
cd "C:\Users\popoo\Desktop\фортэо"
git init
git add .
git commit -m "Initial commit: static site for Forteo furniture store"
gh repo create forteo --public --source=. --remote=origin --push
gh api repos/TeasSty/forteo/pages -X POST -f "source[branch]=main" -f "source[path]=/"
```

### Обновление сайта после правок

```powershell
git add .
git commit -m "Описание изменений"
git push
```

GitHub Pages пересоберёт сайт автоматически (обычно 1–2 минуты).

### Что учесть

- В корне лежит `.nojekyll` — GitHub не пропускает файлы и папки с `_`.
- Канонические URL, `sitemap.xml`, `robots.txt` и `js/data.js` → `site.url` указывают на `https://teassty.github.io/forteo/`.
- Страница 404: GitHub Pages не подхватывает `404.html` для project-сайтов так же, как для user-сайтов; при необходимости настройте redirect в настройках репозитория.

## Деплой на Netlify (альтернатива)

```powershell
npx netlify deploy --prod --dir .
```

После деплоя на Netlify замените `https://teassty.github.io/forteo` на ваш домен в:

- `sitemap.xml`
- `robots.txt`
- `<link rel="canonical">` и `og:url` на всех страницах
- `js/data.js` → `site.url`

Опционально: Netlify Forms — добавьте в `<form>` атрибуты `data-netlify` и `name="contact"`, задеплойте на Netlify. Успех показывается только при ответе сервера `200`.

## Стек

HTML, CSS, JavaScript (без сборщика).  
Шрифты: Source Serif 4, IBM Plex Sans (Google Fonts).

## Источники фактов

- [VK: mebel_fort](https://vk.ru/mebel_fort)
- Карточки организаций (2GIS и аналоги)

Цены на сайте не указаны — только ссылка на VK-маркет.
