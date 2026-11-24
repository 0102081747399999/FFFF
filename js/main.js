/**
 * متجر ملابس رجالي كاجوال — الواجهة والطلب الفوري السريع
 * Storefront Catalog, Fast Direct Order Modal & Slide-Over Cart
 */

import { PRODUCTS, formatEGP } from './products.js';
import { cart } from './cart.js';
import { saveOrder } from './firebase-config.js';

// State per product card
const selectedSizes = {};
const selectedColors = {};
let activeFastOrderProduct = null;
let fastOrderGpsUrl = '';

document.addEventListener('DOMContentLoaded', () => {
  initCatalog();
  initCategoryFilters();
  initCartDrawer();
  initQuickView();
  initFastOrderModal();
  updateCartBadge();

  window.addEventListener('cartChanged', () => {
    updateCartBadge();
    renderCartDrawerItems();
  });
});

/**
 * Initialize catalog with default size and color per product
 */
function initCatalog() {
  PRODUCTS.forEach(p => {
    selectedSizes[p.id] = p.sizes[0] || 'L';
    selectedColors[p.id] = p.colors[0]?.name || '';
  });
  renderProducts('all');
}

/**
 * Render product cards with colors, sizes, and instant buy button
 */
export function renderProducts(filterCategory = 'all') {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const filtered = filterCategory === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === filterCategory);

  grid.innerHTML = filtered.map(p => {
    const activeColorName = selectedColors[p.id] || p.colors[0]?.name;
    const activeSize = selectedSizes[p.id] || p.sizes[0];

    return `
      <article class="h-full bg-surface-container border border-outline hover:border-primary rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-md card-hover group">
        <div>
          <!-- Product Image & Overlay Badges -->
          <div class="relative aspect-[3/4] bg-surface-container-low overflow-hidden">
            <img 
              src="${p.image}" 
              alt="${p.title}" 
              loading="lazy"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            >
            
            ${p.badge ? `
              <span class="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-primary text-on-primary font-label text-[11px] font-black shadow-md">
                ${p.badge}
              </span>
            ` : ''}

            <button
              type="button"
              onclick="window.openQuickViewModal('${p.id}')"
              class="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-surface/90 border border-outline text-on-surface font-label text-xs font-bold hover:border-primary hover:text-primary transition-colors backdrop-blur-sm shadow-md"
            >
              معاينة سريعة
            </button>
          </div>

          <!-- Product Details -->
          <div class="p-4 flex flex-col gap-2.5">
            <span class="font-label text-xs font-bold text-primary">${p.fabric}</span>
            <h3 class="font-title text-sm font-bold text-on-surface line-clamp-1">${p.title}</h3>
            
            <!-- Pricing -->
            <div class="flex items-baseline gap-2 pt-0.5">
              <span class="font-headline text-xl text-primary font-black tabular-nums">${formatEGP(p.price)}</span>
              ${p.oldPrice ? `
                <span class="font-mono text-xs text-on-surface-variant line-through tabular-nums">${formatEGP(p.oldPrice)}</span>
              ` : ''}
            </div>

            <!-- Color Swatches Selection -->
            <div class="flex flex-col gap-1 pt-1">
              <span class="text-[11px] font-semibold text-on-surface-variant">اللون: <strong class="text-on-surface text-color-${p.id}">${activeColorName}</strong></span>
              <div class="flex items-center gap-2" role="group" aria-label="الألوان المتوفرة">
                ${p.colors.map(c => `
                  <button
                    type="button"
                    title="${c.name}"
                    onclick="window.selectProductColor('${p.id}', '${c.name}')"
                    class="color-btn-${p.id} w-5 h-5 rounded-full border ${c.name === activeColorName ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface border-white scale-110' : 'border-outline'} ${c.class} transition-all cursor-pointer"
                    data-color="${c.name}"
                  ></button>
                `).join('')}
              </div>
            </div>

            <!-- Sizes Selection -->
            <div class="flex flex-col gap-1 pt-1">
              <span class="text-[11px] font-semibold text-on-surface-variant">المقاس:</span>
              <div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="المقاسات">
                ${p.sizes.map(s => `
                  <button
                    type="button"
                    onclick="window.selectCardSize('${p.id}', '${s}')"
                    class="size-pill-${p.id} px-2.5 py-1 rounded-md font-mono text-xs font-bold border transition-all cursor-pointer ${s === activeSize ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low text-on-surface-variant border-outline hover:border-primary'}"
                    data-size="${s}"
                  >${s}</button>
                `).join('')}
              </div>
            </div>

          </div>
        </div>

        <!-- Action CTAs: Fast Buy & Add to Cart -->
        <footer class="p-4 pt-1 flex flex-col gap-2">
          <!-- Instant Buy Button (One-Click Checkout) -->
          <button
            type="button"
            onclick="window.triggerFastOrder('${p.id}')"
            class="w-full py-2.5 rounded-xl bg-primary text-on-primary font-label text-xs font-black transition-all hover:bg-primary-hover shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">bolt</span>
            <span>شراء فوري مباشر (الدفع عند الاستلام)</span>
          </button>

          <!-- Add to Cart -->
          <button
            type="button"
            onclick="window.addProductToCart('${p.id}')"
            class="w-full py-2 rounded-xl bg-surface-container-high border border-outline text-on-surface font-label text-xs font-bold transition-colors hover:border-primary hover:text-primary flex items-center justify-center gap-1 cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">shopping_bag</span>
            <span>إضافة إلى السلة</span>
          </button>
        </footer>
      </article>
    `;
  }).join('');
}

