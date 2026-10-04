// Comic Reader Component with Paywall Enforcement
import { store } from '../store.js';

export function createComicReaderModal(item, onClose, onUnlockRequest) {
  let currentPageIndex = 0;
  const pages = item.pages || [item.thumbnail];
  const isUnlocked = store.isItemUnlocked(item.id);
  const previewLimit = item.previewLimit !== undefined ? item.previewLimit : (item.isPaid ? 2 : 999);

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const content = document.createElement('div');
  content.className = 'modal-content';

  function renderBody() {
    const isLockedPage = item.isPaid && !isUnlocked && currentPageIndex >= previewLimit;

    content.innerHTML = `
      <div class="modal-header">
        <div class="modal-title">
          <i class="ph-book-open" style="color: var(--primary);"></i>
          <span>${item.title}</span>
          ${item.isPaid ? `<span class="price-tag paid">$${item.price.toFixed(2)}</span>` : '<span class="price-tag free">FREE</span>'}
        </div>
        <button class="close-btn" id="reader-close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div class="reader-container">
          ${isLockedPage ? `
            <div class="paywall-card" style="text-align: center;">
              <div class="paywall-icon" style="background: rgba(255, 66, 77, 0.15); border-color: #ff424d; color: #ff424d; margin: 0 auto 1rem auto;">
                <i class="ph-patreon-logo-bold"></i>
              </div>
              <h2 style="color:#fff; font-size:1.5rem; font-weight:800; margin-bottom: 0.5rem;">Ver Cómic Completo</h2>
              <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 1.25rem;">
                Suscríbete a mi Patreon para ver este y otros cómics completos sin censura: <strong>patreon.com/zkero</strong>
              </p>
              
              <a href="https://patreon.com/zkero" target="_blank" rel="noopener noreferrer" class="btn-primary" style="width: 100%; justify-content: center; font-size: 1rem; padding: 0.95rem; background: linear-gradient(135deg, #ff424d, #e01b24); color: #ffffff; border: none; font-weight: 800; border-radius: 12px; text-decoration: none; display: flex; align-items: center; gap: 0.5rem; box-shadow: 0 6px 20px rgba(255, 66, 77, 0.4); box-sizing: border-box;">
                <i class="ph-patreon-logo-bold" style="font-size: 1.2rem;"></i> Suscríbete a mi Patreon (patreon.com/zkero)
              </a>
            </div>
          ` : `
            <img src="${pages[currentPageIndex]}" alt="Page ${currentPageIndex + 1}" class="comic-page-img" />
          `}
        </div>

        <div class="reader-controls">
          <button class="btn-secondary" id="prev-page-btn" ${currentPageIndex === 0 ? 'disabled' : ''}>
            <i class="ph-caret-left"></i> Previous Page
          </button>
          
          <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">
            Page <span style="color: var(--primary);">${currentPageIndex + 1}</span> of ${pages.length}
            ${item.isPaid && !isUnlocked ? `<span style="font-size:0.8rem; color:var(--amber); margin-left:0.5rem;">(Preview ${previewLimit} pages)</span>` : ''}
          </div>

          <button class="btn-primary" id="next-page-btn" ${currentPageIndex === pages.length - 1 ? 'disabled' : ''}>
            Next Page <i class="ph-caret-right"></i>
          </button>
        </div>
      </div>
    `;

    // Attach Listeners
    content.querySelector('#reader-close-btn').onclick = () => {
      document.body.removeChild(backdrop);
      if (onClose) onClose();
    };

    const prevBtn = content.querySelector('#prev-page-btn');
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (currentPageIndex > 0) {
          currentPageIndex--;
          renderBody();
        }
      };
    }

    const nextBtn = content.querySelector('#next-page-btn');
    if (nextBtn) {
      nextBtn.onclick = () => {
        if (currentPageIndex < pages.length - 1) {
          currentPageIndex++;
          renderBody();
        }
      };
    }

    const unlockBtn = content.querySelector('#paywall-unlock-btn');
    if (unlockBtn) {
      unlockBtn.onclick = () => {
        if (item.paymentUrl) {
          window.open(item.paymentUrl, '_blank');
          const confirmBox = content.querySelector('#payment-confirm-box');
          if (confirmBox) confirmBox.style.display = 'block';
        } else {
          const res = store.unlockItem(item.id);
          if (res.success) renderBody();
        }
      };
    }

    const confirmBtn = content.querySelector('#confirm-unlock-btn');
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        const res = store.unlockItem(item.id);
        if (res.success) renderBody();
      };
    }
  }

  backdrop.appendChild(content);
  document.body.appendChild(backdrop);
  renderBody();

  // Increment view counter
  store.incrementViews(item.id);
}
