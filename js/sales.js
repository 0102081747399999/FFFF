/**
 * متجر ملابس رجالي كاجوال — لوحة تحكم المبيعات والطلبات الواردة
 * Real-time Firebase Firestore Sync, Location GPS Display, Order Tracking & Invoice Printing
 */

import { 
  subscribeOrders, 
  updateOrderStatus, 
  deleteOrder, 
  saveOrder 
} from './firebase-config.js';
import { formatEGP } from './products.js';

let allOrders = [];
let currentFilter = 'all';
let currentPaymentFilter = 'all';
let searchQuery = '';
let activeReceiptUrl = null;
let receiptZoomLevel = 1;
let receiptRotation = 0;

function playNewOrderChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
});

function initDashboard() {
  initFilters();
  initSearch();
  initReceiptModal();
  initTestOrderButton();
  initExportCSV();

  let previousOrderCount = 0;
  let isInitialLoad = true;

  const syncBadge = document.getElementById('firebaseSyncBadge');
  const syncText = document.getElementById('firebaseSyncText');

  subscribeOrders((orders, source) => {
    allOrders = orders;

    if (!isInitialLoad && orders.length > previousOrderCount) {
      playNewOrderChime();
      showToast(`طلب ملابس جديد وصل الآن! (${orders[0].orderNumber})`, 'success');
    }
    previousOrderCount = orders.length;
    isInitialLoad = false;

    if (syncBadge && syncText) {
      if (source === 'firebase') {
        syncText.textContent = 'متصل بفيربيز مباشر (Firestore Live)';
        syncBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/20 border border-success text-success font-label text-xs font-bold';
      } else {
        syncText.textContent = 'مزامنة محلية واحتياطية (Local Sync)';
        syncBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary text-primary font-label text-xs font-bold';
      }
    }

    updateKPIs();
    renderOrders();
  }, (err) => {
    console.warn("Firestore subscription error:", err);
  });
}

/**
 * Update Top KPI Metrics
 */
function updateKPIs() {
  const totalRevenue = allOrders
    .filter(o => o.status !== 'ملغي')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const totalOrders = allOrders.length;
  const pendingOrders = allOrders.filter(o => o.status === 'قيد الانتظار').length;
  const codOrders = allOrders.filter(o => o.paymentMethod === 'cod').length;
  const deliveredOrders = allOrders.filter(o => o.status === 'تم التوصيل').length;

  const revEl = document.getElementById('kpiTotalRevenue');
  const countEl = document.getElementById('kpiTotalOrders');
  const pendingEl = document.getElementById('kpiPendingOrders');
  const vodafoneEl = document.getElementById('kpiVodafoneOrders');
  const deliveredEl = document.getElementById('kpiDeliveredOrders');

  if (revEl) revEl.textContent = formatEGP(totalRevenue);
  if (countEl) countEl.textContent = totalOrders.toLocaleString('ar-EG');
  if (pendingEl) pendingEl.textContent = pendingOrders.toLocaleString('ar-EG');
  if (vodafoneEl) vodafoneEl.textContent = codOrders.toLocaleString('ar-EG');
  if (deliveredEl) deliveredEl.textContent = deliveredOrders.toLocaleString('ar-EG');
}

/**
 * Filter orders
 */
function getFilteredOrders() {
  return allOrders.filter(order => {
    if (currentFilter !== 'all' && order.status !== currentFilter) return false;
    if (currentPaymentFilter !== 'all' && order.paymentMethod !== currentPaymentFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const numMatch = (order.orderNumber || '').toLowerCase().includes(q);
      const nameMatch = (order.customer?.fullName || '').toLowerCase().includes(q);
      const phoneMatch = (order.customer?.phone || '').includes(q);
      const addrMatch = (order.customer?.address || '').toLowerCase().includes(q);
      const locMatch = (order.customer?.location || '').toLowerCase().includes(q);
      if (!numMatch && !nameMatch && !phoneMatch && !addrMatch && !locMatch) return false;
    }
    return true;
  });
}

/**
 * Render Orders Cards in the Dashboard
 */
