/**
 * متجر ملابس رجالي كاجوال — معالجة الطلب والدفع وتحديد اللوكيشن GPS
 * Checkout Logic, Egyptian Phone Validation, Geolocation & Firebase Integration
 */

import { cart } from './cart.js';
import { formatEGP } from './products.js';
import { saveOrder } from './firebase-config.js';

let receiptDataUrl = null;
let receiptFileName = '';
let activeMediaStream = null;
let customerGpsCoords = null;
let customerGoogleMapsUrl = '';

document.addEventListener('DOMContentLoaded', () => {
  renderCheckoutSummary();
  initPaymentToggle();
  initGpsLocation();
  initWalletCopy();
  initReceiptHandlers();
  initCameraModal();
  initCheckoutForm();

  window.addEventListener('cartChanged', () => {
    renderCheckoutSummary();
  });
});

/**
 * Render items in the checkout summary card
 */
function renderCheckoutSummary() {
  const container = document.getElementById('checkoutItems');
  const items = cart.getItems();

  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8">
        <span class="material-symbols-outlined text-4xl text-outline mb-2">shopping_bag</span>
        <p class="font-body text-sm text-on-surface-variant">السلة فارغة حالياً.</p>
        <a href="index.html" class="inline-flex items-center gap-1 text-primary hover:underline mt-3 text-xs font-bold">
          ← العودة للمتجر واختيار ملابسك
        </a>
      </div>
    `;
    const submitBtn = document.getElementById('submitOrderBtn');
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  container.innerHTML = items.map((item, idx) => `
    <div class="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-low border border-outline">
      <img src="${item.image}" alt="${item.title}" class="w-14 h-16 object-cover rounded-lg border border-outline shrink-0">
      <div class="flex-1 flex flex-col gap-0.5">
        <h3 class="font-title text-xs font-bold text-on-surface line-clamp-1">${item.title}</h3>
        <div class="flex items-center gap-2 text-xs text-on-surface-variant font-mono">
          <span>المقاس: <strong class="text-primary">${item.size}</strong></span>
          ${item.color ? `<span>اللون: <strong class="text-secondary">${item.color}</strong></span>` : ''}
          <span>× ${item.qty}</span>
        </div>
      </div>
      <span class="font-mono text-xs text-on-surface font-bold tabular-nums">${formatEGP(item.price * item.qty)}</span>
    </div>
  `).join('');

  const subtotal = cart.getSubtotal();
  const subtotalEl = document.getElementById('summarySubtotal');
  const totalEl = document.getElementById('summaryTotal');

  if (subtotalEl) subtotalEl.textContent = formatEGP(subtotal);
  if (totalEl) totalEl.textContent = formatEGP(subtotal);

  const submitBtn = document.getElementById('submitOrderBtn');
  if (submitBtn) submitBtn.disabled = false;
}

/**
 * 📍 GPS Geolocation Capture (تحديد موقع العميل بالـ GPS لخرائط جوجل)
 */
function initGpsLocation() {
  const gpsBtn = document.getElementById('getGpsLocationBtn');
  const locationInput = document.getElementById('locationInput');
  const gpsSuccessBadge = document.getElementById('gpsSuccessBadge');
  const gpsBtnIcon = document.getElementById('gpsBtnIcon');
  const gpsBtnText = document.getElementById('gpsBtnText');

  if (!gpsBtn || !locationInput) return;

  gpsBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert("خاصية تحديد الموقع الجغرافي (GPS) غير مدعومة في متصفحك. يرجى كتابة اللوكيشن أو العنوان يدوياً.");
      locationInput.focus();
      return;
    }

    gpsBtn.disabled = true;
    gpsBtnIcon.textContent = 'hourglass_top';
    gpsBtnIcon.classList.add('animate-spin');
    gpsBtnText.textContent = 'جاري تحديد موقعك بدقة...';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        customerGpsCoords = { lat, lng };
        customerGoogleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

        locationInput.value = `📍 موقع GPS دقيق: (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
        if (gpsSuccessBadge) gpsSuccessBadge.classList.remove('hidden');

        gpsBtn.disabled = false;
        gpsBtnIcon.classList.remove('animate-spin');
        gpsBtnIcon.textContent = 'check_circle';
        gpsBtnText.textContent = 'تم تحديد موقعك بنجاح ✓';
        gpsBtn.classList.remove('bg-secondary/20', 'text-secondary');
        gpsBtn.classList.add('bg-success/20', 'text-success', 'border-success');
      },
      (error) => {
        console.warn("Geolocation error:", error);
        gpsBtn.disabled = false;
        gpsBtnIcon.classList.remove('animate-spin');
        gpsBtnIcon.textContent = 'my_location';
        gpsBtnText.textContent = 'تحديد موقعي الحالي تلقائياً (GPS)';

        locationInput.focus();
        locationInput.placeholder = 'يرجى كتابة اللوكيشن أو أقرب علامة مميزة هنا...';
        alert("يرجى السماح بصلاحية الموقع في المتصفح، أو كتابة اللوكيشن والعنوان يدوياً في الخانة.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Handle switching between Cash on Delivery (COD) and Vodafone Cash
 */
function initPaymentToggle() {
  const codCard = document.getElementById('codCard');
  const vfWrapper = document.getElementById('vfWrapper');
  const vfBox = document.getElementById('vfVerificationBox');
  const receiptError = document.getElementById('receiptError');
  const submitBtnText = document.getElementById('submitBtnText');

  document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'vodafone') {
        if (vfBox) vfBox.classList.remove('hidden');
        if (vfWrapper) {
          vfWrapper.classList.remove('border-outline');
          vfWrapper.classList.add('border-primary');
        }
        if (codCard) {
          codCard.classList.remove('border-2', 'border-success');
          codCard.classList.add('border', 'border-outline');
        }
        if (submitBtnText) submitBtnText.textContent = 'تأكيد الطلب — عبر فودافون كاش';
      } else {
        if (vfBox) vfBox.classList.add('hidden');
        if (codCard) {
          codCard.classList.add('border-2', 'border-success');
          codCard.classList.remove('border-outline');
        }
        if (vfWrapper) {
          vfWrapper.classList.remove('border-primary');
          vfWrapper.classList.add('border-outline');
        }
        if (receiptError) receiptError.classList.add('hidden');
        if (submitBtnText) submitBtnText.textContent = 'تأكيد الطلب الآن — الدفع عند الاستلام';
      }
    });
  });
}

