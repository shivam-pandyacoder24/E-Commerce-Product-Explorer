/*
 * SHOP DATA
 * ---------
 * Plain data only. js/store.js loads this into the data structures.
 * All brands and products are made up for the project.
 *
 *   categories  [parent id, id, name]            -> category tree
 *   products    array of product objects         -> catalogue array
 *   related     [product id, product id] pairs   -> edges of the graph
 */
(function (root) {
  'use strict';

  const categories = [
    ['all', 'computers', 'Computers'],
    ['computers', 'laptops', 'Laptops'],
    ['computers', 'monitors', 'Monitors'],
    ['computers', 'storage', 'Storage'],
    ['all', 'accessories', 'Computer accessories'],
    ['accessories', 'input', 'Keyboards and mice'],
    ['accessories', 'laptop-care', 'Laptop bags and stands'],
    ['accessories', 'cables', 'Cables and hubs'],
    ['all', 'audio', 'Audio'],
    ['audio', 'headphones', 'Headphones'],
    ['audio', 'speakers', 'Speakers'],
    ['all', 'mobiles', 'Mobiles'],
    ['mobiles', 'smartphones', 'Smartphones'],
    ['mobiles', 'mobile-accessories', 'Mobile accessories'],
    ['all', 'wearables', 'Wearables']
  ];

  const products = [
    // Laptops
    { id: 4821, name: 'AeroBook 14 Laptop', brand: 'Aero', category: 'laptops', icon: 'laptop', price: 54990, rating: 4.5, ratings: 1284, specs: '14-inch display, 16 GB RAM, 512 GB SSD', tags: 'laptop notebook computer student' },
    { id: 2390, name: 'AeroBook Pro 16 Laptop', brand: 'Aero', category: 'laptops', icon: 'laptop', price: 92490, rating: 4.7, ratings: 642, specs: '16-inch display, 32 GB RAM, 1 TB SSD', tags: 'laptop notebook computer coding editing' },
    { id: 7154, name: 'Nimbus Lite 15 Laptop', brand: 'Nimbus', category: 'laptops', icon: 'laptop', price: 38990, rating: 4.1, ratings: 2310, specs: '15.6-inch display, 8 GB RAM, 512 GB SSD', tags: 'laptop notebook computer budget' },

    // Monitors
    { id: 3068, name: 'Pixelon 24 Full HD Monitor', brand: 'Pixelon', category: 'monitors', icon: 'monitor', price: 10499, rating: 4.3, ratings: 978, specs: '24-inch IPS panel, 75 Hz', tags: 'monitor display screen' },
    { id: 8815, name: 'Pixelon 27 QHD Monitor', brand: 'Pixelon', category: 'monitors', icon: 'monitor', price: 21999, rating: 4.6, ratings: 431, specs: '27-inch IPS panel, 165 Hz, USB-C', tags: 'monitor display screen gaming' },

    // Storage
    { id: 1547, name: 'Volt 1 TB Portable SSD', brand: 'Volt', category: 'storage', icon: 'drive', price: 7299, rating: 4.6, ratings: 1820, specs: 'USB-C, up to 1,000 MB/s', tags: 'ssd storage drive backup' },
    { id: 6203, name: 'Volt 2 TB External Hard Drive', brand: 'Volt', category: 'storage', icon: 'drive', price: 5899, rating: 4.2, ratings: 3105, specs: 'USB 3.0, 2.5-inch', tags: 'hdd hard disk storage drive backup' },
    { id: 9471, name: 'Volt 64 GB Pen Drive', brand: 'Volt', category: 'storage', icon: 'pendrive', price: 549, rating: 4.0, ratings: 5412, specs: 'USB 3.1, metal body', tags: 'pendrive usb flash storage' },

    // Keyboards and mice
    { id: 5332, name: 'Kite Wireless Mouse', brand: 'Kite', category: 'input', icon: 'mouse', price: 699, rating: 4.3, ratings: 8740, specs: '2.4 GHz, silent clicks, 12-month battery', tags: 'mouse wireless' },
    { id: 1189, name: 'Kite Ergo Vertical Mouse', brand: 'Kite', category: 'input', icon: 'mouse', price: 1899, rating: 4.4, ratings: 1163, specs: 'Vertical grip, Bluetooth, rechargeable', tags: 'mouse ergonomic wireless' },
    { id: 7726, name: 'Kite Mechanical Keyboard', brand: 'Kite', category: 'input', icon: 'keyboard', price: 3499, rating: 4.6, ratings: 2054, specs: 'Tenkeyless, tactile switches, backlit', tags: 'keyboard mechanical typing coding' },
    { id: 4045, name: 'Kite Slim Wireless Keyboard', brand: 'Kite', category: 'input', icon: 'keyboard', price: 1299, rating: 4.1, ratings: 3390, specs: 'Full size, quiet keys, Bluetooth', tags: 'keyboard wireless typing' },
    { id: 2874, name: 'Kite Mouse Pad XL', brand: 'Kite', category: 'input', icon: 'pad', price: 399, rating: 4.5, ratings: 6021, specs: '800 x 300 mm, stitched edges', tags: 'mousepad desk mat' },

    // Laptop bags and stands
    { id: 6610, name: 'Yatra Laptop Bag 15.6', brand: 'Yatra', category: 'laptop-care', icon: 'bag', price: 1499, rating: 4.4, ratings: 4876, specs: 'Padded, water-resistant, fits 15.6-inch', tags: 'laptop bag backpack carry' },
    { id: 3391, name: 'Yatra Laptop Sleeve 14', brand: 'Yatra', category: 'laptop-care', icon: 'bag', price: 649, rating: 4.2, ratings: 2208, specs: 'Soft lining, fits 14-inch', tags: 'laptop sleeve cover carry' },
    { id: 8259, name: 'Hawa Cooling Pad', brand: 'Hawa', category: 'laptop-care', icon: 'fan', price: 1199, rating: 4.0, ratings: 1947, specs: 'Two quiet fans, USB powered', tags: 'laptop cooling pad cooler fan' },
    { id: 5907, name: 'Tilt Aluminium Laptop Stand', brand: 'Tilt', category: 'laptop-care', icon: 'stand', price: 1599, rating: 4.5, ratings: 3312, specs: 'Six height levels, folds flat', tags: 'laptop stand riser desk' },

    // Cables and hubs
    { id: 1763, name: 'Linka 7-in-1 USB-C Hub', brand: 'Linka', category: 'cables', icon: 'hub', price: 2299, rating: 4.3, ratings: 1576, specs: 'HDMI, 3 USB-A, SD card, 100 W pass-through', tags: 'usb hub dock adapter' },
    { id: 9038, name: 'Linka HDMI Cable 2 m', brand: 'Linka', category: 'cables', icon: 'cable', price: 349, rating: 4.4, ratings: 7230, specs: '4K at 60 Hz, braided', tags: 'hdmi cable monitor' },
    { id: 4486, name: 'Linka 65 W USB-C Charger', brand: 'Linka', category: 'cables', icon: 'charger', price: 1799, rating: 4.5, ratings: 2689, specs: 'GaN, charges laptops and phones', tags: 'charger adapter usb power laptop' },
    { id: 2618, name: 'Linka USB-C Cable 1 m', brand: 'Linka', category: 'cables', icon: 'cable', price: 299, rating: 4.2, ratings: 9104, specs: '60 W, braided', tags: 'usb cable charging' },

    // Headphones
    { id: 7342, name: 'Dhwani Wireless Headphones', brand: 'Dhwani', category: 'headphones', icon: 'headphones', price: 2999, rating: 4.4, ratings: 5530, specs: 'Over-ear, 40-hour battery', tags: 'headphones wireless bluetooth music' },
    { id: 3725, name: 'Dhwani ANC Headphones', brand: 'Dhwani', category: 'headphones', icon: 'headphones', price: 6999, rating: 4.7, ratings: 1398, specs: 'Noise cancelling, 30-hour battery', tags: 'headphones wireless noise cancelling music' },
    { id: 5580, name: 'Dhwani True Wireless Earbuds', brand: 'Dhwani', category: 'headphones', icon: 'earbuds', price: 1799, rating: 4.2, ratings: 11260, specs: 'In-ear, charging case, 28 hours total', tags: 'earbuds wireless bluetooth music' },
    { id: 8093, name: 'Dhwani Wired Earphones', brand: 'Dhwani', category: 'headphones', icon: 'earbuds', price: 499, rating: 3.9, ratings: 14872, specs: '3.5 mm jack, inline mic', tags: 'earphones wired music' },

    // Speakers
    { id: 1926, name: 'Tarang Bluetooth Speaker', brand: 'Tarang', category: 'speakers', icon: 'speaker', price: 2499, rating: 4.3, ratings: 3847, specs: '20 W, splash-proof, 12-hour battery', tags: 'speaker bluetooth portable music' },
    { id: 6877, name: 'Tarang Desktop Speakers 2.0', brand: 'Tarang', category: 'speakers', icon: 'speaker', price: 1399, rating: 4.0, ratings: 2166, specs: 'USB powered, 3.5 mm input', tags: 'speaker desktop computer music' },

    // Smartphones
    { id: 4270, name: 'Nova M5 Smartphone', brand: 'Nova', category: 'smartphones', icon: 'phone', price: 16999, rating: 4.3, ratings: 9215, specs: '6.6-inch, 8 GB RAM, 128 GB, 5G', tags: 'phone smartphone mobile' },
    { id: 9654, name: 'Nova X Pro Smartphone', brand: 'Nova', category: 'smartphones', icon: 'phone', price: 42999, rating: 4.6, ratings: 2780, specs: '6.7-inch OLED, 12 GB RAM, 256 GB, 5G', tags: 'phone smartphone mobile flagship camera' },
    { id: 3142, name: 'Nova Lite Smartphone', brand: 'Nova', category: 'smartphones', icon: 'phone', price: 9499, rating: 4.0, ratings: 13450, specs: '6.5-inch, 4 GB RAM, 64 GB', tags: 'phone smartphone mobile budget' },

    // Mobile accessories
    { id: 5719, name: 'Urja 10000 mAh Power Bank', brand: 'Urja', category: 'mobile-accessories', icon: 'battery', price: 1099, rating: 4.4, ratings: 16032, specs: '22.5 W fast charging, two ports', tags: 'power bank battery charger mobile' },
    { id: 2055, name: 'Kavach Phone Case', brand: 'Kavach', category: 'mobile-accessories', icon: 'case', price: 349, rating: 4.1, ratings: 4409, specs: 'Shock-absorbing, clear back', tags: 'phone case cover mobile' },
    { id: 7968, name: 'Kavach Tempered Glass', brand: 'Kavach', category: 'mobile-accessories', icon: 'case', price: 199, rating: 4.0, ratings: 8817, specs: 'Scratch-resistant screen guard', tags: 'screen guard protector glass mobile' },
    { id: 6431, name: 'Urja 20 W Fast Charger', brand: 'Urja', category: 'mobile-accessories', icon: 'charger', price: 799, rating: 4.3, ratings: 6258, specs: 'USB-C wall charger', tags: 'charger adapter mobile phone' },

    // Wearables
    { id: 8502, name: 'Pulse Smartwatch', brand: 'Pulse', category: 'wearables', icon: 'watch', price: 3999, rating: 4.2, ratings: 7391, specs: 'AMOLED, calling, 7-day battery', tags: 'watch smartwatch fitness wearable' },
    { id: 1304, name: 'Pulse Fitness Band', brand: 'Pulse', category: 'wearables', icon: 'watch', price: 1999, rating: 4.1, ratings: 5127, specs: 'Heart rate, sleep tracking, 14-day battery', tags: 'band fitness tracker wearable' }
  ];

  // "Commonly bought together" pairs. Each pair is one edge of the graph.
  const related = [
    // Laptop -> Laptop Bag, Mouse, Keyboard, Cooling Pad
    [4821, 6610], [4821, 5332], [4821, 4045], [4821, 8259], [4821, 3391],
    [2390, 6610], [2390, 1189], [2390, 7726], [2390, 8259], [2390, 1763], [2390, 5907],
    [7154, 6610], [7154, 5332], [7154, 4045], [7154, 8259],
    // Monitors
    [3068, 9038], [3068, 6877], [3068, 5907],
    [8815, 9038], [8815, 1763], [8815, 7726],
    // Storage
    [1547, 2618], [1547, 1763], [6203, 1763], [9471, 1763],
    // Keyboards and mice
    [5332, 2874], [5332, 4045], [1189, 2874], [7726, 2874], [7726, 1189],
    // Stands, hubs, chargers
    [5907, 4045], [5907, 8259], [1763, 9038],
    [4486, 2618], [4486, 4821], [4486, 2390],
    // Audio
    [7342, 4270], [7342, 1926], [3725, 9654], [3725, 2390],
    [5580, 4270], [5580, 9654], [5580, 3142], [8093, 3142],
    [1926, 4270], [1926, 5719],
    // Phones
    [4270, 2055], [4270, 7968], [4270, 6431], [4270, 5719],
    [9654, 2055], [9654, 7968], [9654, 6431],
    [3142, 2055], [3142, 7968], [3142, 5719],
    [6431, 2618],
    // Wearables
    [8502, 9654], [8502, 5580], [1304, 4270], [1304, 5580]
  ];

  const data = { categories: categories, products: products, related: related };

  root.ShopData = data;
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
})(typeof window !== 'undefined' ? window : globalThis);