/**
 * Handle Color and Size Selection
 */
window.selectProductColor = (productId, colorName) => {
  selectedColors[productId] = colorName;
  const label = document.querySelector(`.text-color-${productId}`);
  if (label) label.textContent = colorName;

  document.querySelectorAll(`.color-btn-${productId}`).forEach(btn => {
    const isSelected = btn.dataset.color === colorName;
    if (isSelected) {
      btn.className = btn.className.replace(/border-outline/, 'border-white') + ' ring-2 ring-primary ring-offset-2 ring-offset-surface scale-110';
    } else {
      btn.className = btn.className.replace(/ring-2 ring-primary ring-offset-2 ring-offset-surface scale-110/, '') + ' border-outline';
    }
  });
};

window.selectCardSize = (productId, size) => {
  selectedSizes[productId] = size;
  document.querySelectorAll(`.size-pill-${productId}`).forEach(btn => {
    const isSelected = btn.dataset.size === size;
    btn.className = `size-pill-${productId} px-2.5 py-1 rounded-md font-mono text-xs font-bold border transition-all cursor-pointer ${isSelected ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low text-on-surface-variant border-outline hover:border-primary'}`;
  });
};

/**
 * Fast 1-Click Order Modal Functionality
 */
window.triggerFastOrder = (productId) => {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  activeFastOrderProduct = product;
  const size = selectedSizes[productId] || product.sizes[0];
  const color = selectedColors[productId] || product.colors[0]?.name;

  const modal = document.getElementById('fastOrderModal');
  const summaryContainer = document.getElementById('fastOrderProductSummary');

  if (summaryContainer) {
    summaryContainer.innerHTML = `
      <img src="${product.image}" alt="${product.title}" class="w-16 h-18 object-cover rounded-lg border border-outline shrink-0">
      <div class="flex-1 flex flex-col gap-0.5">
        <h4 class="font-title text-xs font-bold text-on-surface line-clamp-1">${product.title}</h4>
        <div class="flex items-center gap-3 text-xs text-on-surface-variant">
          <span>المقاس: <strong class="text-primary font-mono">${size}</strong></span>
          <span>اللون: <strong class="text-secondary">${color}</strong></span>
        </div>
        <span class="font-headline text-base text-primary font-black tabular-nums pt-0.5">${formatEGP(product.price)} (الشحن مجاني)</span>
      </div>
    `;
  }

  if (modal && typeof modal.showModal === 'function') {
    modal.showModal();
  }
};