/**
 * 1-Click Copy Store Wallet Number
 */
function initWalletCopy() {
  const copyBtn = document.getElementById('copyWalletBtn');
  if (!copyBtn) return;

  copyBtn.addEventListener('click', () => {
    const rawNumber = '01098427510';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(rawNumber).catch(() => {});
    }

    const copyText = document.getElementById('copyText');
    const copyIcon = document.getElementById('copyIcon');

    if (copyText) copyText.textContent = 'تم النسخ بنجاح ✓';
    if (copyIcon) copyIcon.textContent = 'check';

    setTimeout(() => {
      if (copyText) copyText.textContent = 'نسخ الرقم';
      if (copyIcon) copyIcon.textContent = 'content_copy';
    }, 2500);
  });
}

/**
 * Image compression utility for receipts
 */
function compressImage(fileOrDataUrl, maxWidth = 1000, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target.result; };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

async function processAndDisplayReceipt(fileOrDataUrl, fileName) {
  try {
    const compressed = await compressImage(fileOrDataUrl);
    receiptDataUrl = compressed;
    receiptFileName = fileName || 'receipt.jpg';

    const previewBox = document.getElementById('receiptPreviewBox');
    const previewImg = document.getElementById('receiptPreviewImg');
    const fileNameEl = document.getElementById('receiptFileName');
    const dropzone = document.getElementById('receiptDropzone');
    const receiptError = document.getElementById('receiptError');

    if (previewImg) previewImg.src = receiptDataUrl;
    if (fileNameEl) fileNameEl.textContent = receiptFileName;
    if (dropzone) dropzone.classList.add('hidden');
    if (previewBox) previewBox.classList.remove('hidden');
    if (receiptError) receiptError.classList.add('hidden');
  } catch (err) {
    console.error("Receipt error:", err);
  }
}

function initReceiptHandlers() {
  const cameraFileInput = document.getElementById('cameraFileInput');
  const galleryFileInput = document.getElementById('galleryFileInput');
  const uploadGalleryBtn = document.getElementById('uploadGalleryBtn');
  const removeBtn = document.getElementById('removeReceiptBtn');
  const dropzone = document.getElementById('receiptDropzone');

  if (galleryFileInput) {
    galleryFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) processAndDisplayReceipt(file, file.name);
    });
  }

  if (cameraFileInput) {
    cameraFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) processAndDisplayReceipt(file, 'camera_capture_' + Date.now() + '.jpg');
    });
  }

  if (uploadGalleryBtn && galleryFileInput) {
    uploadGalleryBtn.addEventListener('click', () => galleryFileInput.click());
  }

  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      receiptDataUrl = null;
      receiptFileName = '';
      if (cameraFileInput) cameraFileInput.value = '';
      if (galleryFileInput) galleryFileInput.value = '';

      const previewBox = document.getElementById('receiptPreviewBox');
      if (previewBox) previewBox.classList.add('hidden');
      if (dropzone) dropzone.classList.remove('hidden');
    });
  }
}

