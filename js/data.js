/**
 * Единый источник данных — Фортэо
 * Источники: vk.ru/mebel_fort, 2GIS, карточки организаций
 */
const FORTEO = {
  brand: 'Фортэо',
  legalNote: 'Мебельный центр',
  tagline: 'Корпусная мебель в наличии и на заказ — от фабрики до вашего дома',

  offer: {
    headline: 'Мебель без переплат и без предоплаты',
    subline: 'Рассрочка без банка, бесплатный 3D-эскиз за 2 дня, гарантия до 3 лет',
    cta: 'Позвонить',
    ctaHref: 'tel:+79800935048',
  },

  utp: [
    { text: 'Рассрочка без % и без банка' },
    { text: 'Работаем без предоплаты' },
    { text: 'Бесплатный 3D-эскиз за 2 дня' },
    { text: 'Гарантия до 3 лет' },
    { text: 'Изготовление за 15 рабочих дней' },
    { text: 'Доставка по всей России' },
    { text: 'Складская программа по основным позициям' },
  ],

  phones: [
    {
      city: 'Воронеж',
      primary: true,
      tel: '+79800935048',
      display: '+7 (980) 093-50-48',
    },
    {
      city: 'Воронеж',
      primary: false,
      tel: '+79204389090',
      display: '+7 (920) 438-90-90',
    },
    {
      city: 'Лиски',
      primary: false,
      tel: '+79204407018',
      display: '+7 (920) 440-70-18',
    },
  ],

  whatsapp: '79800935048',
  vk: 'https://vk.ru/mebel_fort',
  vkMessage: 'https://vk.me/mebel_fort',

  locations: [
    {
      city: 'Воронеж',
      address: 'ул. 20-летия Октября, 123',
      detail: 'ТЦ «Европа», 4 этаж',
      district: 'Ленинский район',
      zip: '394006',
      hours: 'Ежедневно, 10:00–20:00',
      map: 'https://yandex.ru/maps/?text=Воронеж+20-летия+Октября+123+ТЦ+Европа',
      phone: '+79800935048',
    },
    {
      city: 'Лиски',
      address: 'Коммунистическая ул.',
      detail: '',
      hours: 'Ежедневно, с 10:00',
      map: 'https://yandex.ru/maps/?text=Лиски+Коммунистическая',
      phone: '+79204407018',
    },
  ],

  payment: ['Наличные', 'Банковская карта', 'QR-код', 'Рассрочка'],

  categories: [
    { id: 'kitchen', name: 'Кухни' },
    { id: 'bedroom', name: 'Спальни' },
    { id: 'living', name: 'Гостиные' },
    { id: 'wardrobe', name: 'Шкафы-купе' },
    { id: 'children', name: 'Детские' },
    { id: 'hallway', name: 'Прихожие' },
  ],

  // Товары — названия из VK-маркета; цены уточняются в группе
  products: [
    {
      id: 'mirazh-romb',
      name: 'Стул Мираж Ромб',
      category: 'chairs',
      inStock: true,
      vkLink: 'https://vk.ru/mebel_fort',
      image: null,
    },
    {
      id: 'mirazh-gray',
      name: 'Стул Мираж (серый)',
      category: 'chairs',
      inStock: true,
      vkLink: 'https://vk.ru/mebel_fort',
      image: null,
    },
    {
      id: 'mirazh-white',
      name: 'Стул Мираж (белый)',
      category: 'chairs',
      inStock: true,
      vkLink: 'https://vk.ru/mebel_fort',
      image: null,
    },
    {
      id: 'mirazh-croc',
      name: 'Стул Мираж (крокодил бежевый)',
      category: 'chairs',
      inStock: true,
      vkLink: 'https://vk.ru/mebel_fort',
      image: null,
    },
    {
      id: 'nord-table',
      name: 'Стол НОРД раздвижной',
      category: 'tables',
      inStock: true,
      vkLink: 'https://vk.ru/mebel_fort',
      image: null,
    },
  ],

  process: [
    {
      title: 'Замер',
      text: 'Бесплатный выезд замерщика. Обсуждаем задачу, материалы и бюджет.',
    },
    {
      title: '3D-эскиз',
      text: 'Готовим визуализацию за 2 дня — до начала производства.',
    },
    {
      title: 'Изготовление',
      text: 'Производство на фабрике, срок — 15 рабочих дней.',
    },
    {
      title: 'Доставка и сборка',
      text: 'Привозим и устанавливаем. Гарантия — до 3 лет.',
    },
  ],

  site: {
    url: 'https://teassty.github.io/forteo',
    email: null,
  },
};

if (typeof module !== 'undefined') module.exports = FORTEO;