function renderOrders() {
  const container = document.getElementById('ordersListContainer');
  const countBadge = document.getElementById('filteredOrdersCount');
  const filtered = getFilteredOrders();

  if (countBadge) countBadge.textContent = `${filtered.length} طلب`;
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="bg-surface-container border border-outline rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
        <span class="material-symbols-outlined text-5xl text-outline" aria-hidden="true">inbox</span>
        <h3 class="font-title text-base font-bold text-on-surface">لا توجد طلبات مطابقة للبحث أو الفلتر</h3>
        <p class="font-body text-xs text-on-surface-variant max-w-md">
          جرب تغيير شروط التصفية أو اضغط على زر "إضافة طلب تجريبي" بالأعلى لتشاهد كيف ينزل الطلب تلقائياً في الجدول.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(order => {
    const isCod = order.paymentMethod === 'cod';
    const dateFormatted = new Date(order.timestamp || order.createdAt || Date.now()).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const statusClasses = {
      'قيد الانتظار': 'status-pending',
      'تم التأكيد': 'status-confirmed',
      'جاري التوصيل': 'status-shipping',
      'تم التوصيل': 'status-delivered',
      'ملغي': 'status-cancelled'
    };
    const badgeClass = statusClasses[order.status] || 'status-pending';

    const customerPhone = (order.customer?.phone || '').replace(/[^0-9]/g, '');
    const cleanPhoneEGY = customerPhone.startsWith('0') ? '2' + customerPhone : customerPhone;
    
    // WhatsApp pre-filled follow up
    const waText = encodeURIComponent(
      `مرحباً أستاذ ${order.customer?.fullName || ''}، معك خدمة عملاء متجر الملابس الرجالي بخصوص طلبك رقم ${order.orderNumber} بمبلغ ${formatEGP(order.total)} (الدفع عند الاستلام). نود تأكيد موعد التوصيل معك.`
    );

    const hasGps = Boolean(order.customer?.googleMapsUrl);
    const locationText = order.customer?.location || order.customer?.address || 'غير محدد';

    return `
      <article class="bg-surface-container border border-outline hover:border-primary/60 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 shadow-md">
        
        <!-- Header: Order ID, Status, Timestamp & Quick Controls -->
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-outline pb-3">
          <div class="flex items-center gap-3">
            <span class="font-mono text-base sm:text-lg text-primary font-black tracking-wider select-all">${order.orderNumber}</span>
            <span class="status-badge ${badgeClass}">${order.status || 'قيد الانتظار'}</span>
            <span class="font-body text-xs text-on-surface-variant hidden sm:inline-block">${dateFormatted}</span>
          </div>

          <div class="flex items-center gap-2">
            <!-- Status Dropdown -->
            <label class="sr-only" for="status-${order.id}">تغيير حالة الطلب</label>
            <select 
              id="status-${order.id}" 
              data-order-id="${order.id || order.orderNumber}"
              class="status-select rounded-xl bg-surface-container-low border border-outline px-3 py-1.5 font-label text-xs font-bold text-on-surface focus:border-primary focus:outline-none"
            >
              <option value="قيد الانتظار" ${order.status === 'قيد الانتظار' ? 'selected' : ''}>⏳ قيد الانتظار</option>
              <option value="تم التأكيد" ${order.status === 'تم التأكيد' ? 'selected' : ''}>✓ تم التأكيد</option>
              <option value="جاري التوصيل" ${order.status === 'جاري التوصيل' ? 'selected' : ''}>🚚 جاري التوصيل</option>
              <option value="تم التوصيل" ${order.status === 'تم التوصيل' ? 'selected' : ''}>★ تم التوصيل</option>
              <option value="ملغي" ${order.status === 'ملغي' ? 'selected' : ''}>✕ ملغي</option>
            </select>

            <!-- Print Invoice -->
            <button 
              type="button" 
              onclick="window.printInvoice('${order.orderNumber}')"
              title="طباعة بوليصة وفاتورة الشحن"
              class="w-8 h-8 rounded-lg bg-surface-container-low border border-outline text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors cursor-pointer"
            >
              <span class="material-symbols-outlined text-base">print</span>
            </button>

            <!-- Delete Order -->
            <button 
              type="button" 
              onclick="window.confirmDeleteOrder('${order.id || order.orderNumber}')"
              title="حذف الطلب"
              class="w-8 h-8 rounded-lg bg-surface-container-low border border-outline text-on-surface-variant hover:text-error flex items-center justify-center transition-colors cursor-pointer"
            >
              <span class="material-symbols-outlined text-base">delete</span>
            </button>
          </div>
        </div>

        <!-- 3-Column Grid: Customer + Items + Location & Payment -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          
          <!-- Column 1: Customer Details (4 cols) -->
          <div class="md:col-span-4 flex flex-col gap-2 bg-surface-container-low p-3.5 rounded-xl border border-outline">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-base">person</span>
              <span class="font-title text-sm font-bold text-on-surface">${order.customer?.fullName || 'عميل'}</span>
            </div>

            <!-- Phone & WhatsApp Buttons -->
            <div class="flex items-center justify-between gap-2 pt-0.5">
              <div class="flex items-center gap-1 font-mono text-xs text-on-surface" dir="ltr">
                <span class="material-symbols-outlined text-on-surface-variant text-sm">call</span>
                <a href="tel:${customerPhone}" class="hover:underline font-bold">${order.customer?.phone || ''}</a>
              </div>
              <a 
                href="https://wa.me/${cleanPhoneEGY}?text=${waText}" 
                target="_blank" 
                rel="noopener"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366]/20 border border-[#25D366]/50 text-[#25D366] hover:bg-[#25D366] hover:text-black font-label text-xs font-bold transition-colors"
                title="مراسلة العميل واتساب"
              >
                <span>واتساب</span>
                <span class="material-symbols-outlined text-xs">chat</span>
              </a>
            </div>

            <!-- Detailed Address -->
            <div class="flex items-start gap-1.5 text-on-surface-variant font-body text-xs pt-1 border-t border-outline/60">
              <span class="material-symbols-outlined text-primary text-sm shrink-0 mt-0.5">location_on</span>
              <span><strong>العنوان:</strong> ${order.customer?.address || 'غير محدد'}</span>
            </div>

            <!-- Order Notes if present -->
            ${order.customer?.notes ? `
              <div class="text-[11px] text-on-surface-variant/80 italic pt-1 border-t border-outline/50">
                <span class="font-bold text-primary">ملاحظات:</span> ${order.customer.notes}
              </div>
            ` : ''}
          </div>

          <!-- Column 2: Items Ordered (5 cols) -->
          <div class="md:col-span-5 flex flex-col gap-2">
            <span class="font-label text-xs font-bold text-on-surface-variant">الملابس المطلوبة (${order.items?.length || 0}):</span>
            
            <div class="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              ${(order.items || []).map(item => `
                <div class="flex items-center justify-between gap-3 p-2 rounded-xl bg-surface-container-low border border-outline">
                  <div class="flex items-center gap-2.5">
                    <img src="${item.image}" alt="${item.title}" class="w-10 h-12 object-cover rounded-lg border border-outline">
                    <div class="flex flex-col">
                      <span class="font-title text-xs font-bold text-on-surface line-clamp-1">${item.title}</span>
                      <div class="flex items-center gap-2 text-[11px] text-on-surface-variant font-mono">
                        <span>مقاس: <strong class="text-primary">${item.size}</strong></span>
                        ${item.color ? `<span>لون: <strong class="text-secondary">${item.color}</strong></span>` : ''}
                        <span>× ${item.qty}</span>
                      </div>
                    </div>
                  </div>
                  <span class="font-mono text-xs font-bold text-on-surface tabular-nums">${formatEGP(item.price * item.qty)}</span>
                </div>
              `).join('')}
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-outline mt-0.5">
              <span class="font-label text-xs font-bold text-on-surface-variant">المبلغ الكلي:</span>
              <span class="font-headline text-base sm:text-lg text-primary font-black tabular-nums">${formatEGP(order.total)}</span>
            </div>
          </div>

          <!-- Column 3: Location (GPS) & Payment Details (3 cols) -->
          <div class="md:col-span-3 flex flex-col gap-2.5 bg-surface-container-low p-3.5 rounded-xl border border-outline">
            
            <!-- Payment Method Badge -->
            <div class="flex items-center justify-between">
              <span class="font-label text-xs text-on-surface-variant font-bold">طريقة الدفع:</span>
              <span class="font-label text-xs font-bold ${isCod ? 'text-success' : 'text-primary'}">
                ${order.paymentMethodLabel || (isCod ? 'الدفع عند الاستلام نقداً' : 'فودافون كاش')}
              </span>
            </div>

            <!-- Customer Location & Google Maps Link (Critical User Requirement) -->
            <div class="flex flex-col gap-1.5 pt-2 border-t border-outline/60">
              <span class="font-label text-xs font-bold text-on-surface flex items-center gap-1">
                <span class="material-symbols-outlined text-secondary text-sm">near_me</span>
                <span>اللوكيشن المحدد:</span>
              </span>
              
              <p class="font-body text-xs text-on-surface bg-surface-container p-2 rounded-lg border border-outline select-all">
                ${locationText}
              </p>

              <!-- If GPS coordinates or Google Maps link exists -->
              ${hasGps ? `
                <a 
                  href="${order.customer.googleMapsUrl}" 
                  target="_blank" 
                  rel="noopener"
                  class="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-secondary/20 border border-secondary text-secondary hover:bg-secondary hover:text-black font-label text-xs font-bold transition-all mt-1"
                  title="فتح الموقع الجغرافي للعميل على خرائط جوجل لتوجيه مندوب الشحن"
                >
                  <span class="material-symbols-outlined text-base">map</span>
                  <span>فتح اللوكيشن على خرائط جوجل</span>
                </a>
              ` : `
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customer?.address || locationText)}" 
                  target="_blank" 
                  rel="noopener"
                  class="w-full inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-surface-container border border-outline text-on-surface-variant hover:text-primary font-label text-[11px] transition-colors mt-0.5"
                >
                  <span class="material-symbols-outlined text-xs">search</span>
                  <span>بحث عن العنوان في الخرائط</span>
                </a>
              `}
            </div>

            <!-- If Vodafone Cash with receipt -->
            ${order.receiptImage ? `
              <div class="flex flex-col gap-1.5 pt-2 border-t border-outline/60">
                <span class="font-label text-xs font-bold text-primary">إيصال التحويل:</span>
                <button 
                  type="button" 
                  onclick="window.viewReceiptImage('${order.orderNumber}')"
                  class="py-1 px-2 rounded-lg bg-primary-container border border-primary text-[#FFDEA5] hover:bg-primary hover:text-on-primary text-xs font-bold transition-colors"
                >
                  🔍 فحص وتكبير الإيصال
                </button>
              </div>
            ` : ''}

          </div>

        </div>
      </article>
    `;
  }).join('');

  // Status changer listener
  document.querySelectorAll('.status-select').forEach(select => {
    select.addEventListener('change', async (e) => {
      const orderId = e.target.dataset.orderId;
      const newStatus = e.target.value;
      const success = await updateOrderStatus(orderId, newStatus);
      if (success) {
        showToast(`تم تحديث حالة الطلب إلى "${newStatus}"`, 'success');
      }
    });
  });
}

