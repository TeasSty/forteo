/**
 * Фортэо — конфигурация магазина
 * Каталог товаров: js/products.json (источник VK market-173630729)
 */
const FORTEO = {
  brand: 'Фортэо',
  legalNote: 'Мебельный центр',
  tagline: 'Корпусная мебель в наличии и на заказ — от фабрики до вашего дома',

  stats: {
    products: 729,
    collections: 25,
    followers: 8041,
  },

  offer: {
    headline: 'Мебель без переплат и&nbsp;без предоплаты',
    subline: '729 позиций в наличии · рассрочка без банка · бесплатный 3D-эскиз за 2 дня',
    cta: 'Позвонить',
    ctaHref: 'tel:+79800935048',
  },

  utp: [
    { text: 'Рассрочка без % и без банка' },
    { text: 'Работаем без предоплаты' },
    { text: 'Бесплатный 3D-эскиз за 2 дня' },
    { text: 'Гарантия до 3 лет' },
    { text: '729 товаров в каталоге' },
    { text: 'Доставка по всей России' },
  ],

  phones: [
    { city: 'Воронеж', primary: true, tel: '+79800935048', display: '+7 (980) 093-50-48' },
    { city: 'Воронеж', primary: false, tel: '+79204389090', display: '+7 (920) 438-90-90' },
    { city: 'Лиски', primary: false, tel: '+79204407018', display: '+7 (920) 440-70-18' },
  ],

  whatsapp: '79800935048',
  vk: 'https://vk.ru/mebel_fort',
  vkMarket: 'https://vk.ru/market-173630729',
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

  productCategories: [
    { id: 'all', name: 'Все товары', icon: '◈' },
    { id: 'kitchen', name: 'Кухни', icon: '◫' },
    { id: 'living', name: 'Гостиные', icon: '▣' },
    { id: 'bedroom', name: 'Спальни', icon: '▤' },
    { id: 'wardrobe', name: 'Шкафы', icon: '▥' },
    { id: 'tables-chairs', name: 'Столы и стулья', icon: '◧' },
    { id: 'soft', name: 'Мягкая мебель', icon: '◨' },
    { id: 'hallway', name: 'Прихожие', icon: '◩' },
    { id: 'children', name: 'Детские', icon: '◪' },
    { id: 'other', name: 'Другое', icon: '◫' },
  ],

  collections: [
    { id: 'stoly-stulya', name: 'Столы и стулья', category: 'tables-chairs' },
    { id: 'kuhni-ksenia', name: 'Кухни Ксения', category: 'kitchen' },
    { id: 'kuhni-evroluks', name: 'Кухонные гарнитуры Евролюкс', category: 'kitchen' },
    { id: 'myagkaya', name: 'Мягкая мебель', category: 'soft' },
    { id: 'shkafy', name: 'Шкафы распашные', category: 'wardrobe' },
    { id: 'spalni-mdf', name: 'Спальни МДФ', category: 'bedroom' },
    { id: 'spalni-ldsp', name: 'Спальни ЛДСП', category: 'bedroom' },
    { id: 'gostinye', name: 'Гостиные МДФ', category: 'living' },
    { id: 'stenki', name: 'Стенки ЛДСП', category: 'living' },
  ],

  categories: [
    { id: 'kitchen', name: 'Кухни' },
    { id: 'bedroom', name: 'Спальни' },
    { id: 'living', name: 'Гостиные' },
    { id: 'wardrobe', name: 'Шкафы-купе' },
    { id: 'children', name: 'Детские' },
    { id: 'hallway', name: 'Прихожие' },
  ],

  featuredProductIds: [
    'стул-мираж-ромб-0',
    'стол-норд-раздвижной-4',
    'кухонный-гарнитур-2-8х1-2-м-угловой-ксения',
  ],

  process: [
    { title: 'Замер', text: 'Бесплатный выезд замерщика. Обсуждаем задачу, материалы и бюджет.' },
    { title: '3D-эскиз', text: 'Готовим визуализацию за 2 дня — до начала производства.' },
    { title: 'Изготовление', text: 'Производство на фабрике, срок — 15 рабочих дней.' },
    { title: 'Доставка и сборка', text: 'Привозим и устанавливаем. Гарантия — до 3 лет.' },
  ],

  site: {
    url: 'https://teassty.github.io/forteo',
    email: null,
  },
};

if (typeof module !== 'undefined') module.exports = FORTEO;
