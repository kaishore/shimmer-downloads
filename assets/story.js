(() => {
  'use strict';
  const q = (sel) => document.querySelector(sel);
  const all = (sel) => [...document.querySelectorAll(sel)];
  const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
  const ease = (n) => {
    const x = clamp(n);
    return x * x * (3 - 2 * x);
  };
  const works = {
    rain: {
      invitation: ['在对话里看这场雨', 'See the rain in a chat'],
      lines: [
        ['雨还在下。', '再坐一会儿。'],
        ['Still raining.', 'Stay a little longer.'],
      ],
      focus: 68,
      portrait: 94,
      studio: [
        '给雨伞挪个位置，把灯光调淡一点。直到这里看起来，像你自己的桌边。',
        'Move the umbrella into view. Turn down the glow. Find the balance that feels like your desk.',
      ],
      loop: ['看雨落进路面的灯影。', 'Watch the rain pool in the lamplight.'],
      depth: ['雨落在伞后，轻移鼠标或拖动。', 'Rain beyond the umbrella. Move or drag.'],
      colors: ['#e6b88e', '#4d767b', '#1b2b38'],
    },
    anime: {
      animatedForeground: true,
      invitation: ['把这一幕带进对话', 'See the duel in a chat'],
      lines: [
        ['刀光一闪。', '风才追上来。'],
        ['A flash of steel.', 'The wind follows.'],
      ],
      focus: 71,
      portrait: 55,
      studio: [
        '把红衣留在字句旁边，再借一点月色。读到这里，像翻回了最喜欢的那一格。',
        'Keep the red coat beside the words. Borrow a little moonlight from a favorite frame.',
      ],
      loop: ['刀光从屋脊上掠过。', 'A flash of steel above the rooftops.'],
      depth: ['刀光一闪，轻移鼠标或拖动。', 'Blades flash. Move or drag.'],
      colors: ['#e6d5a8', '#b95443', '#162e38'],
    },
    koi: {
      invitation: ['让锦鲤游进对话', 'Bring the koi into a chat'],
      lines: [
        ['水面很静。', '直到它游过。'],
        ['A quiet pond.', 'Then a flick of a fin.'],
      ],
      focus: 66,
      portrait: 57,
      studio: [
        '把一尾锦鲤留在字句旁边。池水深一些、浅一些，都可以在这里试。',
        'Leave a little room beside the words for the koi. Try the light and shade of the pond.',
      ],
      loop: ['留意鱼尾拂过的涟漪。', 'Watch the tail stir the water.'],
      depth: ['池水泛起涟漪，轻移鼠标或拖动。', 'Ripples on the pond. Move or drag.'],
      colors: ['#eedcbd', '#b9684c', '#244f4a'],
    },
  };
  const modes = ['still', 'motion', 'depth'];
  const root = document.documentElement;
  const journey = q('.journey'),
    opening = q('.opening'),
    stage = q('.stage');
  const studio = q('.workshop'),
    mainFrame = q('.main-frame');
  const heroCopy = q('.cover-copy'),
    launch = q('.story-invitation');
  const mast = q('.mast'),
    edition = q('#download'),
    faq = q('#faq');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  const compactArtwork = matchMedia('(max-width: 760px)').matches ||
    connection?.saveData || ['slow-2g', '2g', '3g'].includes(connection?.effectiveType);
  const english = () => root.lang === 'en';
  let currentArt = 'rain',
    currentMode = 'still',
    displayedUrl = 'assets/art/rain.webp';
  let pending = null,
    failed = null;
  const sampled = new Map();
  let crop = works[currentArt].focus,
    clarity = 45,
    usePalette = false,
    selectedCrop = false;
  let paintId,
    geometry,
    lastProgress = -1,
    focusAfterLaunch = false;
  let playback = null,
    lastPaintTime = 0;
  const loading = new Map();
  const previouslyDecoded = new Set();
  const missedWarmups = new Set();
  function decode(url, background = false) {
    const existing = loading.get(url);
    if (existing) {
      if (!background) {
        existing.background = false;
        existing.image.fetchPriority = 'high';
      }
      return existing.ready;
    }
    const image = new Image();
    image.fetchPriority = background ? 'low' : 'high';
    image.src = url;
    const entry = { image, background };
    entry.ready = image.decode().then(() => {
      previouslyDecoded.add(url);
      return image;
    }, error => {
      if (entry.background && loading.get(url) === entry) missedWarmups.add(url);
      throw error;
    }).finally(() => {
      if (loading.get(url) === entry) loading.delete(url);
    });
    loading.set(url, entry);
    return entry.ready;
  }
  function cancelLoad(url, entry) {
    loading.delete(url);
    entry.image.removeAttribute('src');
  }
  function discardOtherLoads(files, keepWarmups = false) {
    const needed = new Set(files.map(([url]) => url));
    for (const [url, entry] of loading) {
      if (!needed.has(url) && !(keepWarmups && entry.background)) cancelLoad(url, entry);
    }
  }
  function layers(id, mode, animate = !reduced.matches) {
    // Rain and Koi have a single native-size loop shared by both layouts.
    const useCompact = compactArtwork && (mode === 'depth' || (mode === 'motion' && id === 'anime'));
    const directory = useCompact ? 'assets/art/compact/' : 'assets/art/';
    const base = directory + id;
    if (mode === 'depth') {
      return [
        [base + (animate ? '-back-motion.webp' : '-back.webp'), 'back'],
        [base + (animate && works[id].animatedForeground ? '-front-motion.webp' : '-front.webp'), 'front'],
      ];
    }
    return [[base + (mode === 'motion' ? '-motion' : '') + '.webp', '']];
  }
  let posterReady = false;
  let galleryVisible = true;
  let hinted = null;
  let warmTimer, hintTimer;

  function hintedFiles() {
    if (!hinted) return [];
    const { art, mode } = hinted;
    if (mode === 'motion' && reduced.matches) return layers(art, 'still');
    if (mode === 'depth' && !reduced.matches) return [...layers(art, mode, false), ...layers(art, mode)];
    return layers(art, mode);
  }
  function warmupFiles() {
    // The poster can be on screen while the initial loop is still arriving.
    if (pending) return layers(pending.art, 'depth', false);
    const files = [];
    const worksToWarm = [currentArt];
    if (connection?.effectiveType !== '3g') {
      worksToWarm.push(...Object.keys(works).filter(art => art !== currentArt));
    }
    for (const art of worksToWarm) {
      files.push(...layers(art, 'still'), ...layers(art, 'depth', false));
      if (!reduced.matches) files.push(...layers(art, 'motion'), ...layers(art, 'depth', true));
    }
    return files;
  }
  function needsWarmup([url]) {
    return !previouslyDecoded.has(url) && !missedWarmups.has(url) && loading.get(url)?.background !== false;
  }
  function warmNext() {
    const active = [...loading].find(([, entry]) => entry.background);
    if (!posterReady || !galleryVisible || document.hidden || connection?.saveData ||
        ['slow-2g', '2g'].includes(connection?.effectiveType) || failed) {
      if (active) cancelLoad(...active);
      return;
    }
    // A foreground choice controls its transfers. A cache hit can coexist with a warmup.
    if (pending && !(pending.initial && pending.mode === 'motion')) return;
    const files = warmupFiles();
    const priority = hintedFiles().find(needsWarmup);
    // Finish a useful in-flight file before filling the next idle slot.
    if (!priority && active && files.some(([url]) => url === active[0])) return;
    const next = priority ?? files.find(needsWarmup);
    if (active && active[0] !== next?.[0]) cancelLoad(...active);
    if (next && !loading.has(next[0])) decode(next[0], true).then(scheduleWarmup, scheduleWarmup);
  }
  function scheduleWarmup() {
    clearTimeout(warmTimer);
    warmTimer = setTimeout(warmNext, 0);
  }
  function hintChoice(button) {
    hinted = {
      art: button.dataset.art ?? pending?.art ?? currentArt,
      mode: button.dataset.mode ?? pending?.mode ?? currentMode,
    };
    scheduleWarmup();
  }
  // The endpoint colours in the preview come from the actual local image.
  // Keep the art-directed defaults available if sampling is unavailable.
  function sampleColors(id) {
    if (sampled.has(id)) return;
    const image = q('#art-cover [data-art="' + id + '"] img');
    const task = image
      .decode()
      .then(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 27;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const tones = [];
        for (let i = 0; i < pixels.length; i += 4) {
          const rgb = Array.from(pixels.slice(i, i + 3));
          tones.push({ rgb, light: rgb[0] * 0.213 + rgb[1] * 0.715 + rgb[2] * 0.072 });
        }
        tones.sort((a, b) => a.light - b.light);
        works[id].colors = [0.94, 0.63, 0.24].map((part) => {
          const { rgb } = tones[Math.floor(part * (tones.length - 1))];
          return '#' + rgb.map((n) => n.toString(16).padStart(2, '0')).join('');
        });
        if (id === currentArt) applySettings();
      })
      .catch(() => {
        sampled.delete(id);
      });
    sampled.set(id, task);
  }
  function renderCopy() {
    const work = works[currentArt];
    ['one', 'two'].forEach((id, i) => {
      const line = q('[data-line="' + id + '"]');
      line.querySelector('.zh').textContent = work.lines[0][i];
      line.querySelector('.en').textContent = work.lines[1][i];
    });
    q('.story-invitation .zh').textContent = work.invitation[0];
    q('.story-invitation .en').textContent = work.invitation[1];
    q('.studio-lede .zh').textContent = work.studio[0];
    q('.studio-lede .en').textContent = work.studio[1];
    renderControls();
    measure();
    document.title = english()
      ? 'Shimmer · The pictures you love, inside Codex'
      : '浮光 Shimmer · 把喜欢的画面带进 Codex';
  }
  function renderControls() {
    const art = pending?.art ?? currentArt;
    const mode = pending?.mode ?? currentMode;
    const work = works[currentArt];
    const locale = english() ? 1 : 0;
    all('[data-art]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.art === art));
      const label = button.querySelector(locale ? '.en' : '.zh').textContent;
      button.setAttribute('aria-label', label);
      button.title = label;
    });
    all('[data-mode]').forEach((button) =>
      button.setAttribute('aria-pressed', String(button.dataset.mode === mode)),
    );
    const notes = {
      still: ['', ''],
      motion: work.loop,
      depth: reduced.matches ? ['移动鼠标或左右拖动画面。', 'Move the pointer or drag the picture.'] : work.depth,
    };
    let message = notes[currentMode][locale];
    if (pending) {
      const loading = {
        still: ['正在载入画面…', 'Loading artwork…'],
        motion: ['正在载入动图…', 'Loading animation…'],
        depth: currentArt === art && currentMode === 'depth'
          ? ['可以拖动了，动效载入中…', 'Drag now · loading motion…']
          : ['正在准备视差…', 'Preparing parallax…'],
      };
      message = loading[mode][locale];
    } else if (failed) {
      message = ['载入失败。', 'Couldn’t load.'][locale];
    }
    all('.art-stack').forEach((stack) => stack.setAttribute('aria-busy', String(Boolean(pending))));
    all('.mode-note').forEach((note) => {
      note.toggleAttribute('data-loading', Boolean(pending));
      // An earlier cached homepage can still load this script after a Pages update.
      (note.querySelector('.mode-note-text') || note).textContent = message;
      const retry = note.querySelector('.media-retry');
      if (retry) retry.hidden = !failed;
    });
    const live = q('.media-status');
    const status = pending || failed ? message : '';
    if (live.textContent !== status) live.textContent = status;
  }
  function resetDepth() {
    for (const name of ['front-x', 'front-y', 'back-x', 'back-y'])
      journey.style.setProperty('--' + name, '0px');
  }
  function present(art, mode, files, images) {
    if (displayedUrl === files[0][0]) return;
    const keepDepth = currentMode === 'depth' && mode === 'depth' && art === currentArt;
    all('.art-stack').forEach((stack, index) => {
      const exposure = document.createElement('div');
      exposure.className = 'exposure ' + mode;
      files.forEach(([, cls], i) => {
        // A still foreground can belong to both exposures during the crossfade.
        const image = index === 0 && !images[i].isConnected ? images[i] : images[i].cloneNode();
        image.className = 'art-layer ' + cls;
        image.alt = '';
        exposure.append(image);
      });
      if (reduced.matches) {
        exposure.classList.add('active');
        stack.replaceChildren(exposure);
      } else {
        const previous = [...stack.children];
        stack.append(exposure);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          exposure.classList.add('active');
          setTimeout(() => previous.forEach((child) => child.remove()), 620);
        }));
      }
    });
    if (art !== currentArt && !selectedCrop) crop = works[art].focus;
    displayedUrl = files[0][0];
    currentArt = art;
    currentMode = mode;
    if (!keepDepth) resetDepth();
    sampleColors(art);
    renderCopy();
    applySettings();
  }
  async function choose(art, mode, initial = false) {
    if (!Object.hasOwn(works, art) || !modes.includes(mode)) return;
    const files = layers(art, mode);
    const key = files[0][0];
    clearTimeout(hintTimer);
    hinted = null;
    if (pending?.key === key || (!pending && !failed && displayedUrl === key)) return;
    failed = null;
    if (displayedUrl === key) {
      pending = null;
      discardOtherLoads([], true);
      renderControls();
      scheduleWarmup();
      return;
    }
    const request = { art, mode, key, initial };
    pending = request;
    renderControls();

    // A small pair of still planes makes parallax usable while its loops arrive.
    // When changing to another artwork's loop, its poster can appear first.
    let preview = [];
    let previewMode = 'still';
    if (mode === 'depth' && !reduced.matches) {
      previewMode = 'depth';
      preview = layers(art, mode, false);
    } else if (mode === 'motion' && art !== currentArt) {
      preview = layers(art, 'still');
    }
    const seenTarget = files.every(([url]) => previouslyDecoded.has(url));
    discardOtherLoads([...files, ...preview], seenTarget);
    if (preview.length && displayedUrl !== preview[0][0] && !seenTarget) {
      Promise.all(preview.map(([url]) => decode(url))).then((images) => {
        if (pending === request || failed === request) present(art, previewMode, preview, images);
      }, () => {}); // An optional preview must never block the selected artwork.
    }
    let images;
    try {
      images = await Promise.all(files.map(([url]) => decode(url)));
    } catch {
      if (pending === request) {
        pending = null;
        failed = request;
        renderControls();
        scheduleWarmup();
      }
      return;
    }
    if (pending !== request) return;
    pending = null;
    present(art, mode, files, images);
    scheduleWarmup();
  }
  all('[data-art]').forEach((button) =>
    button.addEventListener('click', () => choose(button.dataset.art, pending?.mode ?? currentMode)),
  );
  all('[data-mode]').forEach((button) =>
    button.addEventListener('click', () => choose(pending?.art ?? currentArt, button.dataset.mode)),
  );
  all('[data-art], [data-mode]').forEach(button => {
    button.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') hintTimer = setTimeout(() => hintChoice(button), 120);
    });
    button.addEventListener('pointerleave', () => clearTimeout(hintTimer));
    button.addEventListener('focus', () => hintChoice(button));
  });
  all('.media-retry').forEach((button) => {
    button.addEventListener('click', () => {
      if (!failed) return;
      button.closest('.mode-rail').querySelector('[data-mode="' + failed.mode + '"]').focus({ preventScroll: true });
      choose(failed.art, failed.mode);
    });
  });
  function applySettings() {
    const work = works[currentArt];
    q('#crop').value = crop;
    q('#crop-value').value = crop + '%';
    q('#clarity').value = clarity;
    q('#clarity-value').value = clarity + '%';
    const alpha = (1 - clarity / 100) * 0.94;
    journey.style.setProperty('--focus', crop + '%');
    journey.style.setProperty('--portrait-focus', (selectedCrop ? crop : work.portrait) + '%');
    journey.style.setProperty('--paper-alpha', alpha);
    journey.style.setProperty('--panel-alpha', alpha);
    journey.style.setProperty('--accent', usePalette ? work.colors[0] : '#bcd3c1');
    all('.palette i').forEach((dot, i) => {
      dot.style.backgroundColor = work.colors[i];
    });
    const toggle = q('#palette-toggle');
    toggle.setAttribute('aria-pressed', String(usePalette));
    toggle.querySelector('.zh').textContent = usePalette ? '试试默认配色' : '使用画作配色';
    toggle.querySelector('.en').textContent = usePalette ? 'Try default colours' : 'Use artwork colours';
  }
  q('#crop').addEventListener('input', (e) => {
    selectedCrop = true;
    crop = Number(e.target.value);
    applySettings();
  });
  q('#clarity').addEventListener('input', (e) => {
    clarity = Number(e.target.value);
    applySettings();
  });
  q('#palette-toggle').addEventListener('click', () => {
    usePalette = !usePalette;
    applySettings();
  });
  function setDepth(x, y) {
    if (currentMode !== 'depth') return;
    journey.style.setProperty('--front-x', (x * geometry.depthX).toFixed(1) + 'px');
    journey.style.setProperty('--front-y', (y * geometry.depthY).toFixed(1) + 'px');
    journey.style.setProperty('--back-x', (-x * geometry.depthX * 0.37).toFixed(1) + 'px');
    journey.style.setProperty('--back-y', (-y * geometry.depthY * 0.37).toFixed(1) + 'px');
  }
  journey.addEventListener('pointermove', (event) => {
    if (currentMode !== 'depth' || (event.pointerType !== 'mouse' && !event.buttons)) return;
    const frame = event.target.closest('.workshop') ? q('.mobile-frame') : stage;
    const rect = frame.getBoundingClientRect();
    if (event.clientY < rect.top || event.clientY > rect.bottom) {
      resetDepth();
      return;
    }
    setDepth(
      clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1),
      clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1),
    );
  });
  all('[data-mode="depth"]').forEach((button) => {
    button.addEventListener('keydown', (event) => {
      if (currentMode !== 'depth') return;
      const offsets = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (!offsets[event.key]) return;
      event.preventDefault();
      setDepth(...offsets[event.key]);
    });
    button.addEventListener('blur', resetDepth);
  });
  ['pointerleave', 'pointercancel', 'pointerup'].forEach((type) =>
    journey.addEventListener(type, resetDepth),
  );
  // Cache page coordinates when layout changes. Scroll frames only read the scroll offset.
  function measure() {
    const sample = q('.mobile-frame').getBoundingClientRect();
    const y = window.scrollY;
    geometry = {
      top: y + opening.getBoundingClientRect().top,
      travel: Math.max(1, (opening.offsetHeight - stage.offsetHeight) * 0.86),
      // Keep both planes inside the overscan of the smaller studio preview.
      depthX: Math.min(16, sample.width * 0.021),
      depthY: Math.min(10, sample.height * 0.021),
      mastMid: mast.offsetHeight / 2,
      studio: y + studio.getBoundingClientRect().top,
      edition: y + edition.getBoundingClientRect().top,
      faq: y + faq.getBoundingClientRect().top,
    };
    lastProgress = -1;
    requestPaint();
  }
  function drawOpening(p) {
    const reveal = ease(p / 0.94);
    // The feather passes entirely beyond the opposite corner by the last frame.
    const feather = 10 + 8 * Math.sin(Math.PI * reveal);
    const edge = (100 + feather) * reveal;
    const copy = 1 - ease((p - 0.06) / 0.38);
    const style = stage.style;
    style.setProperty('--reveal-core', edge - feather + '%');
    style.setProperty('--reveal-edge', edge + '%');
    style.setProperty('--copy', copy);
    style.setProperty('--dim', 0.95 * ease((p - 0.5) / 0.5));
    style.setProperty('--outline', 0.28 * reveal);
    style.setProperty('--shadow', 0.55 * ease((p - 0.63) / 0.37));
    opening.classList.toggle('is-opening', p > 0);
    opening.classList.toggle('is-open', reveal === 1);
    mainFrame.setAttribute('aria-hidden', String(p < 0.75));
    launch.setAttribute('aria-expanded', String(p >= 0.75));
    heroCopy.inert = copy <= 0.01;
  }
  function paint(now = performance.now()) {
    paintId = 0;
    if (!geometry) return;
    const g = geometry;
    const playing = playback !== null;
    if (playing) {
      const time = reduced.matches ? 1 : clamp((now - playback.start) / playback.duration);
      const destination = Math.ceil(g.top + g.travel);
      window.scrollTo({ top: playback.from + (destination - playback.from) * time, behavior: 'instant' });
      if (time === 1) playback = null;
      else requestPaint();
    }
    const y = Math.max(0, window.scrollY);
    const position = y + g.mastMid;
    mast.classList.toggle('on-paper', (position >= g.studio && position < g.edition) || position >= g.faq);
    mast.classList.toggle('on-dark', position >= g.edition && position < g.faq);
    const target = clamp((y - g.top) / g.travel);
    const elapsed = clamp(now - lastPaintTime, 1, 32);
    lastPaintTime = now;
    let progress = reduced.matches ? Number(target >= 0.5) : target;
    // Round off discrete wheel ticks inside the hero without delaying section navigation.
    if (!reduced.matches && !playing && lastProgress >= 0 && y > g.top && y < g.studio - g.mastMid * 2) {
      progress = target + (lastProgress - target) * Math.exp(-elapsed / 48);
      if (Math.abs(progress - target) < 0.001) progress = target;
      else requestPaint();
    }
    if (progress !== lastProgress) {
      lastProgress = progress;
      drawOpening(progress);
    }
    if (progress < 0.05 && document.activeElement === mainFrame) launch.focus({ preventScroll: true });
    if (focusAfterLaunch && !playback && progress >= 0.94 && y >= g.top + g.travel - 1) {
      mainFrame.focus({ preventScroll: true });
      focusAfterLaunch = false;
    }
  }
  function requestPaint() {
    if (!paintId) paintId = requestAnimationFrame(paint);
  }
  function interruptLaunch(event) {
    if (!playback) return;
    focusAfterLaunch = false;
    // Picking a work must not interrupt the reveal or move focus off the picker.
    const isChoice = event.target.closest?.('.cover-foot button');
    if (
      isChoice &&
      (event.type === 'pointerdown' ||
        event.type === 'touchstart' ||
        (event.type === 'keydown' && ['Enter', ' '].includes(event.key)))
    )
      return;
    playback = null;
  }
  for (const type of ['wheel', 'touchstart', 'touchmove', 'pointerdown', 'keydown']) {
    window.addEventListener(type, interruptLaunch, { passive: true, capture: true });
  }
  launch.addEventListener('click', (event) => {
    focusAfterLaunch = event.detail === 0;
    const from = window.scrollY;
    const remaining = 1 - clamp((from - geometry.top) / geometry.travel);
    playback = { start: performance.now(), from, duration: Math.max(240, 1000 * remaining) };
    requestPaint();
  });
  root.classList.add('has-motion');
  mainFrame.tabIndex = -1;
  renderCopy();
  applySettings();
  paint();
  sampleColors(currentArt);
  const options = new URLSearchParams(location.search);
  const requestedArt = options.get('art');
  const selection = requestedArt === 'stars' ? 'anime' : requestedArt;
  const initialArt = Object.hasOwn(works, selection) ? selection : currentArt;
  const previewMode = options.get('mode');
  const initialMode = reduced.matches ? 'still' : modes.includes(previewMode) ? previewMode : 'motion';
  choose(initialArt, initialMode, true);
  const poster = q('.opening .art-layer');
  poster.decode().then(() => previouslyDecoded.add(poster.getAttribute('src')), () => {}).then(() => {
    posterReady = true;
    scheduleWarmup();
  });
  if ('IntersectionObserver' in window) {
    galleryVisible = false;
    new IntersectionObserver(([entry]) => {
      galleryVisible = entry.isIntersecting;
      scheduleWarmup();
    }).observe(journey);
  }
  document.addEventListener('visibilitychange', scheduleWarmup);
  connection?.addEventListener?.('change', scheduleWarmup);
  new ResizeObserver(measure).observe(journey);
  window.addEventListener('resize', measure);
  window.addEventListener('scroll', requestPaint, { passive: true });
  window.addEventListener('shimmer:language', renderCopy);
  window.addEventListener('pageshow', measure);
  document.fonts?.ready.then(measure);
  reduced.addEventListener('change', () => {
    scheduleWarmup();
    if (reduced.matches) choose(pending?.art ?? currentArt, 'still');
    else if ((pending?.mode ?? currentMode) === 'depth') choose(pending?.art ?? currentArt, 'depth');
    measure();
  });
})();
