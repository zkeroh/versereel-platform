with open('js/bundle.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace openFullpageComicReader with standalone trigger
old_reader = """  function openFullpageComicReader(item) {
    try {
      localStorage.setItem('pending_unlock_comic', item.id);
    } catch (e) {}

    const existing = document.getElementById('fullpage-comic-reader-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'fullpage-comic-reader-overlay';
    overlay.className = 'fullpage-reader';

    let readerMode = 'webtoon'; // 'webtoon' (vertical scroll predeterminado) | 'single' (paginado)
    let currentPageIndex = 0;
    let zoomLevel = 100;

    const pages = item.pages || [item.thumbnail];
    const previewLimit = item.previewLimit || 15;

    function renderReader() {
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
      const txtPageCounter = `${txtPageWord} <span style="color: var(--primary);" id="page-counter-num">${currentPageIndex + 1}</span> ${txtOfWord} ${pages.length}`;

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

      overlay.innerHTML = `
        <!-- ExoClick Instant Message Zone 6015134 inside comic reader -->
        <ins class="eas6a97888e6" data-zoneid="6015134"></ins>

        <!-- Top Navbar -->
        <header class="reader-navbar">
          <div class="reader-title-area">
            <button class="btn-secondary" id="back-to-catalog-btn" style="padding: 0.4rem 0.85rem; font-size: 0.88rem; font-weight: 700; border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.1);">
              <i class="ph-caret-left-bold"></i> ${txtCatalog}
            </button>
            <span class="reader-comic-title">${item.title}</span>
          </div>

          <div style="display: flex; align-items: center; gap: 0.5rem;">
            ${!isLocked ? `
              <a href="${item.downloadUrl || 'assets/L00.jpg'}" download target="_blank" class="btn-secondary" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid var(--emerald); font-size: 0.82rem; padding: 0.4rem 0.75rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 700; border-radius: var(--radius-md);" title="${txtDownloadHd}">
                <i class="ph-download-simple"></i> ${txtDownloadHd}
              </a>
            ` : ''}

            <!-- Mode Switcher Pill -->
            <div class="mode-toggle-pill">
              <button type="button" class="mode-toggle-btn ${readerMode === 'webtoon' ? 'active' : ''}" id="mode-webtoon-btn">
                <i class="ph-rows"></i> ${txtModeWebtoon}
              </button>
              <button type="button" class="mode-toggle-btn ${readerMode === 'single' ? 'active' : ''}" id="mode-single-btn">
                <i class="ph-book-open"></i> ${txtModeSingle}
              </button>
            </div>

            <button type="button" id="close-reader-x-btn" style="background: rgba(244,63,94,0.2); border: 1px solid var(--rose); color: var(--rose); width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; cursor: pointer;" title="${txtCloseTooltip}">
              &times;
            </button>
          </div>
        </header>

        <!-- Reader Main Content Container -->
        ${readerMode === 'webtoon' ? `
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
            </div>
          </div>
        ` : `
          <!-- Single Page Mode -->
          <div class="single-page-container" id="single-container">
            ${isLocked && currentPageIndex >= previewLimit ? `
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
              <img src="${pages[currentPageIndex]}" class="single-page-img" id="single-page-img" alt="${txtPageWord} ${currentPageIndex + 1}" />
            `}
          </div>
        `}

        <!-- Floating Bottom Toolbar -->
        <footer class="reader-bottom-bar">
          <button class="btn-secondary" id="reader-prev-btn" ${currentPageIndex === 0 || readerMode === 'webtoon' ? 'disabled style="opacity:0.3;"' : ''}>
            <i class="ph-caret-left"></i> ${txtPrev}
          </button>

          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 0.88rem; font-weight: 800; color: #fff;">
              ${txtPageCounter}
            </span>

            <!-- Zoom Pill -->
            <div style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.6); padding: 2px 8px; border-radius: var(--radius-full); border: 1px solid var(--border-color);">
              <button type="button" id="reader-zoom-out" style="background:transparent; border:none; color:#fff; cursor:pointer; padding:2px 5px;"><i class="ph-minus-bold"></i></button>
              <span id="reader-zoom-label" style="font-size:0.78rem; font-weight:700; color:var(--cyan); min-width:40px; text-align:center;">${zoomLevel}%</span>
              <button type="button" id="reader-zoom-in" style="background:transparent; border:none; color:#fff; cursor:pointer; padding:2px 5px;"><i class="ph-plus-bold"></i></button>
            </div>
          </div>

          <button class="btn-primary" id="reader-next-btn" ${currentPageIndex === pages.length - 1 || readerMode === 'webtoon' ? 'disabled style="opacity:0.3;"' : ''}>
            ${txtNext} <i class="ph-caret-right"></i>
          </button>
        </footer>
      `;

      // Attach event listeners
      const closeOverlay = () => {
        if (window.location.search.includes('comic=')) {
          history.pushState({}, '', window.location.pathname);
        }
        overlay.remove();
      };

      const backBtn = overlay.querySelector('#back-to-catalog-btn');
      if (backBtn) backBtn.onclick = closeOverlay;

      const xBtn = overlay.querySelector('#close-reader-x-btn');
      if (xBtn) xBtn.onclick = closeOverlay;

      const modeWebtoonBtn = overlay.querySelector('#mode-webtoon-btn');
      if (modeWebtoonBtn) {
        modeWebtoonBtn.onclick = () => {
          readerMode = 'webtoon';
          renderReader();
        };
      }

      const modeSingleBtn = overlay.querySelector('#mode-single-btn');
      if (modeSingleBtn) {
        modeSingleBtn.onclick = () => {
          readerMode = 'single';
          renderReader();
        };
      }

      const prevBtn = overlay.querySelector('#reader-prev-btn');
      if (prevBtn) {
        prevBtn.onclick = () => {
          if (currentPageIndex > 0) {
            currentPageIndex--;
            renderReader();
          }
        };
      }

      const nextBtn = overlay.querySelector('#reader-next-btn');
      if (nextBtn) {
        nextBtn.onclick = () => {
          if (currentPageIndex < pages.length - 1) {
            currentPageIndex++;
            renderReader();
          }
        };
      }

      const unlockBtn = overlay.querySelector('#paywall-unlock-btn');
      if (unlockBtn) {
        unlockBtn.onclick = () => {
          try {
            localStorage.setItem('pending_unlock_comic', item.id);
          } catch (e) {}

          if (item.paymentUrl) {
            window.open(item.paymentUrl, '_blank');
          }
        };
      }

      const paypalBtn = overlay.querySelector('#paywall-paypal-btn');
      if (paypalBtn) {
        paypalBtn.onclick = () => {
          try {
            localStorage.setItem('pending_unlock_comic', item.id);
          } catch (e) {}

          const paypalUri = item.paypalUrl || item.paypalLink;
          if (paypalUri) {
            window.open(paypalUri, '_blank');
          }
        };
      }

      // Zoom Listeners
      const applyViewZoom = () => {
        const singleImg = overlay.querySelector('#single-page-img');
        const zoomLabel = overlay.querySelector('#reader-zoom-label');
        if (singleImg) {
          singleImg.style.transform = `scale(${zoomLevel / 100})`;
        }
        if (zoomLabel) zoomLabel.innerText = `${zoomLevel}%`;
      };

      const zoomIn = overlay.querySelector('#reader-zoom-in');
      if (zoomIn) {
        zoomIn.onclick = () => {
          zoomLevel = Math.min(300, zoomLevel + 25);
          applyViewZoom();
        };
      }

      const zoomOut = overlay.querySelector('#reader-zoom-out');
      if (zoomOut) {
        zoomOut.onclick = () => {
          zoomLevel = Math.max(80, zoomLevel - 25);
          applyViewZoom();
        };
      }

      // Track scroll progress in Webtoon mode
      if (readerMode === 'webtoon') {
        const scrollContainer = overlay.querySelector('#webtoon-container');
        if (scrollContainer) {
          scrollContainer.onscroll = () => {
            const pageElems = scrollContainer.querySelectorAll('[id^="page-elem-"]');
            pageElems.forEach((elem, idx) => {
              const rect = elem.getBoundingClientRect();
              if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
                const counterNum = overlay.querySelector('#page-counter-num');
                if (counterNum) counterNum.innerText = idx + 1;
              }
            });
          };
        }
      }
    }

    document.body.appendChild(overlay);
    renderReader();

    // Trigger ExoClick Ad Serving inside comic reader overlay
    setTimeout(() => {
      try {
        if (window.AdProvider) {
          (window.AdProvider = window.AdProvider || []).push({"serve": {}});
        }
      } catch (e) {}
    }, 300);
    if (!window.location.search.includes('comic=' + item.id)) {
      history.pushState({}, '', '?comic=' + item.id);
    }
    store.incrementViews(item.id);
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'select_content', {
        content_type: 'comic',
        item_id: item.id,
        item_name: item.title
      });
    }
  }"""

new_reader = """  function openFullpageComicReader(item) {
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
  }"""

if old_reader in code:
    code = code.replace(old_reader, new_reader)
    print("Replaced openFullpageComicReader successfully!")
else:
    print("WARNING: Could not find exact old_reader match!")

with open('js/bundle.js', 'w', encoding='utf-8') as f:
    f.write(code)