function initCameraModal() {
  const openCameraBtn = document.getElementById('openCameraBtn');
  const cameraModal = document.getElementById('cameraModal');
  const closeCameraBtn = document.getElementById('closeCameraModalBtn');
  const fallbackFileBtn = document.getElementById('fallbackFileBtn');
  const snapPhotoBtn = document.getElementById('snapPhotoBtn');
  const videoEl = document.getElementById('cameraVideo');
  const canvasEl = document.getElementById('cameraCanvas');
  const cameraFileInput = document.getElementById('cameraFileInput');

  function stopCamera() {
    if (activeMediaStream) {
      activeMediaStream.getTracks().forEach(track => track.stop());
      activeMediaStream = null;
    }
  }

  if (openCameraBtn) {
    openCameraBtn.addEventListener('click', async () => {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (cameraFileInput) {
          cameraFileInput.click();
          return;
        }
      }
      try {
        activeMediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (videoEl) videoEl.srcObject = activeMediaStream;
        if (cameraModal && typeof cameraModal.showModal === 'function') cameraModal.showModal();
      } catch (err) {
        if (cameraFileInput) cameraFileInput.click();
      }
    });
  }

  if (closeCameraBtn) {
    closeCameraBtn.addEventListener('click', () => {
      stopCamera();
      if (cameraModal) cameraModal.close();
    });
  }

  if (fallbackFileBtn) {
    fallbackFileBtn.addEventListener('click', () => {
      stopCamera();
      if (cameraModal) cameraModal.close();
      if (cameraFileInput) cameraFileInput.click();
    });
  }

  if (snapPhotoBtn && videoEl && canvasEl) {
    snapPhotoBtn.addEventListener('click', async () => {
      const w = videoEl.videoWidth || 640;
      const h = videoEl.videoHeight || 480;
      canvasEl.width = w;
      canvasEl.height = h;
      const ctx = canvasEl.getContext('2d');
      ctx.drawImage(videoEl, 0, 0, w, h);

      const capturedUrl = canvasEl.toDataURL('image/jpeg', 0.9);
      await processAndDisplayReceipt(capturedUrl, 'camera_capture_' + Date.now() + '.jpg');

      stopCamera();
      if (cameraModal) cameraModal.close();
    });
  }
}

/**
 * Checkout Form Validation & Firebase Order Submission
 */
