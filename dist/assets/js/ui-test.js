(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  if (params.get('ui_test') !== '1') return;

  document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
      .ui-test-panel{position:fixed;z-index:120;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;width:min(300px,calc(100% - 24px));padding:10px;border:1px solid rgba(118,145,255,.34);border-radius:14px;background:rgba(12,15,24,.94);box-shadow:0 18px 50px rgba(0,0,0,.58);backdrop-filter:blur(18px);font:600 10px/1.2 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .ui-test-panel::before{content:"UI TEST MODE";grid-column:1/-1;color:#8ea8ff;font-size:8px;letter-spacing:.16em}
      .ui-test-panel button{min-height:34px;padding:7px;border:1px solid rgba(255,255,255,.09);border-radius:9px;color:#d9deeb;background:rgba(255,255,255,.055);cursor:pointer;font:inherit}
      .ui-test-panel button:hover{border-color:rgba(255,83,105,.45);background:rgba(255,54,80,.1)}
      .ui-test-panel button:disabled{cursor:wait;opacity:.55}
      .ui-test-panel [data-ui-test="close"]{color:#9298a7}
      .ui-test-panel.ui-test-panel--top{top:calc(12px + env(safe-area-inset-top));bottom:auto}
    `;
    document.head.appendChild(style);

    const panel = document.createElement('aside');
    panel.className = 'ui-test-panel';
    panel.setAttribute('aria-label', 'UI Test Mode');
    panel.innerHTML = `
      <button type="button" data-ui-test="claim">Claim Modal</button>
      <button type="button" data-ui-test="mini">Safari Mini</button>
      <button type="button" data-ui-test="full">Safari Full</button>
      <button type="button" data-ui-test="close">Close All</button>
    `;
    document.body.appendChild(panel);

    function closeAll() {
      const claimModal = document.getElementById('claim-modal');
      const mini = document.getElementById('safari-mini');
      const full = document.getElementById('safari-full');
      const toast = document.getElementById('status-toast');
      [claimModal, mini, full, toast].forEach((node) => {
        if (!node) return;
        node.classList.remove('is-visible');
        node.hidden = true;
      });
      document.body.classList.remove('dialog-open');
      panel.classList.remove('ui-test-panel--top');
    }

    function showClaimModal(button) {
      const form = document.getElementById('claim-form');
      const email = document.getElementById('email');
      const guide = window.safariGuide;
      if (!form || !email || !guide || button.disabled) return;
      closeAll();
      panel.classList.add('ui-test-panel--top');
      email.value = 'preview@example.com';
      email.dispatchEvent(new Event('input', { bubbles: true }));
      const originalGuard = guide.guardEvent;
      guide.guardEvent = () => true;
      button.disabled = true;
      form.requestSubmit();
      window.setTimeout(() => {
        guide.guardEvent = originalGuard;
        button.disabled = false;
      }, Number(window.CONFIG.loadingDuration || 900) + 120);
    }

    function showMini() {
      closeAll();
      panel.classList.add('ui-test-panel--top');
      const mini = document.getElementById('safari-mini');
      if (!mini) return;
      mini.hidden = false;
      requestAnimationFrame(() => mini.classList.add('is-visible'));
    }

    function showFull() {
      closeAll();
      panel.classList.add('ui-test-panel--top');
      if (window.safariGuide) window.safariGuide.showFull();
    }

    panel.addEventListener('click', (event) => {
      const button = event.target.closest('[data-ui-test]');
      if (!button) return;
      const action = button.dataset.uiTest;
      if (action === 'claim') showClaimModal(button);
      if (action === 'mini') showMini();
      if (action === 'full') showFull();
      if (action === 'close') closeAll();
    });
  });
})();
