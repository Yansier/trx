(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    window.CampaignI18n.applyTranslations();

    document.querySelectorAll('[data-config]').forEach((node) => {
      const key = node.dataset.config;
      if (Object.prototype.hasOwnProperty.call(window.CONFIG, key)) node.textContent = window.CONFIG[key];
    });

    const form = document.getElementById('claim-form');
    const emailInput = document.getElementById('email');
    const error = document.getElementById('email-error');
    const claimButton = document.getElementById('claim-button');
    const modal = document.getElementById('claim-modal');
    const modalPanel = modal.querySelector('.modal__panel');
    const modalEmail = document.getElementById('modal-email');
    const claimErrorEmail = document.getElementById('claim-error-email');
    const subscribeButton = document.getElementById('subscribe-button');
    const readyState = modal.querySelector('.claim-state--ready');
    const processingState = modal.querySelector('.claim-state--processing');
    const temporaryErrorState = modal.querySelector('.claim-state--temporary-error');
    const closeClaimButton = modal.querySelector('.claim-close-button');
    let previousFocus = null;
    let processing = false;
    let subscribeProcessing = false;
    let subscribeTimer = null;

    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    }

    function setError(message) {
      error.textContent = message;
      emailInput.classList.toggle('is-invalid', Boolean(message));
      emailInput.setAttribute('aria-invalid', String(Boolean(message)));
    }

    function validateEmail() {
      const value = emailInput.value.trim();
      if (!value) { setError(window.CampaignI18n.t('emptyEmail')); return false; }
      if (!isValidEmail(value)) { setError(window.CampaignI18n.t('invalidEmail')); return false; }
      setError('');
      return true;
    }

    function setLoading(isLoading) {
      processing = isLoading;
      claimButton.disabled = isLoading;
      claimButton.classList.toggle('is-loading', isLoading);
      claimButton.querySelector('.button-label').textContent = window.CampaignI18n.t(isLoading ? 'processing' : 'claimNow');
    }

    function setClaimModalState(state) {
      modalPanel.dataset.claimState = state;
      readyState.hidden = state !== 'ready';
      processingState.hidden = state !== 'processing';
      temporaryErrorState.hidden = state !== 'temporary-error';
      const labels = {
        ready: ['modal-title', 'modal-description'],
        processing: ['claim-processing-title', 'claim-processing-description'],
        'temporary-error': ['claim-error-title', 'claim-error-description']
      };
      modalPanel.setAttribute('aria-labelledby', labels[state][0]);
      modalPanel.setAttribute('aria-describedby', labels[state][1]);
    }

    function resetClaimModal() {
      if (subscribeTimer) window.clearTimeout(subscribeTimer);
      subscribeTimer = null;
      subscribeProcessing = false;
      subscribeButton.disabled = false;
      setClaimModalState('ready');
    }

    function openModal() {
      previousFocus = document.activeElement;
      resetClaimModal();
      const email = emailInput.value.trim();
      modalEmail.textContent = email;
      claimErrorEmail.textContent = email;
      modal.hidden = false;
      document.body.classList.add('dialog-open');
      requestAnimationFrame(() => { modal.classList.add('is-visible'); modalPanel.focus(); });
    }

    function closeModal() {
      resetClaimModal();
      modal.classList.remove('is-visible');
      document.body.classList.remove('dialog-open');
      window.setTimeout(() => { modal.hidden = true; }, 220);
      if (previousFocus && previousFocus.focus) previousFocus.focus();
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (processing) return;
      if (window.safariGuide && !window.safariGuide.guardEvent(event)) return;
      if (!validateEmail()) { emailInput.focus(); return; }
      setLoading(true);
      window.setTimeout(() => { setLoading(false); openModal(); }, Number(window.CONFIG.loadingDuration) || 900);
    });

    emailInput.addEventListener('input', () => { if (error.textContent) validateEmail(); });
    modal.addEventListener('click', (event) => { if (event.target.closest('[data-close-modal]')) closeModal(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });

    subscribeButton.addEventListener('click', () => {
      if (subscribeProcessing) return;
      subscribeProcessing = true;
      subscribeButton.disabled = true;
      setClaimModalState('processing');
      modalPanel.focus();
      subscribeTimer = window.setTimeout(() => {
        subscribeTimer = null;
        subscribeProcessing = false;
        setClaimModalState('temporary-error');
        closeClaimButton.focus();
      }, Number(window.CONFIG.claimProcessingDuration) || 1400);
    });

    document.querySelectorAll('[data-scroll-to-claim]').forEach((button) => {
      button.addEventListener('click', () => {
        const claimSection = document.getElementById('claim-section');
        if (!claimSection) return;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        claimSection.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        claimSection.classList.remove('is-highlighted');
        requestAnimationFrame(() => claimSection.classList.add('is-highlighted'));
        window.setTimeout(() => claimSection.classList.remove('is-highlighted'), 1200);
      });
    });

    const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); revealObserver.unobserve(entry.target); } });
    }, { threshold: 0.08 }) : null;
    document.querySelectorAll('.reveal').forEach((node) => revealObserver ? revealObserver.observe(node) : node.classList.add('is-revealed'));
  });
})();
