/**
 * دار النخبة — إعدادات واتصال Firebase
 * Firebase v13.4.0 Modular SDK Configuration & Firestore Database Integration
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-analytics.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC3UX7hG5IogDmGWfF8vX-b8VTQQhrbpko",
  authDomain: "test-64f03.firebaseapp.com",
  projectId: "test-64f03",
  storageBucket: "test-64f03.firebasestorage.app",
  messagingSenderId: "53533784701",
  appId: "1:53533784701:web:891d0cf06f7c31fdfe8f14",
  measurementId: "G-F0SG95SX5W"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Analytics safely (works if window is supported)
export let analytics = null;
try {
  if (typeof window !== 'undefined' && location.protocol.startsWith('http')) {
    analytics = getAnalytics(app);
  }
} catch (e) {
  console.warn("Firebase Analytics could not be initialized in this environment:", e);
}

// Initialize Cloud Firestore Database
export const db = getFirestore(app);
export const ORDERS_COLLECTION = 'orders';

/**
 * LocalStorage Fallback Helper for Resilient Offline & Backup Sync
 */
const LOCAL_STORAGE_ORDERS_KEY = 'nukhba_firestore_orders_backup';

export function getLocalOrders() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error reading local orders:", e);
    return [];
  }
}

export function saveLocalOrder(order) {
  try {
    const orders = getLocalOrders();
    orders.unshift(order);
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error("Error saving local order:", e);
  }
}

export function updateLocalOrderStatus(orderId, newStatus) {
  try {
    const orders = getLocalOrders();
    const target = orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (target) {
      target.status = newStatus;
      target.updatedAt = new Date().toISOString();
      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(orders));
    }
  } catch (e) {
    console.error("Error updating local order status:", e);
  }
}

export function deleteLocalOrder(orderId) {
  try {
    let orders = getLocalOrders();
    orders = orders.filter(o => o.id !== orderId && o.orderNumber !== orderId);
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error("Error deleting local order:", e);
  }
}

/**
 * Save new customer order into Firestore and LocalStorage
 * @param {Object} orderData
 * @returns {Promise<{success: boolean, id: string, mode: string}>}
 */
export async function saveOrder(orderData) {
  const preparedData = {
    ...orderData,
    createdAt: new Date().toISOString(),
    status: orderData.status || 'قيد الانتظار',
    timestamp: Date.now()
  };

  // Always backup locally
  saveLocalOrder(preparedData);

  try {
    // Attempt Firestore persistence
    const colRef = collection(db, ORDERS_COLLECTION);
    const docRef = await addDoc(colRef, {
      ...preparedData,
      firestoreCreatedAt: serverTimestamp()
    });

    console.log("✓ Order successfully saved in Firebase Firestore! Document ID:", docRef.id);
    
    // Update local copy with the firestore ID
    updateLocalOrderStatus(preparedData.orderNumber, preparedData.status);

    return {
      success: true,
      id: docRef.id,
      orderNumber: preparedData.orderNumber,
      mode: 'firebase'
    };
  } catch (firestoreError) {
    console.warn("Firestore save failed or security rules require configuration. Saved locally as fallback.", firestoreError);
    return {
      success: true,
      id: preparedData.orderNumber,
      orderNumber: preparedData.orderNumber,
      mode: 'local_fallback',
      warning: "تم حفظ الطلب محلياً بنجاح (يرجى تفعيل قواعد Firestore في لوحة تحكم Firebase)."
    };
  }
}

/**
 * Real-time Listener for incoming orders (used by sales.html dashboard)
 * @param {Function} onDataCallback - callback receiving orders array
 * @param {Function} onErrorCallback - error callback
 * @returns {Function} unsubscribe function
 */
export function subscribeOrders(onDataCallback, onErrorCallback) {
  let unsubscribeFirestore = () => {};

  try {
    const colRef = collection(db, ORDERS_COLLECTION);
    const q = query(colRef);

    unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const orders = [];
      snapshot.forEach(docSnap => {
        orders.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      // Sort by newest first
      orders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      // Also merge any local backup orders not in firestore yet
      const localOrders = getLocalOrders();
      const existingNumbers = new Set(orders.map(o => o.orderNumber));
      for (const lo of localOrders) {
        if (!existingNumbers.has(lo.orderNumber)) {
          orders.push(lo);
        }
      }
      orders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      onDataCallback(orders, 'firebase');
    }, (error) => {
      console.warn("Firestore onSnapshot error (likely rules or network). Falling back to local orders listener:", error);
      if (onErrorCallback) onErrorCallback(error);
      // Fallback: emit local orders
      onDataCallback(getLocalOrders(), 'local_fallback');
    });
  } catch (err) {
    console.warn("Could not attach Firestore onSnapshot:", err);
    onDataCallback(getLocalOrders(), 'local_fallback');
  }

  // Window storage event for multi-tab synchronization in local fallback mode
  const storageHandler = (e) => {
    if (e.key === LOCAL_STORAGE_ORDERS_KEY) {
      onDataCallback(getLocalOrders(), 'local_sync');
    }
  };
  window.addEventListener('storage', storageHandler);

  return () => {
    unsubscribeFirestore();
    window.removeEventListener('storage', storageHandler);
  };
}

/**
 * Update order status (e.g., 'تم التأكيد', 'جاري التوصيل', 'تم التوصيل', 'ملغي')
 */
export async function updateOrderStatus(orderDocId, newStatus) {
  updateLocalOrderStatus(orderDocId, newStatus);
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderDocId);
    await updateDoc(docRef, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.warn("Firestore updateDoc error, updated locally:", error);
    return false;
  }
}

/**
 * Delete an order
 */
export async function deleteOrder(orderDocId) {
  deleteLocalOrder(orderDocId);
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderDocId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.warn("Firestore deleteDoc error, deleted locally:", error);
    return false;
  }
}
