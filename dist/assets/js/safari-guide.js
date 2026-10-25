(function () {
  'use strict';

  const ALTERNATIVE_IOS = /CriOS|FxiOS|EdgiOS|OPiOS/i;
  const FACEBOOK = /FBAN|FBAV|\[FB_IAB/i;
  const INSTAGRAM = /Instagram/i;
  const MESSENGER = /FB_IAB\/Messenger|MessengerForiOS/i;
  const GOOGLE_APP = /GSA\//i;
  const WECHAT = /MicroMessenger/i;
  const TIKTOK = /TikTok|musical_ly|BytedanceWebview/i;
  const TELEGRAM_EXPLICIT = /Telegram/i;

  function detectEnvironment(input) {
    const ua = String(input.ua || '');
    const platform = String(input.platform || '');
    const maxTouchPoints = Number(input.maxTouchPoints || 0);
    const href = String(input.href || '');
    const protocol = input.protocol || (href.match(/^([a-z]+:)/i) || [])[1] || '';
    const telegramBridge = Boolean(input.telegramBridge);
    const isIPhone = /iPhone/i.test(ua);
    const isIPad = /iPad/i.test(ua) || (/Macintosh/i.test(ua) && maxTouchPoints > 1);
    const isIOS = isIPhone || isIPad || /iPod/i.test(ua);
    const isInstagram = INSTAGRAM.test(ua);
    const isMessenger = MESSENGER.test(ua);
    const isFacebookIOS = isIPhone && FACEBOOK.test(ua) && !isInstagram && !isMessenger;
    const isAlternativeIOS = isIOS && ALTERNATIVE_IOS.test(ua);
    const isExplicitWebView = FACEBOOK.test(ua) || isInstagram || isMessenger || GOOGLE_APP.test(ua) || WECHAT.test(ua) || TIKTOK.test(ua) || TELEGRAM_EXPLICIT.test(ua) || telegramBridge;
    const isSafari = isIOS && /Safari/i.test(ua) && !isAlternativeIOS && !isExplicitWebView;
    const isHttps = protocol.toLowerCase() === 'https:';
    let hasFbAd = false;
    try { hasFbAd = new URL(href).searchParams.get('fb_ad') === '1'; } catch (_) { hasFbAd = /(?:\?|&)fb_ad=1(?:&|#|$)/.test(href); }
    const facebookAcquisitionEligible = isIPhone && isFacebookIOS && !isInstagram && !isMessenger && hasFbAd && isHttps;
    const canAutoHandoffSafari = isIPhone && isFacebookIOS && isHttps;
    const isNonIOS = !isIOS;
    const businessGuardRequired = isNonIOS || isAlternativeIOS || isExplicitWebView;

    return Object.freeze({ isIPhone, isIOS, isSafari, isFacebookIOS, isInstagram, isMessenger, isAlternativeIOS, isExplicitWebView, hasFbAd, isHttps, facebookAcquisitionEligible, canAutoHandoffSafari, businessGuardRequired, platform });
  }

  function toSafariScheme(href) {
    return String(href).replace(/^https:/i, 'x-safari-https:');
  }

  function createController(win, doc) {
    const environment = detectEnvironment({
      ua: win.navigator.userAgent,
      platform: win.navigator.platform,
      maxTouchPoints: win.navigator.maxTouchPoints,
      href: win.location.href,
      protocol: win.location.protocol,
      telegramBridge: Boolean(win.TelegramWebviewProxy || (win.Telegram && win.Telegram.WebApp))
    });
    let miniDismissed = false;
    let lastFocused = null;
    const mini = doc.getElementById('safari-mini');
    const full = doc.getElementById('safari-full');

    function openSafari() {
      if (!environment.canAutoHandoffSafari) return false;
      win.location.href = toSafariScheme(win.location.href);
      return true;
    }

    function showMini() {
      if (miniDismissed || !environment.facebookAcquisitionEligible || !mini) return;
      mini.hidden = false;
      requestAnimationFrame(() => mini.classList.add('is-visible'));
    }

    function hideMini() {
      miniDismissed = true;
      if (!mini) return;
      mini.classList.remove('is-visible');
      win.setTimeout(() => { mini.hidden = true; }, 220);
    }

    function showFull() {
      if (!full) return;
      lastFocused = doc.activeElement;
      full.hidden = false;
      full.querySelector('[data-full-open]').hidden = !environment.canAutoHandoffSafari;
      doc.body.classList.add('dialog-open');
      requestAnimationFrame(() => {
        full.classList.add('is-visible');
        full.querySelector('.safari-full__panel').focus();
      });
    }

    function hideFull() {
      if (!full) return;
      full.classList.remove('is-visible');
      doc.body.classList.remove('dialog-open');
      win.setTimeout(() => { full.hidden = true; }, 220);
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    async function copyLink() {
      const feedback = full && full.querySelector('[data-copy-feedback]');
      try {
        await win.navigator.clipboard.writeText(win.location.href);
        if (feedback) feedback.textContent = window.CampaignI18n.t('copied');
        return true;
      } catch (_) {
        if (feedback) feedback.textContent = window.CampaignI18n.t('copyFailed');
        return false;
      }
    }

    function guardEvent(event) {
      if (!environment.businessGuardRequired) return true;
      if (event) { event.preventDefault(); event.stopPropagation(); }
      showFull();
      return false;
    }

    function attemptFacebookHandoff() {
      if (!environment.facebookAcquisitionEligible) return;
      openSafari();
      win.setTimeout(() => {
        if (doc.visibilityState === 'visible' && !miniDismissed) showMini();
      }, Number(window.CONFIG.safariFallbackDelay) || 1500);
    }

    doc.addEventListener('click', (event) => {
      const businessAction = event.target.closest('[data-business-action]');
      if (businessAction && !guardEvent(event)) return;
      if (event.target.closest('[data-mini-close]')) hideMini();
      if (event.target.closest('[data-full-close]')) hideFull();
      if (event.target.closest('[data-copy-link]')) copyLink();
      if (event.target.closest('[data-mini-open], [data-full-open]')) openSafari();
    }, true);

    doc.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && full && !full.hidden) hideFull();
    });

    attemptFacebookHandoff();
    return { environment, guardEvent, showFull, hideFull, showMini, hideMini, openSafari, copyLink, get miniDismissed() { return miniDismissed; } };
  }

  window.SafariGuide = { detectEnvironment, toSafariScheme, createController };
  document.addEventListener('DOMContentLoaded', () => { window.safariGuide = createController(window, document); });
})();
