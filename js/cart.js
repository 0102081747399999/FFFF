/**
 * متجر ملابس رجالي كاجوال — إدارة سلة المشتريات
 * Shopping Cart Reactive State Management
 */

import { formatEGP } from './products.js';

const CART_STORAGE_KEY = 'nukhba_casual_cart';

// Default initial trendy men's clothing items
const DEFAULT_INITIAL_CART = [
  {
    id: 'oversized-tee-acid',
    title: 'تيشيرت أوفر سايز قطن معالج — طباعة جرافيك عصرية',
    size: 'L',
    color: 'أسود فحمي',
    price: 380,
    qty: 1,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'cargo-pants-tactical',
    title: 'بنطلون كارجو ستريت كاجوال بجيوب جانبية — خامة جبردين ليكرا',
    size: '32',
    color: 'بيج رملي',
    price: 490,
    qty: 1,
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80'
  }
];

class CartManager {
  constructor() {
    this.cart = this.loadCart();
    this.initStorageListener();
  }

  loadCart() {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("Could not read cart from localStorage:", e);
    }
    // Return default casual items on first launch
    this.saveCart(DEFAULT_INITIAL_CART);
    return [...DEFAULT_INITIAL_CART];
  }

  saveCart(items = this.cart) {
    this.cart = items;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.cart));
    } catch (e) {
      console.error("Could not write cart to localStorage:", e);
    }
    this.emitChange();
  }

  initStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === CART_STORAGE_KEY) {
        try {
          this.cart = JSON.parse(e.newValue || '[]');
          this.emitChange();
        } catch (err) {}
      }
    });
  }

  emitChange() {
    window.dispatchEvent(new CustomEvent('cartChanged', { detail: { cart: this.cart } }));
  }

  getItems() {
    return [...this.cart];
  }

  addItem(product, size = 'L', color = '', qty = 1) {
    const existing = this.cart.find(item => item.id === product.id && item.size === size && item.color === color);
    if (existing) {
      existing.qty += qty;
    } else {
      this.cart.push({
        id: product.id,
        title: product.title,
        size: size,
        color: color || (product.colors && product.colors[0] ? product.colors[0].name : ''),
        price: product.price,
        qty: qty,
        image: product.image
      });
    }
    this.saveCart();
  }

  updateQty(index, delta) {
    if (index >= 0 && index < this.cart.length) {
      this.cart[index].qty += delta;
      if (this.cart[index].qty <= 0) {
        this.cart.splice(index, 1);
      }
      this.saveCart();
    }
  }

  removeItem(index) {
    if (index >= 0 && index < this.cart.length) {
      this.cart.splice(index, 1);
      this.saveCart();
    }
  }

  clear() {
    this.cart = [];
    this.saveCart([]);
  }

  getTotalCount() {
    return this.cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  }

  getSubtotal() {
    return this.cart.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 1)), 0);
  }
}

export const cart = new CartManager();
