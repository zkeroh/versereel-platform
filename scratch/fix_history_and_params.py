with open('js/bundle.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update checkUrlParams in App class
old_check_params = """    checkUrlParams() {
      const params = new URLSearchParams(window.location.search);
      let pendingId = null;
      try {
        pendingId = localStorage.getItem('pending_unlock_comic');
      } catch (e) {}

      const isPaymentReturn = params.has('status') || params.has('collection_status') || params.has('payment_id') || params.has('payment_status') || params.has('approved');

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

      if (comicParam || pendingId || isPaymentReturn) {
        const targetSearch = comicParam || pendingId || 'no-internet';
        const isApproved = status === 'approved' || status === 'success' || status === 'APPROVED' || params.has('approved') || params.get('payment_id');
        
        const openDirectComic = () => {
          const items = store.getItems();
          const norm = targetSearch.toLowerCase().trim();
          const item = items.find(i => 
            i.id === targetSearch || 
            i.id.toLowerCase() === norm ||
            i.id.toLowerCase().includes(norm) ||
            norm.includes(i.id.toLowerCase()) ||
            i.title.toLowerCase().replace(/\\s+/g, '-') === norm ||
            i.title.toLowerCase().includes(norm.replace(/-/g, ' '))
          ) || items.find(i => i.id === 'no-internet') || items[0];

          if (item) {
            if (isApproved) {
              store.unlockItem(item.id);
              try { localStorage.removeItem('pending_unlock_comic'); } catch (e) {}
              this.showToast('🎉 ¡Pago verificado exitosamente por Mercado Pago! Disfruta de la lectura completa.');
            }

            if (!document.getElementById('fullpage-comic-reader-overlay')) {
              if (item.type === 'comic') {
                openFullpageComicReader(item);
              } else {
                createVideoPlayerModal(item, () => this.render());
              }
            }
          }
        };

        openDirectComic();
      }
    }"""

new_check_params = """    checkUrlParams() {
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
          i.title.toLowerCase().replace(/\\s+/g, '-') === norm ||
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
    }"""

if old_check_params in code:
    code = code.replace(old_check_params, new_check_params)
    print("Successfully replaced checkUrlParams!")
else:
    print("WARNING: Could not find exact old_check_params match!")

# 2. Update popstate listener at bottom of bundle.js
old_popstate = """window.addEventListener('popstate', () => {
  if (window.appInstance) {
    const params = new URLSearchParams(window.location.search);
    const comicId = params.get('comic');
    if (comicId) {
      const item = store.getItems().find(i => i.id === comicId);
      window.appInstance.activeComic = item || null;
    } else {
      window.appInstance.activeComic = null;
    }
    window.appInstance.render();
  }
});"""

new_popstate = """window.addEventListener('popstate', () => {
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
});"""

if old_popstate in code:
    code = code.replace(old_popstate, new_popstate)
    print("Successfully updated popstate listener!")

with open('js/bundle.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("BUNDLE.JS HISTORY & PARAMS UPDATED SUCCESSFULLY!")