function initFastOrderModal() {
  const modal = document.getElementById('fastOrderModal');
  const closeBtn = document.getElementById('closeFastOrderBtn');
  const form = document.getElementById('fastOrderForm');
  const gpsBtn = document.getElementById('fastGpsBtn');
  const locationInput = document.getElementById('fastLocation');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.close());
  }

  // GPS Geolocation inside Fast Order Modal
  if (gpsBtn && locationInput) {
    gpsBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert("GPS غير متاح، يرجى كتابة اللوكيشن أو العنوان يدوياً.");
        locationInput.focus();
        return;
      }

      gpsBtn.textContent = 'جاري تحديد اللوكيشن...';
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          fastOrderGpsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
          locationInput.value = `📍 موقع GPS دقيق: (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
          gpsBtn.textContent = 'تم التقاط الموقع ✓';
          gpsBtn.className = 'px-2.5 py-1 rounded-md bg-success/20 border border-success text-success font-label text-[11px] font-bold';
        },
        () => {
          gpsBtn.textContent = '📍 تحديد موقعي الحالي GPS';
          locationInput.focus();
          alert("يرجى كتابة اللوكيشن أو اسم الشارع في الخانة.");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }

  // Submit Fast Order directly to Firebase Firestore
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!activeFastOrderProduct) return;

      const name = document.getElementById('fastName').value.trim();
      const phone = document.getElementById('fastPhone').value.trim();
      const address = document.getElementById('fastAddress').value.trim();
      const location = locationInput.value.trim() || 'العنوان المسجل';

      if (name.length < 3 || phone.length < 11 || address.length < 5) {
        alert("يرجى التأكد من ملء الاسم ورقم الهاتف المكون من 11 رقماً والعنوان.");
        return;
      }

      const submitBtn = document.getElementById('fastSubmitBtn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'جاري إرسال الطلب للوحة المبيعات...';

      const orderNumber = '#M-' + Math.floor(10000 + Math.random() * 89999);
      const size = selectedSizes[activeFastOrderProduct.id] || activeFastOrderProduct.sizes[0];
      const color = selectedColors[activeFastOrderProduct.id] || activeFastOrderProduct.colors[0]?.name;

      const orderPayload = {
        orderNumber: orderNumber,
        customer: {
          fullName: name,
          phone: phone,
          address: address,
          location: location,
          googleMapsUrl: fastOrderGpsUrl || '',
          notes: 'طلب سريع فوري عبر المتجر'
        },
        items: [
          {
            id: activeFastOrderProduct.id,
            title: activeFastOrderProduct.title,
            size: size,
            color: color,
            price: activeFastOrderProduct.price,
            qty: 1,
            image: activeFastOrderProduct.image
          }
        ],
        total: activeFastOrderProduct.price,
        currency: 'ج.م',
        paymentMethod: 'cod',
        paymentMethodLabel: 'الدفع عند الاستلام نقداً',
        receiptImage: null,
        status: 'قيد الانتظار'
      };

      try {
        await saveOrder(orderPayload);
        submitBtn.disabled = false;
        submitBtn.textContent = 'تأكيد الطلب الفوري — الدفع عند الاستلام';
        if (modal) modal.close();

        showStoreToast(`تم تسجيل طلبك بنجاح (${orderNumber})! سيتواصل معك المندوب.`);
        
        // WhatsApp customer follow up
        const storeWhatsApp = '201098427510';
        let locText = fastOrderGpsUrl ? `\n📍 رابط الخريطة: ${fastOrderGpsUrl}` : `\n📍 اللوكيشن: ${location}`;
        const msg = `مرحباً، قمت بتأكيد طلب سريع رقم ${orderNumber} لمنتج "${activeFastOrderProduct.title}" (مقاس: ${size} - لون: ${color}) بمبلغ ${formatEGP(activeFastOrderProduct.price)} (الدفع عند الاستلام).${locText}`;
        window.open(`https://wa.me/${storeWhatsApp}?text=${encodeURIComponent(msg)}`, '_blank');
      } catch (err) {
        console.error("Fast order error:", err);
        alert("تم تسجيل طلبك وسيتواصل معك فريق العمل.");
        if (modal) modal.close();
      }
    });
  }
}

/**
 * Add Product to Cart with Selected Size & Color
 */
window.addProductToCart = (productId) => {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const size = selectedSizes[productId] || product.sizes[0];
  const color = selectedColors[productId] || product.colors[0]?.name;
  cart.addItem(product, size, color, 1);

  showStoreToast(`تمت إضافة "${product.title}" (${size} - ${color}) إلى السلة!`);
  openCartDrawer();
};

/**
 * Slide-Over Cart Drawer Handling
 */
const cartDrawer = document.getElementById('cartDrawer');
const cartBackdrop = document.getElementById('cartDrawerBackdrop');

export function openCartDrawer() {
  if (cartBackdrop) cartBackdrop.classList.remove('hidden');
  if (cartDrawer) cartDrawer.classList.remove('translate-x-[-100%]');
  renderCartDrawerItems();
}

export function closeCartDrawer() {
  if (cartBackdrop) cartBackdrop.classList.add('hidden');
  if (cartDrawer) cartDrawer.classList.add('translate-x-[-100%]');
}

function initCartDrawer() {
  const openBtn = document.getElementById('openCartBtn');
  const closeBtn = document.getElementById('closeCartBtn');

  if (openBtn) openBtn.addEventListener('click', openCartDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);
  if (cartBackdrop) cartBackdrop.addEventListener('click', closeCartDrawer);
}

function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-count-badge');
  const count = cart.getTotalCount();
  badges.forEach(badge => {
    badge.textContent = count;
  });
}