function initFilters() {
  document.querySelectorAll('.status-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.status-filter-btn').forEach(b => {
        b.className = 'status-filter-btn px-3 py-1.5 rounded-full bg-surface-container border border-outline text-on-surface-variant font-label text-xs font-bold hover:border-primary transition-colors';
      });
      btn.className = 'status-filter-btn px-3 py-1.5 rounded-full bg-primary text-on-primary font-label text-xs font-bold transition-colors';
      currentFilter = btn.dataset.status;
      renderOrders();
    });
  });

  const paymentSelect = document.getElementById('paymentFilterSelect');
  if (paymentSelect) {
    paymentSelect.addEventListener('change', (e) => {
      currentPaymentFilter = e.target.value;
      renderOrders();
    });
  }
}

function initSearch() {
  const searchInput = document.getElementById('orderSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderOrders();
    });
  }
}

function initReceiptModal() {
  const modal = document.getElementById('receiptViewerModal');
  const imgEl = document.getElementById('modalReceiptImg');
  const closeBtn = document.getElementById('closeReceiptModalBtn');
  const zoomInBtn = document.getElementById('zoomInReceiptBtn');
  const zoomOutBtn = document.getElementById('zoomOutReceiptBtn');
  const rotateBtn = document.getElementById('rotateReceiptBtn');
  const downloadBtn = document.getElementById('downloadReceiptBtn');

  function updateTransform() {
    if (imgEl) {
      imgEl.style.transform = `scale(${receiptZoomLevel}) rotate(${receiptRotation}deg)`;
    }
  }

  window.viewReceiptImage = (orderNumber) => {
    const targetOrder = allOrders.find(o => o.orderNumber === orderNumber);
    if (!targetOrder || !targetOrder.receiptImage) return;

    activeReceiptUrl = targetOrder.receiptImage;
    receiptZoomLevel = 1;
    receiptRotation = 0;

    if (imgEl) {
      imgEl.src = activeReceiptUrl;
      updateTransform();
    }

    const titleEl = document.getElementById('modalReceiptTitle');
    if (titleEl) {
      titleEl.textContent = `إيصال التحويل للطلب ${orderNumber} — ${targetOrder.customer?.fullName || ''}`;
    }

    if (downloadBtn) {
      downloadBtn.href = activeReceiptUrl;
      downloadBtn.download = `receipt_${orderNumber}.jpg`;
    }

    if (modal && typeof modal.showModal === 'function') {
      modal.showModal();
    }
  };

  if (closeBtn && modal) closeBtn.addEventListener('click', () => modal.close());

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      receiptZoomLevel = Math.min(receiptZoomLevel + 0.3, 3);
      updateTransform();
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      receiptZoomLevel = Math.max(receiptZoomLevel - 0.3, 0.6);
      updateTransform();
    });
  }

  if (rotateBtn) {
    rotateBtn.addEventListener('click', () => {
      receiptRotation = (receiptRotation + 90) % 360;
      updateTransform();
    });
  }
}

