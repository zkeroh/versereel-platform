// VerseReel Production Standalone Bundle
(function() {
  'use strict';

  // Automatic Legacy Cache Purger
  try {
    localStorage.removeItem('versereel_storage');
    localStorage.removeItem('versereel_data');
    localStorage.removeItem('versereel_data_v2');
    localStorage.removeItem('versereel_data_v3');
    if (window.indexedDB) {
      window.indexedDB.deleteDatabase('VerseReelDB');
      window.indexedDB.deleteDatabase('versereel_db');
    }
  } catch (e) {}

  // 1. Data Layer & IndexedDB Store
  const STORAGE_KEY = 'versereel_data_v99';
  const DB_NAME = 'VerseReelDB_v99';
  const DB_VERSION = 1;
  const STORE_NAME = 'app_state';

  // =========================================================================
  // 📚 CATÁLOGO OFICIAL DE CÓMICS DE VERSEREEL
  // ¡PEGA TUS NUEVOS CÓMICS AQUÍ ABAJO DENTRO DE LOS CORCHETES [ ... ]!
  // =========================================================================
  const COMICS_CATALOG = [
    {
      id: "a-good-friend",
      title: "A GOOD FRIEND",
      language: "en",
      type: "comic",
      genre: "Romance",
      author: "Zkero",
      description: "What was supposed to be a normal dinner among friends gets completely derailed by an unexpected accident. In the chaos of the moment, boundaries blur, and a new spark ignites.",
      isPaid: false,
      price: 0,
      downloadUrl: "assets/A GOOD FRIEND.pdf",
      thumbnail: "assets/G0.jpg",
      pages: Array.from({ length: 20 }, (_, i) => `assets/G${i}.jpg`),
      views: 5240,
      createdAt: new Date().toISOString()
    },
    {
      id: "the-wish",
      title: "THE WISH",
      language: "en",
      type: "comic",
      genre: "Romance",
      author: "Zkero",
      description: "One wish will make sure he never has to lament a night without sex again.",
      isPaid: false,
      price: 0,
      downloadUrl: "assets/THEWISH.pdf",
      thumbnail: "assets/W00.jpg",
      pages: Array.from({ length: 9 }, (_, i) => `assets/W${String(i).padStart(2, '0')}.jpg`),
      views: 4890,
      createdAt: new Date().toISOString()
    },
    {
      id: "lemonade",
      title: "LEMONADE",
      language: "en",
      type: "comic",
      genre: "Romance",
      author: "Zkero",
      description: "Classic comic. Now more intense!",
      isPaid: true,
      price: 1.00,
      previewLimit: 20,
      paymentUrl: "https://mpago.la/2om6XKk",
      paypalUrl: "https://www.paypal.com/ncp/payment/FZCP8QGCGTTX2",
      downloadUrl: "assets/LEMONADE.pdf",
      thumbnail: "assets/L00.jpg",
      pages: Array.from({ length: 27 }, (_, i) => `assets/L${String(i).padStart(2, '0')}.jpg`),
      views: 10350,
      createdAt: new Date().toISOString()
    },
    {
      id: "no-internet",
      title: "NO INTERNET",
      language: "es",
      type: "comic",
      genre: "Romance",
      author: "Zkero",
      description: "¡Un clásico del cómic rediseñado como nunca lo viste!",
      isPaid: true,
      price: 1.00,
      previewLimit: 30,
      paymentUrl: "https://mpago.la/1DtXktD",
      paypalUrl: "https://www.paypal.com/ncp/payment/FZCP8QGCGTTX2",
      downloadUrl: "assets/NO INTERNET COMPLETO.pdf",
      thumbnail: "assets/0.jpg",
      pages: ['assets/0.jpg', 'assets/ADICIONAL ESPAÑOL.jpg', ...Array.from({ length: 41 }, (_, i) => `assets/${i + 1}.jpg`)],
      views: 10142,
      createdAt: new Date().toISOString()
    }
  ];

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function saveToDB(key, data) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(data, key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.error('Failed to save to IndexedDB', e);
    }
  }

  async function loadFromDB(key) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.error('Failed to load from IndexedDB', e);
      return null;
    }
  }

  const INITIAL_DATA = {
    adminPin: '1234',
    walletBalance: 25.00,
    unlockedItemIds: [],
    transactions: [],
    creatorStats: {
      totalRevenue: 0.00,
      totalViews: 0,
      subscribers: 0
    },
    items: [...COMICS_CATALOG]
  };

  class Store {
    constructor() {
      this.data = INITIAL_DATA;
      this.listeners = [];
      this.initAsyncStorage();
    }

    async initAsyncStorage() {
      try {
        const saved = await loadFromDB(STORAGE_KEY);
        if (saved) {
          this.data = { ...INITIAL_DATA, ...saved };
        } else {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            try {
              this.data = { ...INITIAL_DATA, ...JSON.parse(raw) };
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn('DB load fallback:', err);
      }

      // Enforce strict single source of truth for public catalog
      this.data.items = [...COMICS_CATALOG];
      this.notify();
    }

    async saveData() {
      await saveToDB(STORAGE_KEY, this.data);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (e) {}
      this.notify();
    }

    subscribe(listener) {
      this.listeners.push(listener);
      return () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      };
    }

    notify() {
      this.listeners.forEach(l => l(this.data));
    }

    verifyAdminPin(enteredPin) {
      const currentPin = this.data.adminPin || '1234';
      return enteredPin === currentPin;
    }

    setAdminPin(newPin) {
      if (newPin && newPin.trim().length >= 4) {
        this.data.adminPin = newPin.trim();
        this.saveData();
        return true;
      }
      return false;
    }

    getItems() {
      const viewsMap = this.data.viewsMap || {};
      // Base reference launch timestamp
      const baseLaunchTime = 1787356800000; // Aug 21 2026 00:00:00
      const elapsedMinutes = Math.max(0, Math.floor((Date.now() - baseLaunchTime) / (1000 * 60)));

      return COMICS_CATALOG.map(item => {
        // Natural organic growth per minute
        const ratePerMinute = item.id === 'no-internet' ? 1.8 : 1.2;
        const organicViews = Math.floor(elapsedMinutes * ratePerMinute);
        const localViews = viewsMap[item.id] || 0;

        return {
          ...item,
          views: (item.views || 0) + organicViews + localViews
        };
      });
    }

    isItemUnlocked(itemId) {
      const item = this.getItems().find(i => i.id === itemId);
      if (!item || !item.isPaid) return true;
      return (this.data.unlockedItemIds || []).includes(itemId);
    }

    unlockItem(itemId) {
      const item = this.getItems().find(i => i.id === itemId);
      if (!item) return { success: false, message: 'Item no encontrado' };
      
      if (this.isItemUnlocked(itemId)) {
        return { success: true, message: 'Ya desbloqueado' };
      }

      this.data.unlockedItemIds.push(itemId);
      this.data.creatorStats.totalRevenue += item.price;

      this.data.transactions.unshift({
        id: 'tx-' + Date.now(),
        itemId: item.id,
        title: item.title,
        amount: item.price,
        date: new Date().toISOString().split('T')[0]
      });

      this.saveData();
      return { success: true, message: `¡Desbloqueado exitosamente "${item.title}"!` };
    }

    addItem(newItem) {
      const item = {
        id: 'item-' + Date.now(),
        views: 0,
        createdAt: new Date().toISOString().split('T')[0],
        ...newItem
      };
      this.data.items.unshift(item);
      this.saveData();
      return item;
    }

    updateItemPricing(itemId, isPaid, price) {
      const item = this.data.items.find(i => i.id === itemId);
      if (item) {
        item.isPaid = isPaid;
        item.price = isPaid ? Number(price) : 0;
        this.saveData();
      }
    }

    deleteItem(itemId) {
      this.data.items = this.data.items.filter(i => i.id !== itemId);
      this.saveData();
    }

    incrementViews(itemId) {
      if (!this.data.viewsMap) this.data.viewsMap = {};
      this.data.viewsMap[itemId] = (this.data.viewsMap[itemId] || 0) + 1;
      this.data.creatorStats.totalViews = (this.data.creatorStats.totalViews || 0) + 1;
      this.saveData();
    }
  }

  const store = new Store();

  // 2. Admin Authentication Modal
  function createAdminLoginModal(onSuccess, showToast) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.maxWidth = '450px';

    content.innerHTML = `
      <div class="modal-header">
        <div class="modal-title">
          <i class="ph-lock-key" style="color: var(--primary);"></i>
          <span>Acceso de Administrador</span>
        </div>
        <button class="close-btn" id="admin-close-btn">&times;</button>
      </div>
      <div class="modal-body" style="text-align: center; padding: 2rem;">
        <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(168, 85, 247, 0.15); border: 2px solid var(--primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; color: var(--primary); font-size: 2rem;">
          <i class="ph-shield-check"></i>
        </div>

        <h3 style="color: #fff; font-size: 1.3rem; font-weight: 800; margin-bottom: 0.5rem;">Panel de Administración Reservado</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; line-height: 1.4;">
          Solo el dueño de la página tiene permiso para subir, editar o borrar cómics. Ingresa tu clave secreta:
        </p>

        <form id="admin-auth-form" style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="position: relative;">
            <input 
              type="password" 
              id="admin-pin-input" 
              class="form-input" 
              placeholder="Clave Secreta de Administrador" 
              style="width: 100%; padding-left: 2.5rem; text-align: center; font-size: 1.1rem; letter-spacing: 2px;" 
              required 
              autofocus 
            />
            <i class="ph-key" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-dim);"></i>
          </div>

          <button type="submit" class="btn-primary" style="justify-content: center; width: 100%; padding: 0.85rem;">
            <i class="ph-sign-in"></i> Entrar al Panel de Creador
          </button>
        </form>

        <div style="margin-top: 1.25rem; font-size: 0.78rem; color: var(--text-dim); background: rgba(255,255,255,0.03); padding: 0.6rem; border-radius: var(--radius-sm);">
          🔑 <strong>Clave por defecto</strong>: <code style="color: var(--cyan);">1234</code> (Puedes cambiarla en cualquier momento dentro del Creator Studio).
        </div>
      </div>
    `;

    backdrop.appendChild(content);
    document.body.appendChild(backdrop);

    const closeBtn = content.querySelector('#admin-close-btn');
    closeBtn.onclick = () => document.body.removeChild(backdrop);

    const form = content.querySelector('#admin-auth-form');
    const pinInput = content.querySelector('#admin-pin-input');

    form.onsubmit = (e) => {
      e.preventDefault();
      const enteredPin = pinInput.value.trim();

      if (store.verifyAdminPin(enteredPin)) {
        document.body.removeChild(backdrop);
        if (showToast) showToast('🔓 ¡Acceso concedido al Panel de Administrador!');
        if (onSuccess) onSuccess();
      } else {
        if (showToast) showToast('🔒 Clave de administrador incorrecta. Acceso denegado.');
        pinInput.value = '';
        pinInput.focus();
      }
    };
  }

  // 3. Dedicated Mobile-Optimized Full-Page Comic Reader Component
  // 3. Full-Screen Mobile-Optimized Comic Reader Overlay Component
