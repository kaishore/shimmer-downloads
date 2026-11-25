(() => {
  function sync() {
    const anchor = location.hash.slice(1);
    const lang = anchor === 'english' || anchor.endsWith('-en') ? 'en' : 'zh-CN';
    const root = document.documentElement;
    if (root.lang === lang) return;
    root.lang = lang;
    window.dispatchEvent(new Event('shimmer:language'));
  }
  sync();
  window.addEventListener('hashchange', sync);
  window.addEventListener('pageshow', sync);
})();