/**
 * Print Invoice with Location & Google Maps link
 */
window.printInvoice = (orderNumber) => {
  const order = allOrders.find(o => o.orderNumber === orderNumber);
  if (!order) return;

  const invoiceContainer = document.getElementById('printableInvoice');
  if (!invoiceContainer) return;

  const dateFormatted = new Date(order.timestamp || order.createdAt || Date.now()).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  invoiceContainer.innerHTML = `
    <div style="direction: rtl; font-family: 'Cairo', sans-serif; padding: 25px; max-width: 800px; margin: auto; border: 2px solid #333; color: #111;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #F59E0B; padding-bottom: 12px; margin-bottom: 20px;">
        <div>
          <h1 style="margin: 0; font-size: 22px;">متجر ملابس رجالي كاجوال</h1>
          <p style="margin: 4px 0 0; font-size: 13px; color: #555;">بوليصة شحن وفاتورة تسليم العميل</p>
        </div>
        <div style="text-align: left;">
          <h2 style="margin: 0; font-size: 18px; color: #D97706;">${order.orderNumber}</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #555;">التاريخ: ${dateFormatted}</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <div>
          <h3 style="margin: 0 0 6px; font-size: 15px; color: #0F172A;">بيانات العميل:</h3>
          <p style="margin: 3px 0;"><strong>الاسم:</strong> ${order.customer?.fullName}</p>
          <p style="margin: 3px 0;"><strong>الهاتف:</strong> ${order.customer?.phone}</p>
          <p style="margin: 3px 0;"><strong>العنوان:</strong> ${order.customer?.address}</p>
          <p style="margin: 3px 0; color: #0284c7;"><strong>اللوكيشن:</strong> ${order.customer?.location || 'نفس العنوان'}</p>
          ${order.customer?.googleMapsUrl ? `<p style="margin: 3px 0; font-size: 11px; word-break: break-all;"><strong>رابط الخريطة:</strong> ${order.customer.googleMapsUrl}</p>` : ''}
        </div>
        <div>
          <h3 style="margin: 0 0 6px; font-size: 15px; color: #0F172A;">بيانات الشحنة والدفع:</h3>
          <p style="margin: 3px 0;"><strong>طريقة الدفع:</strong> ${order.paymentMethodLabel}</p>
          <p style="margin: 3px 0;"><strong>المبلغ المطلوب تحصيله:</strong> <span style="font-size: 16px; font-weight: bold; color: #D97706;">${formatEGP(order.total)}</span></p>
          <p style="margin: 3px 0;"><strong>حالة المعاينة:</strong> مسموح للعميل بالمعاينة قبل الدفع</p>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #0F172A; color: #fff; text-align: right; font-size: 13px;">
            <th style="padding: 8px; border: 1px solid #333;">المنتج</th>
            <th style="padding: 8px; border: 1px solid #333;">المقاس</th>
            <th style="padding: 8px; border: 1px solid #333;">اللون</th>
            <th style="padding: 8px; border: 1px solid #333;">الكمية</th>
            <th style="padding: 8px; border: 1px solid #333;">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${(order.items || []).map(i => `
            <tr style="font-size: 13px;">
              <td style="padding: 8px; border: 1px solid #cbd5e1;">${i.title}</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">${i.size}</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">${i.color || '-'}</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">${i.qty}</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">${formatEGP(i.price * i.qty)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background: #fffbeb;">
            <td colspan="4" style="padding: 10px; text-align: left; font-weight: bold; font-size: 16px; border: 1px solid #F59E0B;">الإجمالي الكلي للدفع عند الاستلام:</td>
            <td style="padding: 10px; border: 1px solid #F59E0B; font-weight: bold; font-size: 16px; color: #D97706;">${formatEGP(order.total)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="border-top: 1px dashed #94a3b8; padding-top: 10px; font-size: 11px; color: #64748b; text-align: center;">
        شكراً لتسوقك معنا! لأي استفسار أو استبدال يرجى التواصل هاتفياً على 01098427510
      </div>
    </div>
  `;

  window.print();
};

window.confirmDeleteOrder = async (orderId) => {
  if (confirm(`هل أنت متأكد من حذف هذا الطلب نهائياً من قاعدة البيانات؟`)) {
    await deleteOrder(orderId);
    showToast("تم حذف الطلب بنجاح", 'info');
  }
};

/**
 * Quick Test Order Generator for Casual Men's Wear
 */
function initTestOrderButton() {
  const btn = document.getElementById('createTestOrderBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-sm">refresh</span> جاري إنشاء الطلب...`;

    const sampleNames = ['محمود شلبي', 'أحمد عادل', 'إسلام سامي', 'كريم حسن', 'عمر الشريف'];
    const samplePhones = ['01019842751', '01128492019', '01294820184', '01584920192'];
    const sampleLocations = [
      'القاهرة — التجمع الخامس، شارع التسعين بجوار ميتينج بوينت',
      'الجيزة — المهندسين، شارع جامعة الدول العربية خلف ماكدونالدز',
      'الإسكندرية — سموحة، ميدان فيكتور عمانويل، عمارة النرجس',
      'المنصورة — شارع المشاية السفلية أمام نادي الجزيرة'
    ];

    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const randomPhone = samplePhones[Math.floor(Math.random() * samplePhones.length)];
    const randomLoc = sampleLocations[Math.floor(Math.random() * sampleLocations.length)];

    const testPayload = {
      orderNumber: '#M-' + Math.floor(10000 + Math.random() * 89999),
      customer: {
        fullName: randomName,
        phone: randomPhone,
        address: randomLoc,
        location: randomLoc,
        googleMapsUrl: 'https://www.google.com/maps?q=30.0444,31.2357',
        notes: 'طلب كاجوال تجريبي — برجاء الاتصال قبل التحرك بنصف ساعة'
      },
      items: [
        {
          id: 'oversized-tee-acid',
          title: 'تيشيرت أوفر سايز قطن معالج — طباعة جرافيك عصرية',
          size: 'XL',
          color: 'أسود فحمي',
          price: 380,
          qty: 1,
          image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'
        },
        {
          id: 'cargo-pants-tactical',
          title: 'بنطلون كارجو ستريت كاجوال بجيوب جانبية — خامة جبردين ليكرا',
          size: '34',
          color: 'بيج رملي',
          price: 490,
          qty: 1,
          image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80'
        }
      ],
      total: 870,
      currency: 'ج.م',
      paymentMethod: 'cod',
      paymentMethodLabel: 'الدفع عند الاستلام نقداً',
      receiptImage: null,
      status: 'قيد الانتظار'
    };

    await saveOrder(testPayload);
    btn.disabled = false;
    btn.innerHTML = `<span class="material-symbols-outlined text-sm">add_circle</span> إضافة طلب تجريبي`;
    showToast("تم تسجيل طلب ملابس تجريبي ونزوله في لوحة المبيعات بنجاح!", 'success');
  });
}