function renderCartDrawerItems() {
  const container = document.getElementById('cartItemsContainer');
  const subtotalEl = document.getElementById('cartSubtotal');
  const items = cart.getItems();

  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center flex flex-col items-center justify-center gap-2 text-on-surface-variant">
        <span class="material-symbols-outlined text-4xl text-outline">shopping_bag</span>
        <p class="font-body text-xs">سلتك فارغة حالياً.</p>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = formatEGP(0);
    return;
  }

  container.innerHTML = items.map((item, idx) => `
    <div class="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-low border border-outline">
      <img src="${item.image}" alt="${item.title}" class="w-14 h-16 object-cover rounded-lg border border-outline shrink-0">
      <div class="flex-1 flex flex-col gap-0.5">
        <h4 class="font-title text-xs font-bold text-on-surface line-clamp-1">${item.title}</h4>
        <div class="flex items-center gap-2 text-xs text-on-surface-variant font-mono">
          <span>المقاس: <strong class="text-primary">${item.size}</strong></span>
          ${item.color ? `<span>اللون: <strong class="text-secondary">${item.color}</strong></span>` : ''}
        </div>
        <div class="flex items-center justify-between pt-1">
          <span class="font-mono text-xs text-primary font-bold tabular-nums">${formatEGP(item.price * item.qty)}</span>
          <div class="flex items-center gap-1">
            <button 
              type="button" 
              onclick="window.adjustCartItemQty(${idx}, -1)" 
              class="w-6 h-6 rounded bg-surface-container border border-outline text-on-surface hover:border-primary flex items-center justify-center font-mono font-bold text-xs"
            >-</button>
            <span class="w-5 text-center font-mono text-xs tabular-nums font-bold">${item.qty}</span>
            <button 
              type="button" 
              onclick="window.adjustCartItemQty(${idx}, 1)" 
              class="w-6 h-6 rounded bg-surface-container border border-outline text-on-surface hover:border-primary flex items-center justify-center font-mono font-bold text-xs"
            >+</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  const subtotal = cart.getSubtotal();
  if (subtotalEl) subtotalEl.textContent = formatEGP(subtotal);
}

window.adjustCartItemQty = (index, delta) => {
  cart.updateQty(index, delta);
};

/**
 * Quick View Modal Logic
 */
let activeQuickViewProduct = null;

window.openQuickViewModal = (productId) => {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;

  activeQuickViewProduct = p;

  const modal = document.getElementById('quickViewModal');
  const imgEl = document.getElementById('qvImage');
  const fabricEl = document.getElementById('qvFabric');
  const titleEl = document.getElementById('qvTitle');
  const priceEl = document.getElementById('qvPrice');
  const descEl = document.getElementById('qvDesc');
  const sizesEl = document.getElementById('qvSizes');

  if (imgEl) { imgEl.src = p.image; imgEl.alt = p.title; }
  if (fabricEl) fabricEl.textContent = p.fabric;
  if (titleEl) titleEl.textContent = p.title;
  if (priceEl) priceEl.textContent = formatEGP(p.price);
  if (descEl) descEl.textContent = p.desc;

  if (sizesEl) {
    sizesEl.innerHTML = p.sizes.map(s => `
      <button 
        type="button" 
        onclick="window.selectCardSize('${p.id}', '${s}'); window.openQuickViewModal('${p.id}')" 
        class="px-3 py-1 rounded-md font-mono text-xs font-bold border transition-all ${selectedSizes[p.id] === s ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low text-on-surface-variant border-outline hover:border-primary'}"
      >${s}</button>
    `).join('');
  }

  if (modal && typeof modal.showModal === 'function') {
    modal.showModal();
  }
};

function initQuickView() {
  const modal = document.getElementById('quickViewModal');
  const closeBtn = document.getElementById('closeQvBtn');
  const addBtn = document.getElementById('qvAddBtn');
  const fastBuyBtn = document.getElementById('qvFastBuyBtn');

  if (closeBtn && modal) closeBtn.addEventListener('click', () => modal.close());

  if (addBtn && modal) {
    addBtn.addEventListener('click', () => {
      if (activeQuickViewProduct) {
        window.addProductToCart(activeQuickViewProduct.id);
        modal.close();
      }
    });
  }

  if (fastBuyBtn && modal) {
    fastBuyBtn.addEventListener('click', () => {
      if (activeQuickViewProduct) {
        modal.close();
        window.triggerFastOrder(activeQuickViewProduct.id);
      }
    });
  }
}

function initCategoryFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.className = 'filter-btn px-4 py-2 rounded-full bg-surface-container border border-outline text-on-surface-variant font-label text-xs font-bold hover:border-primary transition-colors';
      });
      btn.className = 'filter-btn px-4 py-2 rounded-full bg-primary text-on-primary font-label text-xs font-black transition-colors';
      renderProducts(btn.dataset.filter);
    });
  });
}

function showStoreToast(msg) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'luxury-toast';
  toast.innerHTML = `
    <span class="material-symbols-outlined text-primary text-lg">check_circle</span>
    <span>${msg}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-leave');
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}