function openFullpageComicReader(item) {
    try {
      localStorage.setItem('pending_unlock_comic', item.id);
    } catch (e) {}

    if (window.appInstance) {
      window.appInstance.activeComic = item;
      window.appInstance.currentPageIndex = 0;
      if (!window.location.search.includes('comic=' + item.id)) {
        history.pushState({}, '', '?comic=' + item.id);
      }
      window.appInstance.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function createComicReaderModal(item, onClose, onUnlockRequest) {
    openFullpageComicReader(item);
  }

  // 4. Video Player Component
  function createVideoPlayerModal(item, onClose) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    const content = document.createElement('div');
    content.className = 'modal-content video-modal';

    let videoElement = null;
    let isLockedState = false;
    const isUnlocked = store.isItemUnlocked(item.id);
    const previewLimitSec = (item.previewLimit || 1) * 60;

    function renderModal() {
      content.innerHTML = `
        <div class="modal-header">
          <div class="modal-title">
            <i class="ph-video-camera" style="color: var(--cyan);"></i>
            <span>${item.title}</span>
            ${item.isPaid ? `<span class="price-tag paid">$${item.price.toFixed(2)}</span>` : '<span class="price-tag free">FREE</span>'}
          </div>
          <button class="close-btn" id="video-close-btn">&times;</button>
        </div>
        <div class="modal-body" style="padding: 1.25rem;">
          <div class="video-player-wrapper" id="player-wrapper">
            ${isLockedState ? `
              <div class="paywall-card" style="margin: 3rem auto;">
                <div class="paywall-icon" style="border-color: var(--cyan); color: var(--cyan); background: rgba(6,182,212,0.15);">
                  <i class="ph-lock"></i>
                </div>
                <h2 style="color:#fff; font-size:1.5rem; font-weight:800;">Fin del Tiempo de Prueba</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem;">
                  Has visto los ${previewLimitSec} segundos de prueba gratuita. ¡Desbloquea el video completo para continuar viéndolo!
                </p>
                <div class="paywall-price">$${item.price.toFixed(2)}</div>
                <button class="btn-primary" id="video-paywall-unlock-btn" style="width: 100%; justify-content: center; background: linear-gradient(135deg, var(--cyan), #0284c7);">
                  <i class="ph-credit-card"></i> ${item.paymentUrl ? 'Ir a Pagar $' + item.price.toFixed(2) : 'Desbloquear Video Completo ($' + item.price.toFixed(2) + ')'}
                </button>

                <div id="video-payment-confirm-box" style="display: none; width: 100%; margin-top: 0.75rem; background: rgba(6, 182, 212, 0.12); border: 1px solid var(--cyan); padding: 1rem; border-radius: var(--radius-md); text-align: center;">
                  <p style="color: var(--cyan); font-weight: 700; font-size: 0.88rem; margin-bottom: 0.6rem;">
                    ¿Ya completaste tu pago en la pasarela? Haz clic abajo para reanudar el video:
                  </p>
                  <button class="btn-secondary" id="confirm-video-unlock-btn" style="width: 100%; justify-content: center; border-color: var(--cyan); color: var(--cyan); font-weight: 700;">
                    <i class="ph-check-circle"></i> Confirmar Pago y Ver Ahora
                  </button>
                </div>
              </div>
            ` : `
              <video id="active-video-element" class="video-element" controls poster="${item.thumbnail}" autoplay>
                <source src="${item.videoUrl}" type="video/mp4">
                Your browser does not support HTML5 video.
              </video>
            `}
          </div>

          <div style="margin-top: 1.25rem;">
            <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 0.4rem;">${item.title}</h3>
            <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 1rem;">${item.description}</p>
          </div>
        </div>
      `;

      content.querySelector('#video-close-btn').onclick = () => {
        document.body.removeChild(backdrop);
        if (onClose) onClose();
      };

      if (!isLockedState) {
        videoElement = content.querySelector('#active-video-element');
        if (videoElement && item.isPaid && !isUnlocked) {
          videoElement.ontimeupdate = () => {
            if (videoElement.currentTime >= previewLimitSec) {
              videoElement.pause();
              isLockedState = true;
              renderModal();
            }
          };
        }
      } else {
        const unlockBtn = content.querySelector('#video-paywall-unlock-btn');
        if (unlockBtn) {
          unlockBtn.onclick = () => {
            if (item.paymentUrl) {
              window.open(item.paymentUrl, '_blank');
              const confirmBox = content.querySelector('#video-payment-confirm-box');
              if (confirmBox) confirmBox.style.display = 'block';
            } else {
              const res = store.unlockItem(item.id);
              if (res.success) {
                isLockedState = false;
                renderModal();
              }
            }
          };
        }

        const confirmBtn = content.querySelector('#confirm-video-unlock-btn');
        if (confirmBtn) {
          confirmBtn.onclick = () => {
            const res = store.unlockItem(item.id);
            if (res.success) {
              isLockedState = false;
              renderModal();
            }
          };
        }
      }
    }

    backdrop.appendChild(content);
    document.body.appendChild(backdrop);
    renderModal();

    store.incrementViews(item.id);
  }

  // 5. Creator Studio Component
  const CLOUDINARY_CLOUD_NAME = 'bre5du5y';
  const CLOUDINARY_PRESET = 'ml_default';

  function renderCreatorStudio(containerEl, showToast) {
    const items = store.getItems();
    const stats = store.data.creatorStats || { totalRevenue: 0, totalViews: 0 };
    const comicCount = items.filter(i => i.type === 'comic').length;
    const videoCount = items.filter(i => i.type === 'video').length;
    const paidCount = items.filter(i => i.isPaid).length;
    const freeCount = items.length - paidCount;

    containerEl.innerHTML = `
      <div class="studio-container">
        <div class="studio-header">
          <div>
            <h1 style="font-size: 1.8rem; font-weight: 900; color: #fff;">Creator Upload & Monetization Studio</h1>
            <p style="color: var(--text-muted); font-size: 0.95rem;">Upload new free and paid comics & videos, set custom paywall preview rules, and track revenue.</p>
          </div>
          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <button class="btn-secondary" id="change-pin-btn" style="border-color: var(--primary); color: #d8b4fe;">
              <i class="ph-key"></i> Cambiar Clave Admin
            </button>
            <button class="btn-primary" id="btn-open-upload-tab">
              <i class="ph-upload-simple"></i> Subir Nuevo Cómic / Video
            </button>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon emerald">
              <i class="ph-currency-dollar"></i>
            </div>
            <div>
              <div class="stat-value">$${stats.totalRevenue.toFixed(2)}</div>
              <div class="stat-label">Total Creator Earnings</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon cyan">
              <i class="ph-eye"></i>
            </div>
            <div>
              <div class="stat-value">${stats.totalViews.toLocaleString()}</div>
              <div class="stat-label">Total Content Views</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <i class="ph-book-open"></i>
            </div>
            <div>
              <div class="stat-value">${comicCount}</div>
              <div class="stat-label">Comics (${paidCount} Paid / ${freeCount} Free)</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon magenta">
              <i class="ph-video-camera"></i>
            </div>
            <div>
              <div class="stat-value">${videoCount}</div>
              <div class="stat-label">Videos</div>
            </div>
          </div>
        </div>

        <div class="studio-tabs">
          <button class="tab-btn active" id="tab-upload">
            <i class="ph-plus-circle"></i> Upload New Content
          </button>
          <button class="tab-btn" id="tab-cms">
            <i class="ph-folder-simple"></i> Content Catalog CMS (${items.length})
          </button>
        </div>

        <div id="panel-upload">
          <form id="upload-form" class="upload-card">
            <div class="form-grid">
              <div class="form-group full-width">
                <label class="form-label"><i class="ph-text-t"></i> Content Type</label>
                <div class="segmented-control" id="type-selector">
                  <button type="button" class="segmented-btn active" data-type="comic">
                    <i class="ph-book-open"></i> Comic (Multi-page PDF / PNG / JPG)
                  </button>
                  <button type="button" class="segmented-btn" data-type="video">
                    <i class="ph-video-camera"></i> Video Reel (MP4)
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label"><i class="ph-textbox"></i> Title</label>
                <input type="text" id="upload-title" class="form-input" placeholder="ej. Cyberpunk Genesis - Edición Especial" required />
              </div>

              <div class="form-group">
                <label class="form-label"><i class="ph-user"></i> Author / Studio Name</label>
                <input type="text" id="upload-author" class="form-input" placeholder="ej. Alex Rivers Studio" required />
              </div>

              <div class="form-group">
                <label class="form-label"><i class="ph-tag"></i> Genre / Category</label>
                <select id="upload-genre" class="form-select">
                  <option value="Sci-Fi">Sci-Fi / Cyberpunk</option>
                  <option value="Fantasy">Fantasy / Magic</option>
                  <option value="Action">Action / Adventure</option>
                  <option value="Romance">Romance / Drama</option>
                  <option value="Tutorial">Digital Art / Tutorial</option>
                  <option value="Horror">Horror / Mystery</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label"><i class="ph-lock-key"></i> Access Tier & Monetization</label>
                <div class="segmented-control" id="pricing-selector">
                  <button type="button" class="segmented-btn active" data-paid="false">
                    <i class="ph-gift"></i> FREE Access
                  </button>
                  <button type="button" class="segmented-btn" data-paid="true">
                    <i class="ph-currency-dollar"></i> PAID / Premium ($)
                  </button>
                </div>
              </div>

              <div class="form-group" id="price-group" style="display: none;">
                <label class="form-label"><i class="ph-coins"></i> Unlock Price (USD $)</label>
                <input type="number" step="0.01" min="0" value="2.99" id="upload-price" class="form-input" placeholder="ej. 2.99" />
              </div>

              <div class="form-group" id="preview-group" style="display: none;">
                <label class="form-label" id="preview-label"><i class="ph-eye"></i> Free Preview Limit</label>
                <input type="number" min="1" value="15" id="upload-preview-limit" class="form-input" />
              </div>

              <div class="form-group full-width" id="payment-url-group" style="display: none;">
                <label class="form-label"><i class="ph-credit-card"></i> Link de Pago (MercadoPago, PayPal, Stripe, Gumroad, etc.)</label>
                <input type="url" id="upload-payment-url" class="form-input" placeholder="https://mpago.la/tu-link  o  https://paypal.me/tu-usuario  o  https://buy.stripe.com/..." />
                <span style="font-size: 0.8rem; color: var(--text-muted);">
                  💡 Cuando los lectores lleguen a la página 16, este enlace se abrirá para que paguen $2.99 con tu pasarela preferida.
                </span>
              </div>

              <div class="form-group full-width">
                <label class="form-label"><i class="ph-article"></i> Description & Synopsis</label>
                <textarea id="upload-desc" class="form-textarea" placeholder="Escribe una breve sinopsis para tus lectores..." required></textarea>
              </div>

              <div class="form-group full-width">
                <label class="form-label" id="file-upload-label"><i class="ph-image"></i> Subir Páginas del Cómic (Imágenes JPG / PNG / WEBP)</label>
                
                <input type="file" id="upload-file-input" multiple accept="image/*,video/*" style="display: none;" />
                
                <div class="dropzone" id="file-dropzone" style="cursor: pointer;">
                  <div class="dropzone-icon"><i class="ph-cloud-arrow-up"></i></div>
                  <div style="font-weight: 700; color: #fff; font-size: 1.05rem;" id="dropzone-main-text">Arrastra y suelta tus páginas aquí o haz clic para explorar</div>
                  <div style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.25rem;" id="dropzone-help-text">Soporta múltiples imágenes (Páginas 1, 2, 3... 15+). Se ordenarán automáticamente por nombre.</div>
                </div>

                <div class="pages-preview-grid" id="pages-preview-grid" style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1rem;"></div>
              </div>
            </div>

            <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end;">
              <button type="submit" class="btn-primary" style="padding: 0.85rem 2rem; font-size: 1.05rem;">
                <i class="ph-paper-plane-right"></i> Publicar en la Nube
              </button>
            </div>
          </form>
        </div>

        <div id="panel-cms" style="display: none;">
          <div class="upload-card">
            <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 1rem;">Administración de Catálogo</h3>
            
            ${items.length === 0 ? `
              <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                <i class="ph-folder-open" style="font-size: 3rem; color: var(--text-dim); margin-bottom: 0.75rem;"></i>
                <p style="font-size: 1.1rem; font-weight: 600; color: #fff;">Catálogo Vacío</p>
                <p style="font-size: 0.9rem;">No hay cómics ni videos subidos. Usa la pestaña "Upload New Content" arriba para empezar.</p>
              </div>
            ` : `
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; color: #fff;">
                  <thead>
                    <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: 0.85rem;">
                      <th style="padding: 0.75rem;">Portada</th>
                      <th style="padding: 0.75rem;">Título</th>
                      <th style="padding: 0.75rem;">Tipo</th>
                      <th style="padding: 0.75rem;">Precio</th>
                      <th style="padding: 0.75rem;">Vistas</th>
                      <th style="padding: 0.75rem;">Publicidad / Link</th>
                      <th style="padding: 0.75rem;">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items.map(item => `
                      <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem;">
                        <td style="padding: 0.75rem;">
                          <img src="${item.thumbnail}" style="width: 48px; height: 64px; object-fit: cover; border-radius: 4px;" alt="thumb" />
                        </td>
                        <td style="padding: 0.75rem; font-weight: 700;">${item.title}</td>
                        <td style="padding: 0.75rem;">${item.type.toUpperCase()}</td>
                        <td style="padding: 0.75rem;">${item.isPaid ? '$' + item.price.toFixed(2) : 'GRATIS'}</td>
                        <td style="padding: 0.75rem;">${item.views || 0}</td>
                        <td style="padding: 0.75rem;">
                          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                            <button class="btn-secondary copy-ad-link-btn" data-id="${item.id}" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;" title="Copiar enlace para campaña en redes">
                              <i class="ph-link"></i> Link Anuncio
                            </button>
                            <button class="btn-secondary copy-mp-link-btn" data-id="${item.id}" style="padding: 0.3rem 0.6rem; font-size: 0.78rem; border-color: var(--emerald); color: #34d399;" title="Copiar URL de Retorno de MercadoPago / PayPal">
                              <i class="ph-check-circle"></i> Link Éxito MP
                            </button>
                          </div>
                        </td>
                        <td style="padding: 0.75rem;">
                          <button class="btn-secondary delete-cms-btn" data-id="${item.id}" style="padding: 0.3rem 0.6rem; font-size: 0.78rem; border-color: var(--rose); color: var(--rose);">
                            <i class="ph-trash"></i> Borrar
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    // Internal CreatorStudio logic
    let currentType = 'comic';
    let isPaidChoice = false;
    let uploadedFilesData = [];

    const typeSelector = containerEl.querySelector('#type-selector');
    const dropzoneMain = containerEl.querySelector('#dropzone-main-text');
    const dropzoneHelp = containerEl.querySelector('#dropzone-help-text');
    const fileUploadLabel = containerEl.querySelector('#file-upload-label');
    const previewLabel = containerEl.querySelector('#preview-label');

    typeSelector.querySelectorAll('.segmented-btn').forEach(btn => {
      btn.onclick = () => {
        typeSelector.querySelectorAll('.segmented-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentType = btn.dataset.type;

        if (currentType === 'comic') {
          fileUploadLabel.innerHTML = '<i class="ph-image"></i> Subir Páginas del Cómic (Imágenes JPG / PNG / WEBP)';
          dropzoneMain.innerText = 'Arrastra y suelta tus páginas aquí o haz clic para explorar';
          dropzoneHelp.innerText = 'Soporta múltiples imágenes. Se ordenarán automáticamente por número (1, 2, 3... 15+).';
          if (previewLabel) previewLabel.innerHTML = '<i class="ph-eye"></i> Páginas Gratis de Muestra (Límite Paywall)';
        } else {
          fileUploadLabel.innerHTML = '<i class="ph-video-camera"></i> Subir Archivo de Video MP4';
          dropzoneMain.innerText = 'Arrastra y suelta tu video MP4 aquí';
          dropzoneHelp.innerText = 'Formatos soportados: MP4, WebM.';
          if (previewLabel) previewLabel.innerHTML = '<i class="ph-eye"></i> Minutos Gratis de Muestra (Límite Paywall)';
        }
      };
    });

    const pricingSelector = containerEl.querySelector('#pricing-selector');
    const priceGroup = containerEl.querySelector('#price-group');
    const previewGroup = containerEl.querySelector('#preview-group');
    const paymentUrlGroup = containerEl.querySelector('#payment-url-group');

    pricingSelector.querySelectorAll('.segmented-btn').forEach(btn => {
      btn.onclick = () => {
        pricingSelector.querySelectorAll('.segmented-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        isPaidChoice = btn.dataset.paid === 'true';

        priceGroup.style.display = isPaidChoice ? 'flex' : 'none';
        previewGroup.style.display = isPaidChoice ? 'flex' : 'none';
        if (paymentUrlGroup) paymentUrlGroup.style.display = isPaidChoice ? 'flex' : 'none';
      };
    });

    const fileInput = containerEl.querySelector('#upload-file-input');
    const dropzone = containerEl.querySelector('#file-dropzone');
    const previewGrid = containerEl.querySelector('#pages-preview-grid');

    dropzone.onclick = () => fileInput.click();

    dropzone.ondragover = (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--primary)';
    };

    dropzone.ondragleave = () => {
      dropzone.style.borderColor = 'var(--border)';
    };

    dropzone.ondrop = (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--border)';
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processSelectedFiles(e.dataTransfer.files);
      }
    };

    fileInput.onchange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        processSelectedFiles(e.target.files);
      }
    };

    let draggedIndex = null;

    function sortUploadedFilesByName() {
      uploadedFilesData.sort((a, b) => 
        (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' })
      );
      renderPagePreviews();
    }

    function processSelectedFiles(filesList) {
      const newFilesArr = Array.from(filesList).sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );

      let loadedCount = 0;
      newFilesArr.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          uploadedFilesData.push({
            name: file.name,
            type: file.type,
            url: event.target.result
          });
          loadedCount++;
          if (loadedCount === newFilesArr.length) {
            sortUploadedFilesByName();
          }
        };
        reader.readAsDataURL(file);
      });
    }

    function renderPagePreviews() {
      previewGrid.innerHTML = '';
      if (uploadedFilesData.length === 0) return;

      // Header bar with Auto-Sort button and count
      const headerBar = document.createElement('div');
      headerBar.style.cssText = 'display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 0.75rem; background: rgba(255,255,255,0.03); padding: 0.55rem 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);';
      headerBar.innerHTML = `
        <span style="font-size: 0.85rem; color: #fff; font-weight: 700;">
          <i class="ph-files" style="color: var(--primary);"></i> ${uploadedFilesData.length} Páginas listas (Arrastra las imágenes o usa ◀ ▶ para reordenar)
        </span>
        <button type="button" id="sort-pages-btn" class="btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; border-color: var(--primary); color: #d8b4fe;">
          <i class="ph-sort-ascending"></i> Ordenar por Nombre (1, 2, 3...)
        </button>
      `;
      previewGrid.appendChild(headerBar);

      headerBar.querySelector('#sort-pages-btn').onclick = () => {
        sortUploadedFilesByName();
        if (showToast) showToast('🔤 Páginas ordenadas automáticamente por nombre de archivo (1, 2, 3...)');
      };

      const gridContainer = document.createElement('div');
      gridContainer.style.cssText = 'display: flex; gap: 0.85rem; flex-wrap: wrap; width: 100%;';

      uploadedFilesData.forEach((fileItem, idx) => {
        const itemEl = document.createElement('div');
        itemEl.draggable = true;
        itemEl.style.cssText = 'position: relative; width: 110px; height: 155px; border-radius: 8px; overflow: hidden; border: 2px solid ' + (idx === 0 ? 'var(--primary)' : 'var(--border-color)') + '; background: #000; cursor: grab; transition: transform 0.2s, border-color 0.2s;';

        const img = document.createElement('img');
        img.src = fileItem.url;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; pointer-events: none;';

        // Drag & Drop event handlers
        itemEl.ondragstart = (e) => {
          draggedIndex = idx;
          itemEl.style.opacity = '0.5';
          e.dataTransfer.effectAllowed = 'move';
        };

        itemEl.ondragend = () => {
          itemEl.style.opacity = '1';
        };

        itemEl.ondragover = (e) => {
          e.preventDefault();
          itemEl.style.borderColor = 'var(--cyan)';
        };

        itemEl.ondragleave = () => {
          itemEl.style.borderColor = idx === 0 ? 'var(--primary)' : 'var(--border-color)';
        };

        itemEl.ondrop = (e) => {
          e.preventDefault();
          if (draggedIndex !== null && draggedIndex !== idx) {
            const moved = uploadedFilesData.splice(draggedIndex, 1)[0];
            uploadedFilesData.splice(idx, 0, moved);
            renderPagePreviews();
          }
        };

        // Top Action Buttons (◀, ▶, ✖)
        const actionControls = document.createElement('div');
        actionControls.style.cssText = 'position: absolute; top: 4px; left: 4px; right: 4px; display: flex; justify-content: space-between; gap: 3px; z-index: 5;';

        // Move Left (◀)
        if (idx > 0) {
          const moveLeftBtn = document.createElement('button');
          moveLeftBtn.type = 'button';
          moveLeftBtn.innerHTML = '<i class="ph-caret-left-bold"></i>';
          moveLeftBtn.title = 'Mover a la izquierda';
          moveLeftBtn.style.cssText = 'background: rgba(0,0,0,0.85); color: #fff; border: 1px solid rgba(255,255,255,0.2); width: 22px; height: 22px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; display: flex; align-items: center; justify-content: center;';
          moveLeftBtn.onclick = (e) => {
            e.stopPropagation();
            const temp = uploadedFilesData[idx];
            uploadedFilesData[idx] = uploadedFilesData[idx - 1];
            uploadedFilesData[idx - 1] = temp;
            renderPagePreviews();
          };
          actionControls.appendChild(moveLeftBtn);
        } else {
          actionControls.appendChild(document.createElement('div'));
        }

        // Move Right (▶)
        if (idx < uploadedFilesData.length - 1) {
          const moveRightBtn = document.createElement('button');
          moveRightBtn.type = 'button';
          moveRightBtn.innerHTML = '<i class="ph-caret-right-bold"></i>';
          moveRightBtn.title = 'Mover a la derecha';
          moveRightBtn.style.cssText = 'background: rgba(0,0,0,0.85); color: #fff; border: 1px solid rgba(255,255,255,0.2); width: 22px; height: 22px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; display: flex; align-items: center; justify-content: center;';
          moveRightBtn.onclick = (e) => {
            e.stopPropagation();
            const temp = uploadedFilesData[idx];
            uploadedFilesData[idx] = uploadedFilesData[idx + 1];
            uploadedFilesData[idx + 1] = temp;
            renderPagePreviews();
          };
          actionControls.appendChild(moveRightBtn);
        } else {
          actionControls.appendChild(document.createElement('div'));
        }

        // Delete (✖)
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.innerHTML = '<i class="ph-x-bold"></i>';
        deleteBtn.title = 'Eliminar página';
        deleteBtn.style.cssText = 'background: rgba(225,29,72,0.9); color: #fff; border: none; width: 22px; height: 22px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; display: flex; align-items: center; justify-content: center;';
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          uploadedFilesData.splice(idx, 1);
          renderPagePreviews();
        };
        actionControls.appendChild(deleteBtn);

        // Badge & Filename Footer
        const badge = document.createElement('div');
        badge.style.cssText = 'position: absolute; bottom: 4px; left: 4px; right: 4px; background: rgba(10,12,20,0.9); color: #fff; font-size: 0.68rem; font-weight: 700; padding: 2px 4px; border-radius: 4px; text-align: center; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; border: 1px solid ' + (idx === 0 ? 'var(--primary)' : 'rgba(255,255,255,0.15)') + ';';
        badge.innerHTML = idx === 0 ? '<span style="color:#d8b4fe;">★ PORTADA</span>' : `Pág ${idx + 1}`;

        itemEl.appendChild(img);
        itemEl.appendChild(actionControls);
        itemEl.appendChild(badge);
        gridContainer.appendChild(itemEl);
      });

      previewGrid.appendChild(gridContainer);
    }

    const uploadFileToCloudinary = async (fileItem) => {
      if (!fileItem || !fileItem.url) return null;
      if (fileItem.url.startsWith('http://') || fileItem.url.startsWith('https://')) return fileItem.url;

      try {
        const formData = new FormData();
        formData.append('file', fileItem.url);
        formData.append('upload_preset', CLOUDINARY_PRESET);

        const resourceType = fileItem.type.startsWith('video/') ? 'video' : 'image';
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          return data.secure_url;
        }
      } catch (err) {
        console.warn('Cloudinary upload fallback:', err);
      }
      return fileItem.url;
    };

    const form = containerEl.querySelector('#upload-form');
    const submitBtn = form.querySelector('button[type="submit"]');

    form.onsubmit = async (e) => {
      e.preventDefault();
      
      const title = containerEl.querySelector('#upload-title').value;
      const genre = containerEl.querySelector('#upload-genre').value;
      const author = containerEl.querySelector('#upload-author').value;
      const desc = containerEl.querySelector('#upload-desc').value;
      const price = isPaidChoice ? parseFloat(containerEl.querySelector('#upload-price').value) : 0;
      const previewLimit = isPaidChoice ? parseInt(containerEl.querySelector('#upload-preview-limit').value) : 999;
      const paymentUrl = isPaidChoice ? (containerEl.querySelector('#upload-payment-url')?.value || '').trim() : '';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="ph-spinner ph-spin"></i> Subiendo a la Nube Cloudinary...';
      }

      const imageFilesData = uploadedFilesData.filter(f => f.type.startsWith('image/'));
      const videoFileData = uploadedFilesData.find(f => f.type.startsWith('video/'));

      const uploadedUrls = await Promise.all(
        imageFilesData.map(fileItem => uploadFileToCloudinary(fileItem))
      );

      let videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
      if (videoFileData) {
        const cloudVideo = await uploadFileToCloudinary(videoFileData);
        if (cloudVideo) videoUrl = cloudVideo;
      }

      const defaultThumb = currentType === 'comic' ? 'assets/cyber_chronicles.jpg' : 'assets/neon_overdrive.jpg';
      const thumbnail = uploadedUrls.length > 0 ? uploadedUrls[0] : defaultThumb;
      const pages = uploadedUrls.length > 0 ? uploadedUrls : [defaultThumb];

      const newItem = {
        title,
        type: currentType,
        genre,
        author,
        description: desc,
        isPaid: isPaidChoice,
        price,
        previewLimit,
        paymentUrl,
        thumbnail,
        pages,
        videoUrl
      };

      store.addItem(newItem);
      showToast(`¡Publicado exitosamente "${title}" en la nube con ${pages.length} páginas!`);
      renderCreatorStudio(containerEl, showToast);
    };

    const tabUploadBtn = containerEl.querySelector('#tab-upload');
    const tabCmsBtn = containerEl.querySelector('#tab-cms');
    const panelUpload = containerEl.querySelector('#panel-upload');
    const panelCms = containerEl.querySelector('#panel-cms');

    tabUploadBtn.onclick = () => {
      tabUploadBtn.classList.add('active');
      tabCmsBtn.classList.remove('active');
      panelUpload.style.display = 'block';
      panelCms.style.display = 'none';
    };

    tabCmsBtn.onclick = () => {
      tabCmsBtn.classList.add('active');
      tabUploadBtn.classList.remove('active');
      panelUpload.style.display = 'none';
      panelCms.style.display = 'block';
    };

    containerEl.querySelector('#btn-open-upload-tab').onclick = () => tabUploadBtn.click();

    const changePinBtn = containerEl.querySelector('#change-pin-btn');
    if (changePinBtn) {
      changePinBtn.onclick = () => {
        const newPin = prompt('Ingresa tu nueva clave secreta de administración (mínimo 4 caracteres):');
        if (newPin && newPin.trim().length >= 4) {
          store.setAdminPin(newPin.trim());
          showToast('🔑 ¡Clave de administrador actualizada exitosamente!');
        } else if (newPin !== null) {
          showToast('⚠️ La clave debe tener al menos 4 caracteres.');
        }
      };
    }

    containerEl.querySelectorAll('.copy-ad-link-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const adUrl = `${window.location.origin}${window.location.pathname}?comic=${id}&utm_source=social_ad`;
        navigator.clipboard.writeText(adUrl).catch(() => {});
        showToast(`¡Link de Anuncio copiado! ${adUrl}`);
      };
    });

    containerEl.querySelectorAll('.copy-mp-link-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const mpUrl = `${window.location.origin}${window.location.pathname}?comic=${id}&status=approved`;
        navigator.clipboard.writeText(mpUrl).catch(() => {});
        showToast(`🔗 ¡Link de Retorno MercadoPago/PayPal copiado! Pégalo en tu URL de Éxito: ${mpUrl}`);
      };
    });

    containerEl.querySelectorAll('.delete-cms-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        if (confirm('¿Seguro que deseas eliminar este contenido?')) {
          store.deleteItem(id);
          showToast('Contenido eliminado.');
          renderCreatorStudio(containerEl, showToast);
        }
      };
    });
  }

  // Age Verification Modal (+18)
  function checkAgeVerification(onVerified) {
    let verified = false;
    try {
      verified = localStorage.getItem('age_verified_18') === 'true';
    } catch (e) {}

    if (verified) {
      if (onVerified) onVerified();
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const comicParam = params.get('comic') || '';
    const userLang = navigator.language || navigator.userLanguage || '';
    const isEn = comicParam.toLowerCase().includes('lemonade') || userLang.toLowerCase().startsWith('en');

    const txtTitle = isEn ? 'Age Verification (18+)' : 'Confirmación de Edad (+18)';
    const txtDescPrimary = isEn
      ? 'This website contains adult graphic novels and comics intended strictly for mature audiences.'
      : 'Este sitio contiene cómics y novelas gráficas para adultos.';
    const txtDescSecondary = isEn
      ? 'By entering, you confirm that you are at least 18 years old or of legal age in your jurisdiction.'
      : 'Al continuar, confirmas que tienes 18 años o más.';
    const txtAccept = isEn ? '🔞 I am 18+ / Enter Site' : '🔞 Soy Mayor de 18 Años / I am 18+';
    const txtExit = isEn ? 'Exit' : 'Salir / Exit';

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.style.cssText = 'position: fixed; inset: 0; z-index: 999999; background: rgba(5, 7, 15, 0.95); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; padding: 1.25rem;';

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.cssText = 'max-width: 440px; width: 100%; background: linear-gradient(135deg, rgba(20, 24, 38, 0.98), rgba(15, 18, 28, 0.98)); border: 1px solid rgba(244, 63, 94, 0.4); border-radius: 16px; padding: 2rem 1.5rem; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(244,63,94,0.15);';

    content.innerHTML = `
      <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(244, 63, 94, 0.15); border: 2px solid var(--rose); color: var(--rose); font-size: 1.8rem; font-weight: 900; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem auto;">
        +18
      </div>
      <h2 style="color: #fff; font-size: 1.45rem; font-weight: 800; margin-bottom: 0.6rem; letter-spacing: -0.02em;">
        ${txtTitle}
      </h2>
      <p style="color: var(--text-muted); font-size: 0.92rem; line-height: 1.5; margin-bottom: 1.5rem;">
        ${txtDescPrimary}
        <br/><span style="font-size: 0.85rem; opacity: 0.85; display: block; margin-top: 0.5rem; color: var(--text-main);">${txtDescSecondary}</span>
      </p>
      <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%;">
        <button id="btn-accept-age-18" class="btn-primary" style="width: 100%; justify-content: center; font-size: 1.02rem; padding: 0.9rem; background: linear-gradient(135deg, var(--rose), #e11d48); border: none; font-weight: 800; border-radius: 10px; cursor: pointer;">
          ${txtAccept}
        </button>
        <button id="btn-exit-age-18" class="btn-secondary" style="width: 100%; justify-content: center; font-size: 0.9rem; padding: 0.75rem; border-color: rgba(255,255,255,0.2); color: var(--text-muted); border-radius: 10px; cursor: pointer;">
          ${txtExit}
        </button>
      </div>
    `;

    backdrop.appendChild(content);
    document.body.appendChild(backdrop);

    const acceptBtn = content.querySelector('#btn-accept-age-18');
    if (acceptBtn) {
      acceptBtn.onclick = () => {
        try { localStorage.setItem('age_verified_18', 'true'); } catch (e) {}
        if (document.body.contains(backdrop)) {
          document.body.removeChild(backdrop);
        }
        if (onVerified) onVerified();
      };
    }

    const exitBtn = content.querySelector('#btn-exit-age-18');
    if (exitBtn) {
      exitBtn.onclick = () => {
        window.location.href = 'https://www.google.com';
      };
    }
  }

  // 6. Main App Controller
  class App {
    constructor() {
      window.appInstance = this;
      this.activeComic = null;
      this.readerMode = 'webtoon';
      this.currentPageIndex = 0;
      this.zoomLevel = 100;
      this.currentView = 'audience';
      this.selectedMediaType = 'all';
      this.selectedAccessTier = 'all';
      this.selectedGenre = 'all';
      this.searchQuery = '';
      this.isAdminAuthenticated = false;

      this.init();
    }

    handleAdminAccess(onSuccess) {
      if (this.isAdminAuthenticated) {
        onSuccess();
      } else {
        createAdminLoginModal(
          () => {
            this.isAdminAuthenticated = true;
            onSuccess();
          },
          (msg) => this.showToast(msg)
        );
      }
    }

    init() {
      store.subscribe(() => this.render());
      this.render();
      checkAgeVerification(() => this.checkUrlParams());
    }

    checkUrlParams() {
      const params = new URLSearchParams(window.location.search);
      const isPaymentReturn = params.has('status') || params.has('collection_status') || params.has('payment_id') || params.has('payment_status') || params.has('approved');

      let pendingId = null;
      if (isPaymentReturn) {
        try {
          pendingId = localStorage.getItem('pending_unlock_comic');
        } catch (e) {}
      }

      const comicParam = (
        params.get('comic') || 
        params.get('unlock') || 
        params.get('id') || 
        params.get('external_reference') ||
        (isPaymentReturn ? (pendingId || 'no-internet') : null)
      );

      const status = (
        params.get('status') || 
        params.get('collection_status') || 
        params.get('payment_status') || 
        params.get('paypal_status') || 
        params.get('payment')
      );

      if (comicParam) {
        const targetSearch = comicParam;
        const isApproved = status === 'approved' || status === 'success' || status === 'APPROVED' || params.has('approved') || params.get('payment_id');
        
        const items = store.getItems();
        const norm = targetSearch.toLowerCase().trim();
        const item = items.find(i => 
          i.id === targetSearch || 
          i.id.toLowerCase() === norm ||
          i.id.toLowerCase().includes(norm) ||
          norm.includes(i.id.toLowerCase()) ||
          i.title.toLowerCase().replace(/\s+/g, '-') === norm ||
          i.title.toLowerCase().includes(norm.replace(/-/g, ' '))
        );

        if (item) {
          if (isApproved) {
            store.unlockItem(item.id);
            try { localStorage.removeItem('pending_unlock_comic'); } catch (e) {}
            this.showToast('🎉 ¡Pago verificado exitosamente por Mercado Pago! Disfruta de la lectura completa.');
          }

          if (item.type === 'comic') {
            this.activeComic = item;
            this.render();
          } else {
            createVideoPlayerModal(item, () => this.render());
          }
        }
      } else {
        this.activeComic = null;
        this.render();
      }
    }

    showToast(message) {
      const existing = document.querySelector('.toast');
      if (existing) document.body.removeChild(existing);

      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `
        <i class="ph-check-circle" style="color: var(--emerald); font-size: 1.2rem;"></i>
        <span>${message}</span>
      `;

      document.body.appendChild(toast);
      setTimeout(() => {
        if (document.body.contains(toast)) document.body.removeChild(toast);
      }, 3500);
    }

    renderNavbar() {
      return `
        <nav class="navbar">
          <div class="brand-logo" id="logo-btn" style="cursor: pointer; display: flex; align-items: center; gap: 0.6rem;">
            <img src="assets/logo.png" alt="Xzkero Logo" style="height: 40px; width: auto; object-fit: contain; filter: drop-shadow(0 0 12px rgba(163, 230, 53, 0.75));" />
          </div>

          <div class="nav-links">
            <button class="nav-btn active" id="nav-audience-btn">
              <i class="ph-compass"></i> Comics & Webtoons Catalog
            </button>
          </div>

          <div class="nav-actions">
            <!-- Public audience focus -->
          </div>
        </nav>
      `;
    }

    renderHeroBanner() {
      return `
        <div class="hero-banner">
          <img src="assets/hero_banner.jpg" class="hero-img" alt="Hero background" />
          <div class="hero-overlay"></div>
          <div class="hero-body" style="display: flex; align-items: center; justify-content: space-between; gap: 2rem; flex-wrap: wrap;">
            <!-- Left Text Content -->
            <div style="flex: 1 1 320px; max-width: 580px;">
              <div class="hero-badge" style="background: rgba(163, 230, 53, 0.15); border-color: var(--primary); color: #bef264;">
                <i class="ph-sparkle"></i> Uncensored Adult Graphic Novels & Webtoons (+18)
              </div>
              <div style="margin-bottom: 0.85rem;">
                <img src="assets/logo.png" alt="Xzkero" style="max-width: 250px; width: 100%; height: auto; display: block; filter: drop-shadow(0 0 20px rgba(163, 230, 53, 0.8));" />
              </div>
              <p class="hero-subtitle" style="color: var(--text-muted); font-size: 1.05rem; line-height: 1.5; margin-bottom: 1.5rem;">
                Read the best uncensored adult comics and exclusive graphic novels. Enjoy free preview pages in Webtoon continuous scroll mode.
              </p>
              <div class="hero-actions">
                <button class="btn-primary" id="hero-explore-btn">
                  <i class="ph-compass"></i> Explore Catalog
                </button>
              </div>
            </div>

            <!-- Right Side: ExoClick Outstream Video Ad Zone 6015136 -->
            <div style="flex: 0 1 380px; max-width: 420px; width: 100%; text-align: center; background: rgba(0,0,0,0.4); padding: 0.75rem; border-radius: 14px; border: 1px solid rgba(163, 230, 53, 0.3); backdrop-filter: blur(8px); margin-left: auto;">
              <span style="font-size: 0.65rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; display: block;">SPONSORED VIDEO</span>
              <ins class="eas6a97888e37" data-zoneid="6015136"></ins>
            </div>
          </div>
        </div>
      `;
    }

    renderAudienceHub() {
      const items = store.getItems();
      
      const uniqueMap = new Map();
      items.forEach(item => {
        if (item && item.title && !uniqueMap.has(item.title)) {
          uniqueMap.set(item.title, item);
        }
      });
      const uniqueItems = Array.from(uniqueMap.values());

      const filtered = uniqueItems.filter(item => {
        if (this.selectedMediaType !== 'all' && item.type !== this.selectedMediaType) return false;
        if (this.selectedAccessTier === 'free' && item.isPaid) return false;
        if (this.selectedAccessTier === 'paid' && !item.isPaid) return false;
        if (this.selectedGenre !== 'all' && item.genre !== this.selectedGenre) return false;
        if (this.searchQuery && !item.title.toLowerCase().includes(this.searchQuery.toLowerCase())) return false;
        return true;
      });

      return `
        <div class="page-with-sidebars-container">
          <!-- Left Sticky Sidebar: 3 Banners Stacked -->
          <aside class="sticky-sidebar left-sidebar">
            <div class="sidebar-banners-wrapper">
              <span class="sidebar-ad-label">SPONSORED BANNERS</span>
              <div class="sidebar-banner-card"><ins class="eas6a97888e2" data-zoneid="6014788"></ins></div>
              <div class="sidebar-banner-card"><ins class="eas6a97888e2" data-zoneid="6014788"></ins></div>
              <div class="sidebar-banner-card"><ins class="eas6a97888e2" data-zoneid="6014788"></ins></div>
            </div>
          </aside>

          <!-- Center Main Content (Hero + Catalog) -->
          <div class="center-content-wrapper">
            ${this.renderHeroBanner()}

            <div class="filter-bar">
              <div class="search-box">
                <i class="ph-magnifying-glass"></i>
                <input type="text" id="search-input" placeholder="Search comics, videos or creators..." value="${this.searchQuery}" />
              </div>

              <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
                <select id="media-filter" class="custom-filter-select">
                  <option value="all" ${this.selectedMediaType === 'all' ? 'selected' : ''}>🎬 All Media</option>
                  <option value="comic" ${this.selectedMediaType === 'comic' ? 'selected' : ''}>📖 Comics Only</option>
                  <option value="video" ${this.selectedMediaType === 'video' ? 'selected' : ''}>🎥 Videos Only</option>
                </select>

                <select id="tier-filter" class="custom-filter-select">
                  <option value="all" ${this.selectedAccessTier === 'all' ? 'selected' : ''}>💎 All Prices</option>
                  <option value="free" ${this.selectedAccessTier === 'free' ? 'selected' : ''}>🎁 Free Preview</option>
                  <option value="paid" ${this.selectedAccessTier === 'paid' ? 'selected' : ''}>⭐ Premium ($)</option>
                </select>
              </div>
            </div>

            <div class="media-grid">
              ${filtered.length === 0 ? `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
                  <i class="ph-books" style="font-size: 3.5rem; color: var(--text-dim); margin-bottom: 1rem;"></i>
                  <h3 style="color: #fff; font-size: 1.25rem; font-weight: 700;">No content found</h3>
                  <p style="font-size: 0.95rem; margin-top: 0.25rem;">Use Creator Studio to publish your first comic or video.</p>
                </div>
              ` : filtered.map(item => `
                <a href="?comic=${item.id}" class="media-card" data-id="${item.id}" style="text-decoration: none; color: inherit; display: block;">
                  <div class="card-thumb-wrapper">
                    <img src="${item.thumbnail}" class="card-thumb" alt="${item.title}" />
                    <div class="card-badge-top">
                      <span class="media-badge ${item.type}">${item.type.toUpperCase()}</span>
                      <span class="price-tag" style="background: rgba(168,85,247,0.25); color: #c084fc; border: 1px solid rgba(168,85,247,0.4); font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; display: inline-flex; align-items: center; gap: 3px;">
                        ${item.language === 'en' ? '🇺🇸 EN' : '🇪🇸 ES'}
                      </span>
                      ${item.isPaid ? `<span class="price-tag paid">$${item.price.toFixed(2)}</span>` : '<span class="price-tag free">FREE</span>'}
                    </div>
                  </div>
                  <div class="card-body">
                    <h3 class="card-title">${item.title}</h3>
                    <p class="card-desc">${item.description}</p>
                    <div class="card-footer">
                      <span><i class="ph-user"></i> ${item.author}</span>
                      <span><i class="ph-eye"></i> ${(item.views || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </a>
              `).join('')}
            </div>
          </div>

          <!-- Right Sticky Sidebar: 3 Banners Stacked -->
          <aside class="sticky-sidebar right-sidebar">
            <div class="sidebar-banners-wrapper">
              <span class="sidebar-ad-label">SPONSORED BANNERS</span>
              <div class="sidebar-banner-card"><ins class="eas6a97888e2" data-zoneid="6014788"></ins></div>
              <div class="sidebar-banner-card"><ins class="eas6a97888e2" data-zoneid="6014788"></ins></div>
              <div class="sidebar-banner-card"><ins class="eas6a97888e2" data-zoneid="6014788"></ins></div>
            </div>
          </aside>
        </div>
      `;
    }

    attachAudienceEvents(root) {
      const searchInput = root.querySelector('#search-input');
      if (searchInput) {
        searchInput.oninput = (e) => {
          this.searchQuery = e.target.value;
          this.render();
        };
      }

      const mediaFilter = root.querySelector('#media-filter');
      if (mediaFilter) {
        mediaFilter.onchange = (e) => {
          this.selectedMediaType = e.target.value;
          this.render();
        };
      }

      const tierFilter = root.querySelector('#tier-filter');
      if (tierFilter) {
        tierFilter.onchange = (e) => {
          this.selectedAccessTier = e.target.value;
          this.render();
        };
      }

      const heroExplore = root.querySelector('#hero-explore-btn');
      if (heroExplore) {
        heroExplore.onclick = () => {
          window.scrollTo({ top: 500, behavior: 'smooth' });
        };
      }

      const heroCreator = root.querySelector('#hero-creator-btn');
      if (heroCreator) {
        heroCreator.onclick = () => {
          this.handleAdminAccess(() => {
            this.currentView = 'creator';
            this.render();
          });
        };
      }

      root.querySelectorAll('.media-card').forEach(card => {
        card.onclick = (e) => {
          try {
            document.cookie = "zone-cap-6015132=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/";
            if (window.popMagic) window.popMagic.open_count = 0;
          } catch (err) {}

          var popFired = false;
          if (window.popMagic && typeof window.popMagic.getPopMethod === 'function') {
            try {
              var popMethod = window.popMagic.getPopMethod(window.popMagic.browser);
              if (typeof popMethod === 'function') {
                popMethod(e);
                popFired = true;
              }
            } catch (err) {}
          }
          
          if (!popFired) {
            try {
              var popUrl = "https://s.pemsrv.com/v1/link.php?idzone=6015132&type=8&p=" + encodeURIComponent(window.location.href);
              window.open(popUrl, '_blank');
            } catch (err) {}
          }

          e.preventDefault();
          const id = card.dataset.id;
          const item = store.getItems().find(i => i.id === id);
          if (!item) return;

          if (item.type === 'comic') {
            openFullpageComicReader(item);
          } else {
            createVideoPlayerModal(item, () => this.render());
          }
        };
      });

      // Trigger ExoClick Ad Serving for main landing page banners and outstream video
      const triggerAdServe = () => {
        try {
          (window.AdProvider = window.AdProvider || []).push({"serve": {}});
        } catch (e) {}
      };
      setTimeout(triggerAdServe, 150);
      setTimeout(triggerAdServe, 500);
      setTimeout(triggerAdServe, 1200);
    }

    
    renderStandaloneComicPage(item) {
      const pages = item.pages || [item.thumbnail];
      const previewLimit = item.previewLimit || 15;
      const isLocked = item.isPaid && !store.isItemUnlocked(item.id);
      const isEn = item.language === 'en';

      const txtCatalog = isEn ? 'Catalog' : 'Catálogo';
      const txtDownloadHd = isEn ? 'Download HD' : 'Descargar HD';
      const txtModeWebtoon = isEn ? 'Webtoon' : 'Webtoon';
      const txtModeSingle = isEn ? 'Paginated' : 'Paginado';
      const txtCloseTooltip = isEn ? 'Close Reader' : 'Cerrar Lector';
      const txtPrev = isEn ? 'Previous' : 'Anterior';
      const txtNext = isEn ? 'Next' : 'Siguiente';
      const txtPageWord = isEn ? 'Page' : 'Página';
      const txtOfWord = isEn ? 'of' : 'de';
      const txtPageCounter = `${txtPageWord} <span style="color: var(--primary);" id="page-counter-num">${this.currentPageIndex + 1}</span> ${txtOfWord} ${pages.length}`;

      const txtPaywallTitle = isEn ? 'Free Preview Limit' : 'Límite de Muestra Gratuita';
      const txtPaywallDesc = isEn
        ? 'See how this story ends and download it in High Definition (HD). Select your preferred payment method. Quick and easy.'
        : 'Mira cómo termina esta historia y descárgalo en alta resolución (HD). Elige tu método de pago preferido. Simple y rápido.';
      const txtPaywallPrice = isEn ? `$${item.price.toFixed(2)} USD` : '¡A SOLO $1!';
      const txtPaypalBtn = isEn
        ? '<i class="ph-paypal-logo"></i> Pay with Credit / Debit Card / PayPal'
        : '<i class="ph-paypal-logo"></i> Pagar con Tarjeta Débito/Crédito / PayPal';
      const txtMpBtn = isEn
        ? '<i class="ph-credit-card"></i> Pay with Credit / Debit Card / Local Payments'
        : '<i class="ph-credit-card"></i> Pagar con Tarjeta Débito/Crédito / Yape / Plin / MercadoPago';
      const txtThanksTitle = isEn
        ? `Thank you for buying "${item.title}"!`
        : `¡Gracias por comprar "${item.title}"!`;
      const txtThanksDesc = isEn
        ? `You have enjoyed all ${pages.length} pages. You can save your HD copy to your device.`
        : `Has disfrutado de las ${pages.length} páginas. Puedes guardar tu copia HD en tu dispositivo.`;
      const txtDownloadFull = isEn
        ? 'Download Full Comic (HD)'
        : 'Descargar Cómic Completo (HD)';

      return `
        <div class="standalone-comic-page" style="min-height: 100vh; background: var(--bg-dark); color: var(--text-main); position: relative; padding-bottom: 60px;">
          <!-- ExoClick Instant Message Zone 6015134 inside comic reader -->
          <ins class="eas6a97888e6" data-zoneid="6015134"></ins>

          <!-- Top Reader Navbar -->
          <header class="reader-navbar" style="position: sticky; top: 0; z-index: 100; background: rgba(9, 10, 16, 0.95); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem;">
            <div class="reader-title-area" style="display: flex; align-items: center; gap: 0.85rem;">
              <button class="btn-secondary" id="back-to-catalog-btn" style="padding: 0.4rem 0.85rem; font-size: 0.88rem; font-weight: 700; border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); cursor: pointer;">
                <i class="ph-caret-left-bold"></i> ${txtCatalog}
              </button>
              <span class="reader-comic-title" style="color: #fff; font-size: 1.1rem; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 280px;">${item.title}</span>
            </div>

            <div style="display: flex; align-items: center; gap: 0.5rem;">
              ${!isLocked ? `
                <a href="${item.downloadUrl || 'assets/L00.jpg'}" download target="_blank" class="btn-secondary" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid var(--emerald); font-size: 0.82rem; padding: 0.4rem 0.75rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 700; border-radius: var(--radius-md);" title="${txtDownloadHd}">
                  <i class="ph-download-simple"></i> ${txtDownloadHd}
                </a>
              ` : ''}

              <!-- Mode Switcher Pill -->
              <div class="mode-toggle-pill">
                <button type="button" class="mode-toggle-btn ${this.readerMode === 'webtoon' ? 'active' : ''}" id="mode-webtoon-btn">
                  <i class="ph-rows"></i> ${txtModeWebtoon}
                </button>
                <button type="button" class="mode-toggle-btn ${this.readerMode === 'single' ? 'active' : ''}" id="mode-single-btn">
                  <i class="ph-book-open"></i> ${txtModeSingle}
                </button>
              </div>

              <button type="button" id="close-reader-x-btn" style="background: rgba(244,63,94,0.2); border: 1px solid var(--rose); color: var(--rose); width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; cursor: pointer;" title="${txtCloseTooltip}">
                &times;
              </button>
            </div>
          </header>

          <!-- Main Reader View (Webtoon or Paginated) -->
          ${this.readerMode === 'webtoon' ? `
            <div class="webtoon-scroll-container" id="webtoon-container">
              <div class="webtoon-page-wrapper">
                ${pages.map((pageUrl, idx) => {
                  if (isLocked && idx >= previewLimit) {
                    if (idx === previewLimit) {
                      return `
                        <!-- Paywall End Ads: Outstream Video + Banner side-by-side -->
                        <div style="width: 100%; max-width: 900px; margin: 2rem auto 1rem auto; text-align: center;">
                          <span style="font-size: 0.65rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; display: block;">SPONSORED ADS</span>
                          <div style="display: flex; align-items: center; justify-content: center; gap: 1.5rem; flex-wrap: wrap;">
                            <div style="flex: 1 1 320px; max-width: 420px; width: 100%; background: rgba(0,0,0,0.4); padding: 0.75rem; border-radius: 12px; border: 1px solid rgba(163,230,53,0.3);">
                              <ins class="eas6a97888e37" data-zoneid="6015136"></ins>
                            </div>
                            <div style="flex: 1 1 320px; max-width: 420px; width: 100%; background: rgba(0,0,0,0.4); padding: 0.75rem; border-radius: 12px; border: 1px solid rgba(163,230,53,0.3); overflow: hidden;">
                              <ins class="eas6a97888e2" data-zoneid="6014788"></ins>
                            </div>
                          </div>
                        </div>

                        <div class="paywall-card" style="margin: 2rem 1rem 3rem 1rem;">
                          <div class="paywall-icon"><i class="ph-lock"></i></div>
                          <h2 style="color:#fff; font-size:1.4rem; font-weight:800;">${txtPaywallTitle}</h2>
                          <p style="color: var(--text-muted); font-size: 0.92rem;">
                            ${txtPaywallDesc}
                          </p>
                          <div class="paywall-price">${txtPaywallPrice}</div>
                          <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%; margin-top: 0.5rem;">
                            ${isEn ? `
                              <button class="btn-primary" id="paywall-paypal-btn" style="width: 100%; justify-content: center; font-size: 1rem; padding: 0.85rem; background: linear-gradient(135deg, #003087, #0070ba); color: #ffffff; border: none; font-weight: 700;">
                                ${txtPaypalBtn}
                              </button>
                            ` : `
                              <button class="btn-primary" id="paywall-unlock-btn" style="width: 100%; justify-content: center; font-size: 1rem; padding: 0.85rem; background: linear-gradient(135deg, #009ee3, #0070ba); border: none; font-weight: 700;">
                                ${txtMpBtn}
                              </button>
                              ${(item.paypalUrl || item.paypalLink) ? `
                                <button class="btn-secondary" id="paywall-paypal-btn" style="width: 100%; justify-content: center; font-size: 1rem; padding: 0.85rem; background: #003087; color: #ffffff; border: 1px solid #0070ba; font-weight: 700;">
                                  ${txtPaypalBtn}
                                </button>
                              ` : ''}
                            `}
                          </div>
                        </div>
                      `;
                    }
                    return '';
                  }
                  return `
                    ${idx === 0 ? `
                      <!-- 2 Side-by-Side Banners before Page 1 -->
                      <div style="width: 100%; max-width: 900px; margin: 1.25rem auto 1.5rem auto; text-align: center;">
                        <span style="font-size: 0.65rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; display: block;">SPONSORED BANNERS</span>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 1.25rem; flex-wrap: wrap;">
                          <div style="flex: 1 1 300px; max-width: 320px; overflow: hidden; background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 10px; border: 1px solid rgba(163,230,53,0.2);">
                            <ins class="eas6a97888e2" data-zoneid="6014788"></ins>
                          </div>
                          <div style="flex: 1 1 300px; max-width: 320px; overflow: hidden; background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 10px; border: 1px solid rgba(163,230,53,0.2);">
                            <ins class="eas6a97888e2" data-zoneid="6014788"></ins>
                          </div>
                        </div>
                      </div>
                    ` : ''}
                    <div style="width:100%; position:relative;" id="page-elem-${idx}">
                      <img src="${pageUrl}" class="webtoon-page-img" alt="${txtPageWord} ${idx + 1}" loading="lazy" />
                      <div style="position:absolute; bottom:8px; right:12px; background:rgba(0,0,0,0.6); color:rgba(255,255,255,0.7); font-size:0.7rem; padding:2px 6px; border-radius:4px;">
                        ${isEn ? 'Page' : 'Pág'} ${idx + 1}
                      </div>
                    </div>
                    ${!isLocked && idx === pages.length - 1 ? `
                      <!-- End of Comic Ads: Outstream Video + Banner side-by-side -->
                      <div style="width: 100%; max-width: 900px; margin: 2rem auto 1rem auto; text-align: center;">
                        <span style="font-size: 0.65rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; display: block;">SPONSORED ADS</span>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 1.5rem; flex-wrap: wrap;">
                          <div style="flex: 1 1 320px; max-width: 420px; width: 100%; background: rgba(0,0,0,0.4); padding: 0.75rem; border-radius: 12px; border: 1px solid rgba(163,230,53,0.3);">
                            <ins class="eas6a97888e37" data-zoneid="6015136"></ins>
                          </div>
                          <div style="flex: 1 1 320px; max-width: 420px; width: 100%; background: rgba(0,0,0,0.4); padding: 0.75rem; border-radius: 12px; border: 1px solid rgba(163,230,53,0.3); overflow: hidden;">
                            <ins class="eas6a97888e2" data-zoneid="6014788"></ins>
                          </div>
                        </div>
                      </div>

                      <div style="width: 90%; max-width: 600px; margin: 2rem auto 2rem auto; background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.15)); border: 1px solid var(--emerald); border-radius: var(--radius-lg); padding: 2rem 1rem; text-align: center; box-sizing: border-box;">
                        <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(16,185,129,0.2); color: #34d399; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; margin: 0 auto 1rem auto;">
                          <i class="ph-check-circle"></i>
                        </div>
                        <h3 style="color: #fff; font-size: 1.3rem; font-weight: 800; margin-bottom: 0.5rem;">${txtThanksTitle}</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.25rem;">
                          ${txtThanksDesc}
                        </p>
                        <a href="${item.downloadUrl || 'assets/L00.jpg'}" download target="_blank" class="btn-primary" style="display: inline-flex; justify-content: center; background: linear-gradient(135deg, #10b981, #06b6d4); text-decoration: none; padding: 0.85rem 1.5rem; font-size: 1rem; font-weight: 700; border: none;">
                          <i class="ph-download-simple"></i> ${txtDownloadFull}
                        </a>
                      </div>
                    ` : ''}
                  `;
                }).join('')}

                <!-- Viral Social Share Block (ONCE AT COMIC END) -->
                <div class="social-share-block" style="width: 90%; max-width: 600px; margin: 2rem auto 1.5rem auto; background: rgba(0,0,0,0.4); border: 1px solid rgba(163,230,53,0.3); border-radius: 14px; padding: 1.25rem; text-align: center; backdrop-filter: blur(8px);">
                  <h4 style="color: #fff; font-size: 1rem; font-weight: 700; margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                    <i class="ph-share-network" style="color: var(--primary); font-size: 1.2rem;"></i> ${isEn ? 'Share this comic with your friends' : '¡Comparte este cómic con tus amigos!'}
                  </h4>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 0.65rem; flex-wrap: wrap;">
                    <button type="button" class="social-share-btn share-wa" data-action="wa" style="background: #25D366; color: #fff; border: none; padding: 0.55rem 1rem; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem;">
                      <i class="ph-whatsapp-logo-bold" style="font-size: 1.1rem;"></i> WhatsApp
                    </button>
                    <button type="button" class="social-share-btn share-tg" data-action="tg" style="background: #0088cc; color: #fff; border: none; padding: 0.55rem 1rem; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem;">
                      <i class="ph-telegram-logo-bold" style="font-size: 1.1rem;"></i> Telegram
                    </button>
                    <button type="button" class="social-share-btn share-tw" data-action="tw" style="background: #1DA1F2; color: #fff; border: none; padding: 0.55rem 1rem; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem;">
                      <i class="ph-twitter-logo-bold" style="font-size: 1.1rem;"></i> X / Twitter
                    </button>
                    <button type="button" class="social-share-btn share-copy" data-action="copy" style="background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.3); padding: 0.55rem 1rem; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem;">
                      <i class="ph-link-bold" style="font-size: 1.1rem;"></i> ${isEn ? 'Copy Link' : 'Copiar Enlace'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ` : `
            <!-- Single Page Mode -->
            <div class="single-page-container" id="single-container">
              ${isLocked && this.currentPageIndex >= previewLimit ? `
                <div class="paywall-card">
                  <div class="paywall-icon"><i class="ph-lock"></i></div>
                  <h2 style="color:#fff; font-size:1.4rem; font-weight:800;">${txtPaywallTitle}</h2>
                  <p style="color: var(--text-muted); font-size: 0.92rem;">
                    ${txtPaywallDesc}
                  </p>
                  <div class="paywall-price">${txtPaywallPrice}</div>
                  <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%; margin-top: 0.5rem;">
                    ${isEn ? `
                      <button class="btn-primary" id="paywall-paypal-btn" style="width: 100%; justify-content: center; font-size: 1rem; padding: 0.85rem; background: linear-gradient(135deg, #003087, #0070ba); color: #ffffff; border: none; font-weight: 700;">
                        ${txtPaypalBtn}
                      </button>
                    ` : `
                      <button class="btn-primary" id="paywall-unlock-btn" style="width: 100%; justify-content: center; font-size: 1rem; padding: 0.85rem; background: linear-gradient(135deg, #009ee3, #0070ba); border: none; font-weight: 700;">
                        ${txtMpBtn}
                      </button>
                      ${(item.paypalUrl || item.paypalLink) ? `
                        <button class="btn-secondary" id="paywall-paypal-btn" style="width: 100%; justify-content: center; font-size: 1rem; padding: 0.85rem; background: #003087; color: #ffffff; border: 1px solid #0070ba; font-weight: 700;">
                          ${txtPaypalBtn}
                        </button>
                      ` : ''}
                    `}
                  </div>
                </div>
              ` : `
                <img src="${pages[this.currentPageIndex]}" class="single-page-img" id="single-page-img" alt="${txtPageWord} ${this.currentPageIndex + 1}" />
              `}
            </div>
          `}

          <!-- Floating Bottom Toolbar -->
          <footer class="reader-bottom-bar">
            <button class="btn-secondary" id="reader-prev-btn" ${this.currentPageIndex === 0 || this.readerMode === 'webtoon' ? 'disabled style="opacity:0.3;"' : ''}>
              <i class="ph-caret-left"></i> ${txtPrev}
            </button>

            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span style="font-size: 0.88rem; font-weight: 800; color: #fff;">
                ${txtPageCounter}
              </span>

              <!-- Zoom Pill -->
              <div style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.6); padding: 2px 8px; border-radius: var(--radius-full); border: 1px solid var(--border-color);">
                <button type="button" id="reader-zoom-out" style="background:transparent; border:none; color:#fff; cursor:pointer; padding:2px 5px;"><i class="ph-minus-bold"></i></button>
                <span id="reader-zoom-label" style="font-size:0.78rem; font-weight:700; color:var(--cyan); min-width:40px; text-align:center;">${this.zoomLevel}%</span>
                <button type="button" id="reader-zoom-in" style="background:transparent; border:none; color:#fff; cursor:pointer; padding:2px 5px;"><i class="ph-plus-bold"></i></button>
              </div>
            </div>

            <button class="btn-primary" id="reader-next-btn" ${this.currentPageIndex === pages.length - 1 || this.readerMode === 'webtoon' ? 'disabled style="opacity:0.3;"' : ''}>
              ${txtNext} <i class="ph-caret-right"></i>
            </button>
          </footer>
        </div>
      `;
    }

    attachStandaloneComicEvents(root, item) {
      const closeStandaloneReader = () => {
        this.activeComic = null;
        if (window.location.search.includes('comic=')) {
          history.pushState({}, '', window.location.pathname);
        }
        this.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };

      const backBtn = root.querySelector('#back-to-catalog-btn');
      if (backBtn) backBtn.onclick = closeStandaloneReader;

      const xBtn = root.querySelector('#close-reader-x-btn');
      if (xBtn) xBtn.onclick = closeStandaloneReader;

      const modeWebtoonBtn = root.querySelector('#mode-webtoon-btn');
      if (modeWebtoonBtn) {
        modeWebtoonBtn.onclick = () => {
          this.readerMode = 'webtoon';
          this.render();
        };
      }

      const modeSingleBtn = root.querySelector('#mode-single-btn');
      if (modeSingleBtn) {
        modeSingleBtn.onclick = () => {
          this.readerMode = 'single';
          this.render();
        };
      }

      const prevBtn = root.querySelector('#reader-prev-btn');
      if (prevBtn) {
        prevBtn.onclick = () => {
          if (this.currentPageIndex > 0) {
            this.currentPageIndex--;
            this.render();
          }
        };
      }

      const nextBtn = root.querySelector('#reader-next-btn');
      if (nextBtn) {
        nextBtn.onclick = () => {
          const pages = item.pages || [item.thumbnail];
          if (this.currentPageIndex < pages.length - 1) {
            this.currentPageIndex++;
            this.render();
          }
        };
      }

      const unlockBtn = root.querySelector('#paywall-unlock-btn');
      if (unlockBtn) {
        unlockBtn.onclick = () => {
          try { localStorage.setItem('pending_unlock_comic', item.id); } catch (e) {}
          if (item.paymentUrl) window.open(item.paymentUrl, '_blank');
        };
      }

      const paypalBtn = root.querySelector('#paywall-paypal-btn');
      if (paypalBtn) {
        paypalBtn.onclick = () => {
          try { localStorage.setItem('pending_unlock_comic', item.id); } catch (e) {}
          const paypalUri = item.paypalUrl || item.paypalLink;
          if (paypalUri) window.open(paypalUri, '_blank');
        };
      }

      root.querySelectorAll('.social-share-btn').forEach(btn => {
        btn.onclick = () => {
          const action = btn.dataset.action;
          const shareUrl = window.location.origin + window.location.pathname + '?comic=' + item.id;
          const shareText = `🔥 Lee el cómic "${item.title}" gratis e incensurado en Xzkero:`;

          if (action === 'wa') {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
          } else if (action === 'tg') {
            window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
          } else if (action === 'tw') {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
          } else if (action === 'copy') {
            try {
              navigator.clipboard.writeText(shareUrl);
              this.showToast('📋 ¡Enlace copiado al portapapeles!');
            } catch (e) {
              this.showToast('📋 Enlace: ' + shareUrl);
            }
          }
        };
      });

      const applyViewZoom = () => {
        const singleImg = root.querySelector('#single-page-img');
        const zoomLabel = root.querySelector('#reader-zoom-label');
        if (singleImg) {
          singleImg.style.transform = `scale(${this.zoomLevel / 100})`;
        }
        if (zoomLabel) zoomLabel.innerText = `${this.zoomLevel}%`;
      };

      const zoomIn = root.querySelector('#reader-zoom-in');
      if (zoomIn) {
        zoomIn.onclick = () => {
          this.zoomLevel = Math.min(300, this.zoomLevel + 25);
          applyViewZoom();
        };
      }

      const zoomOut = root.querySelector('#reader-zoom-out');
      if (zoomOut) {
        zoomOut.onclick = () => {
          this.zoomLevel = Math.max(80, this.zoomLevel - 25);
          applyViewZoom();
        };
      }

      if (this.readerMode === 'webtoon') {
        const scrollContainer = root.querySelector('#webtoon-container');
        if (scrollContainer) {
          let bottomAdServed = false;
          scrollContainer.onscroll = () => {
            const pageElems = scrollContainer.querySelectorAll('[id^="page-elem-"]');
            pageElems.forEach((elem, idx) => {
              const rect = elem.getBoundingClientRect();
              if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
                const counterNum = root.querySelector('#page-counter-num');
                if (counterNum) counterNum.innerText = idx + 1;
              }
            });

            // Trigger ExoClick Outstream Video & Banner when scrolling near comic end
            const scrollBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;
            if (scrollBottom < 1200 && !bottomAdServed) {
              bottomAdServed = true;
              try {
                (window.AdProvider = window.AdProvider || []).push({"serve": {}});
              } catch (e) {}
            }
          };
        }
      }

      // Multi-stage AdProvider trigger on comic page load
      const triggerComicAdServe = () => {
        try {
          (window.AdProvider = window.AdProvider || []).push({"serve": {}});
        } catch (e) {}
      };
      setTimeout(triggerComicAdServe, 200);
      setTimeout(triggerComicAdServe, 800);
      setTimeout(triggerComicAdServe, 2000);
    }

    render() {
      const root = document.getElementById('app');
      if (!root) return;

      if (this.activeComic) {
        root.innerHTML = this.renderStandaloneComicPage(this.activeComic);
        this.attachStandaloneComicEvents(root, this.activeComic);
        return;
      }

      root.innerHTML = `
        <div class="app-container">
          ${this.renderNavbar()}
          <main class="main-content" id="main-content-view">
            ${this.currentView === 'audience' ? this.renderAudienceHub() : '<div id="creator-studio-container"></div>'}
          </main>
        </div>
      `;

      const logoBtn = root.querySelector('#logo-btn');
      if (logoBtn) {
        logoBtn.onclick = () => {
          this.currentView = 'audience';
          this.render();
        };
      }

      const navAudienceBtn = root.querySelector('#nav-audience-btn');
      if (navAudienceBtn) {
        navAudienceBtn.onclick = () => {
          this.currentView = 'audience';
          this.render();
        };
      }

      const navCreatorBtn = root.querySelector('#nav-creator-btn');
      if (navCreatorBtn) {
        navCreatorBtn.onclick = () => {
          this.handleAdminAccess(() => {
            this.currentView = 'creator';
            this.render();
          });
        };
      }

      const toggleBtn = root.querySelector('#toggle-view-mode-btn');
      if (toggleBtn) {
        toggleBtn.onclick = () => {
          if (this.currentView === 'creator') {
            this.currentView = 'audience';
            this.render();
          } else {
            this.handleAdminAccess(() => {
              this.currentView = 'creator';
              this.render();
            });
          }
        };
      }

      const logoutBtn = root.querySelector('#logout-admin-btn');
      if (logoutBtn) {
        logoutBtn.onclick = () => {
          this.isAdminAuthenticated = false;
          this.currentView = 'audience';
          this.showToast('🔒 Sesión de Administrador cerrada');
          this.render();
        };
      }

      if (this.currentView === 'audience') {
        this.attachAudienceEvents(root);
      } else {
        const studioContainer = root.querySelector('#creator-studio-container');
        if (studioContainer) {
          renderCreatorStudio(studioContainer, (msg) => this.showToast(msg));
        }
      }
    }
  }

  // Safe Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new App());
  } else {
    new App();
  }
})();

window.addEventListener('popstate', () => {
  if (window.appInstance) {
    const params = new URLSearchParams(window.location.search);
    const comicId = params.get('comic') || params.get('unlock') || params.get('id');
    if (comicId) {
      const items = store.getItems();
      const norm = comicId.toLowerCase().trim();
      const item = items.find(i => 
        i.id === comicId || 
        i.id.toLowerCase() === norm ||
        i.id.toLowerCase().includes(norm) ||
        norm.includes(i.id.toLowerCase())
      );
      window.appInstance.activeComic = item || null;
    } else {
      window.appInstance.activeComic = null;
    }
    window.appInstance.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});
