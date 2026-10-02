/*
 * Line drawings for the product types. Each entry is the inside of a
 * 48 x 48 SVG. Drawn for this project, so no image files are needed.
 */
(function (root) {
  'use strict';

  const shapes = {
    laptop: '<rect x="10" y="11" width="28" height="19" rx="2"/><path d="M5 37h38l-4-7H9z"/>',
    monitor: '<rect x="6" y="9" width="36" height="23" rx="2"/><path d="M24 32v7M15 39h18"/>',
    drive: '<rect x="9" y="12" width="30" height="24" rx="4"/><path d="M15 30h9"/><circle cx="32" cy="30" r="1.5"/>',
    pendrive: '<rect x="8" y="17" width="24" height="14" rx="2"/><path d="M32 20h8v8h-8M14 24h8"/>',
    mouse: '<rect x="15" y="7" width="18" height="34" rx="9"/><path d="M24 7v12M15 19h18"/>',
    keyboard: '<rect x="5" y="14" width="38" height="20" rx="3"/><path d="M11 20h2M17 20h2M23 20h2M29 20h2M35 20h2M11 25h2M17 25h2M23 25h2M29 25h2M35 25h2M15 30h18"/>',
    pad: '<rect x="5" y="13" width="38" height="22" rx="4"/><rect x="28" y="18" width="8" height="12" rx="4"/>',
    bag: '<rect x="7" y="16" width="34" height="24" rx="3"/><path d="M17 16v-4a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4M7 27h34M21 27v4h6v-4"/>',
    fan: '<rect x="6" y="10" width="36" height="28" rx="3"/><circle cx="24" cy="24" r="9"/><path d="M24 15v18M15 24h18"/>',
    stand: '<path d="M7 27 37 11M9 40h30M15 40l5-20M33 40l-3-25"/>',
    hub: '<rect x="6" y="17" width="28" height="14" rx="3"/><path d="M34 24h9M12 24h3M19 24h3M26 24h3"/>',
    cable: '<rect x="6" y="6" width="9" height="9" rx="1.5"/><rect x="33" y="33" width="9" height="9" rx="1.5"/><path d="M10.5 15v6a6 6 0 0 0 6 6h15a6 6 0 0 1 6 6"/>',
    charger: '<rect x="12" y="16" width="24" height="24" rx="4"/><path d="M19 16V8M29 16V8M26 22l-5 7h6l-5 7"/>',
    headphones: '<path d="M9 30v-6a15 15 0 0 1 30 0v6"/><rect x="6" y="28" width="8" height="12" rx="3"/><rect x="34" y="28" width="8" height="12" rx="3"/>',
    earbuds: '<circle cx="15" cy="16" r="6"/><path d="M15 22v16"/><circle cx="33" cy="16" r="6"/><path d="M33 22v16"/>',
    speaker: '<rect x="12" y="6" width="24" height="36" rx="4"/><circle cx="24" cy="29" r="7"/><circle cx="24" cy="14" r="2.5"/>',
    phone: '<rect x="14" y="5" width="20" height="38" rx="4"/><path d="M21 37h6"/>',
    battery: '<rect x="7" y="14" width="31" height="20" rx="3"/><path d="M38 20h3v8h-3M24 18l-5 7h7l-5 7"/>',
    case: '<rect x="13" y="5" width="22" height="38" rx="5"/><rect x="17" y="9" width="8" height="8" rx="2"/>',
    watch: '<rect x="14" y="14" width="20" height="20" rx="5"/><path d="M18 14l1-8h10l1 8M18 34l1 8h10l1-8M24 20v4l3 2"/>'
  };

  function icon(name) {
    const shape = shapes[name] || shapes.laptop;
    return (
      '<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" ' +
      'stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      shape +
      '</svg>'
    );
  }

  root.ShopIcons = { icon: icon };
})(window);