function initCheckoutForm() {
  const form = document.getElementById('checkoutForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (cart.getItems().length === 0) {
      alert("يرجى اختيار ملابس وإضافتها إلى السلة أولاً.");
      return;
    }

    let isValid = true;

    // 1. Full Name
    const nameInput = document.getElementById('fullName');
    const nameErr = document.getElementById('fullNameError');
    const nameVal = nameInput ? nameInput.value.trim() : '';
    if (nameVal.length < 3) {
      if (nameErr) nameErr.classList.remove('hidden');
      if (nameInput) nameInput.focus();
      isValid = false;
    } else {
      if (nameErr) nameErr.classList.add('hidden');
    }

    // 2. Phone (Egyptian numbers: 010/011/012/015)
    const phoneInput = document.getElementById('phone');
    const phoneErr = document.getElementById('phoneError');
    let phoneVal = phoneInput ? phoneInput.value.replace(/[\s\-\(\)]/g, '') : '';
    if (!/^01[0125][0-9]{8}$/.test(phoneVal)) {
      if (phoneErr) phoneErr.classList.remove('hidden');
      if (isValid && phoneInput) phoneInput.focus();
      isValid = false;
    } else {
      if (phoneErr) phoneErr.classList.add('hidden');
    }

    // 3. Address
    const addressInput = document.getElementById('address');
    const addrErr = document.getElementById('addressError');
    const addrVal = addressInput ? addressInput.value.trim() : '';
    if (addrVal.length < 5) {
      if (addrErr) addrErr.classList.remove('hidden');
      if (isValid && addressInput) addressInput.focus();
      isValid = false;
    } else {
      if (addrErr) addrErr.classList.add('hidden');
    }

    // 4. Location field
    const locationInput = document.getElementById('locationInput');
    const locationVal = locationInput ? locationInput.value.trim() : '';

    // 5. Payment Method & Receipt if Vodafone Cash
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
    const method = selectedMethod ? selectedMethod.value : 'cod';
    const receiptErr = document.getElementById('receiptError');

    if (method === 'vodafone' && !receiptDataUrl) {
      if (receiptErr) receiptErr.classList.remove('hidden');
      isValid = false;
    } else {
      if (receiptErr) receiptErr.classList.add('hidden');
    }

    if (!isValid) return;

    // Optional Order Notes
    const notesInput = document.getElementById('notes');
    const notesVal = notesInput ? notesInput.value.trim() : '';

    // UI Loading
    const submitBtn = document.getElementById('submitOrderBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const submitBtnIcon = document.getElementById('submitBtnIcon');

    if (submitBtn) submitBtn.disabled = true;
    if (submitBtnText) submitBtnText.textContent = 'جاري تسجيل الطلب وإرساله للوحة المبيعات...';
    if (submitBtnIcon) submitBtnIcon.textContent = 'hourglass_top';

    const orderNumber = '#M-' + Math.floor(10000 + Math.random() * 89999);

    const orderPayload = {
      orderNumber: orderNumber,
      customer: {
        fullName: nameVal,
        phone: phoneVal,
        address: addrVal,
        location: locationVal || 'العنوان الرئيسي',
        googleMapsUrl: customerGoogleMapsUrl || '',
        gpsCoords: customerGpsCoords,
        notes: notesVal
      },
      items: cart.getItems(),
      total: cart.getSubtotal(),
      currency: 'ج.م',
      paymentMethod: method,
      paymentMethodLabel: method === 'cod' ? 'الدفع عند الاستلام نقداً' : 'فودافون كاش',
      receiptImage: method === 'vodafone' ? receiptDataUrl : null,
      receiptFileName: method === 'vodafone' ? receiptFileName : null,
      status: 'قيد الانتظار'
    };

    try {
      const saveResult = await saveOrder(orderPayload);
      console.log("Order saved to Firebase Firestore successfully:", saveResult);

      if (submitBtn) submitBtn.disabled = false;
      if (submitBtnText) submitBtnText.textContent = 'تأكيد الطلب الآن — الدفع عند الاستلام';
      if (submitBtnIcon) submitBtnIcon.textContent = 'check_circle';

      cart.clear();
      showConfirmationModal(orderPayload);
    } catch (error) {
      console.error("Order submission error:", error);
      showConfirmationModal(orderPayload);
    }
  });
}

function showConfirmationModal(order) {
  const modal = document.getElementById('orderConfirmedModal');
  const orderIdEl = document.getElementById('confirmedOrderId');
  const customerEl = document.getElementById('confirmedCustomer');
  const phoneEl = document.getElementById('confirmedPhone');
  const totalEl = document.getElementById('confirmedTotal');
  const receiptStatusEl = document.getElementById('confirmedReceiptStatus');
  const whatsappLink = document.getElementById('whatsappConfirmBtn');

  if (orderIdEl) orderIdEl.textContent = order.orderNumber;
  if (customerEl) customerEl.textContent = order.customer.fullName;
  if (phoneEl) phoneEl.textContent = order.customer.phone;
  if (totalEl) totalEl.textContent = formatEGP(order.total);

  if (receiptStatusEl) {
    if (order.paymentMethod === 'cod') {
      receiptStatusEl.textContent = 'الدفع نقداً عند استلام ومعاينة المنتج';
      receiptStatusEl.className = 'font-label text-xs font-bold text-success';
    } else {
      receiptStatusEl.textContent = 'تم إرفاق إيصال فودافون كاش بنجاح ✓';
      receiptStatusEl.className = 'font-label text-xs font-bold text-primary';
    }
  }

  if (whatsappLink) {
    const storeWhatsApp = '201098427510';
    let locInfo = order.customer.googleMapsUrl ? `\n📍 رابط موقعي على الخريطة: ${order.customer.googleMapsUrl}` : `\n📍 اللوكيشن: ${order.customer.location}`;
    const msg = `مرحباً، قمت بتأكيد طلب ملابس رجالي رقم ${order.orderNumber} باسم ${order.customer.fullName} بمبلغ ${formatEGP(order.total)} (الدفع عند الاستلام).${locInfo}\nأرجو تأكيد موعد التوصيل.`;
    whatsappLink.href = `https://wa.me/${storeWhatsApp}?text=${encodeURIComponent(msg)}`;
  }

  if (modal && typeof modal.showModal === 'function') {
    modal.showModal();
  }
}