function initExportCSV() {
  const exportBtn = document.getElementById('exportOrdersCsvBtn');
  if (!exportBtn) return;

  exportBtn.addEventListener('click', () => {
    if (allOrders.length === 0) {
      alert("لا توجد طلبات للتصدير حالياً.");
      return;
    }

    const headers = ['رقم الطلب', 'التاريخ', 'اسم العميل', 'رقم الهاتف', 'العنوان', 'اللوكيشن', 'طريقة الدفع', 'الإجمالي (ج.م)', 'الحالة'];
    const rows = allOrders.map(o => [
      o.orderNumber,
      new Date(o.timestamp || o.createdAt || Date.now()).toLocaleDateString('ar-EG'),
      `"${(o.customer?.fullName || '').replace(/"/g, '""')}"`,
      `"${o.customer?.phone || ''}"`,
      `"${(o.customer?.address || '').replace(/"/g, '""')}"`,
      `"${(o.customer?.location || '').replace(/"/g, '""')}"`,
      o.paymentMethodLabel || o.paymentMethod,
      o.total,
      o.status
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `menswear_sales_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'luxury-toast';
  toast.innerHTML = `
    <span class="material-symbols-outlined text-primary text-title-md">${type === 'success' ? 'check_circle' : 'info'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-leave');
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}
