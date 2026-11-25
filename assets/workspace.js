(() => {
  'use strict';

  const copy = {
    description: [
      'ChatGPT 对话界面演示。用户请助手为一本相册取名。浮光实际适配 Codex。',
      'Illustration of a ChatGPT conversation about naming a photo album. Shimmer themes Codex.',
    ],
    newChat: ['新聊天', 'New chat'],
    projects: ['项目', 'Projects'],
    plugins: ['插件', 'Plugins'],
    recents: ['聊天', 'Chats'],
    chatTitle: ['给相册起个名字', 'A name for the album'],
    otherChat: ['周末散步路线', 'A walk this weekend'],
    anotherChat: ['整理读书笔记', 'Reading notes'],
    prompt: [
      '想把舍不得删的照片做成一本相册。起什么名字好？',
      'I’m making an album of photos I can’t bring myself to delete. What would you call it?',
    ],
    answerLead: ['我会叫它', 'I’d call it '],
    album: ['《再看一眼》', '“One More Look.”'],
    answerEnd: ['。', ''],
    detail: [
      '像翻相册时已经划过去，又忍不住滑回来的那一下。',
      'It’s that moment when you swipe past a photo, then go back for another look.',
    ],
    compose: ['询问任何问题', 'Ask anything'],
    share: ['分享', 'Share'],
    settings: ['设置', 'Settings'],
    note: ['ChatGPT 界面演示 · 浮光适配 Codex', 'ChatGPT interface demo · Shimmer themes Codex'],
  };

  const paths = {
    panel: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M9 5v14"/>',
    settings: '<path d="M3.5 7.5h4m4 0h9m-17 9H13m4 0h3.5"/><circle cx="9.5" cy="7.5" r="2"/><circle cx="15" cy="16.5" r="2"/>',
    newChat: '<path d="M12 5H7a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3v-5M10 14l.7-3.3L17.5 4a1.9 1.9 0 0 1 2.6 2.7L13.3 13.4 10 14Z"/>',
    folder: '<path d="M3 7a2.5 2.5 0 0 1 2.5-2.5H10l2.2 2.7h6.1a2.5 2.5 0 0 1 2.5 2.5v7.8a2.5 2.5 0 0 1-2.5 2.5H5.5A2.5 2.5 0 0 1 3 17.5Z"/>',
    plugins: '<path d="M9 4.5h3V4a2.1 2.1 0 1 1 4.2 0v.5H19v4l.5-.1a2.1 2.1 0 1 1 0 4.2l-.5-.1v6h-5.3v-.9a2 2 0 0 0-4 0v.9H5v-5.2h.8a2.1 2.1 0 1 0 0-4.2H5V6.6A2.1 2.1 0 0 1 7.1 4.5Z"/>',
    chevron: '<path d="m7.7 10 4.3 4.2 4.3-4.2"/>',
    share: '<path d="M7 10H5.7A1.7 1.7 0 0 0 4 11.7v6.5a1.8 1.8 0 0 0 1.8 1.8h12.4a1.8 1.8 0 0 0 1.8-1.8v-6.5a1.7 1.7 0 0 0-1.7-1.7H17M12 14V3.8m-3.5 3.6L12 3.8l3.5 3.6"/>',
    more: '<g fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></g>',
    duplicate: '<rect x="8" y="8" width="12" height="12" rx="2.3"/><path d="M15 4H6.3A2.3 2.3 0 0 0 4 6.3v8.3"/>',
    thumb: '<path d="M5 10h3v10H5zM8 11c3.8-1.6 4.7-5.3 5.1-7 2-.1 2.8 1.1 2.5 2.6l-.7 3.1h3.6a2 2 0 0 1 2 2.4l-1.2 5.8a2.1 2.1 0 0 1-2 1.7h-5.8L8 18.7"/>',
    plus: '<path d="M12 4.5v15m-7.5-7.5h15"/>',
    mic: '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5.8 11.7a6.2 6.2 0 0 0 12.4 0M12 18v3"/>',
    voice: '<path d="M4.5 10v4m3.8-7.5v11m3.8-14v17m3.8-15v13m3.8-10.5v6"/>',
  };

  function icon(name, extraClass = '') {
    return '<svg class="ws-icon ' + extraClass + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[name] + '</svg>';
  }

  function words(key) {
    return '<span data-ws-copy="' + key + '"></span>';
  }

  const windowControls = '<span class="ws-lights"><i></i><i></i><i></i></span>';
  const drawing = `
    <div class="ws-surface" aria-hidden="true">
      <div class="ws-sidebar">
        <div class="ws-chrome">${windowControls}${icon('panel')}</div>
        <div class="ws-product">ChatGPT</div>
        <div class="ws-menu">
          <div>${icon('newChat')}${words('newChat')}</div>
          <div>${icon('folder')}${words('projects')}</div>
          <div>${icon('plugins')}${words('plugins')}</div>
        </div>
        <div class="ws-recents">
          <div class="ws-group-name">${words('recents')}</div>
          <div class="ws-thread ws-current">${words('chatTitle')}</div>
          <div class="ws-thread">${words('otherChat')}</div>
          <div class="ws-thread">${words('anotherChat')}</div>
        </div>
        <div class="ws-settings">${icon('settings')}${words('settings')}</div>
      </div>
      <div class="ws-chat">
        <div class="ws-titlebar">
          <div class="ws-mobile-brand">${icon('panel')}<b>ChatGPT</b>${icon('chevron')}</div>
          <div class="ws-topic">${words('chatTitle')}</div>
          <div class="ws-header-tools"><span class="ws-share">${icon('share')}${words('share')}</span>${icon('more')}</div>
        </div>
        <div class="ws-conversation">
          <div class="ws-turns">
            <div class="ws-request">${words('prompt')}</div>
            <div class="ws-response">
              <p>${words('answerLead')}<strong>${words('album')}</strong>${words('answerEnd')}</p><p class="ws-response-detail">${words('detail')}</p>
              <div class="ws-feedback">${icon('duplicate')}${icon('thumb')}${icon('thumb', 'ws-down')}${icon('more')}</div>
            </div>
          </div>
        </div>
        <div class="ws-bottom">
          <div class="ws-composer">
            ${icon('plus')}
            <div class="ws-placeholder">${words('compose')}</div>
            <span class="ws-speech">${icon('mic')}<i>${icon('voice')}</i></span>
          </div>
          <div class="ws-caption">${words('note')}</div>
        </div>
      </div>
    </div>`;

  function mount() {
    const windows = [...document.querySelectorAll('[data-workspace]')];
    for (const host of windows) {
      host.classList.add('workspace-ui');
      host.setAttribute('role', 'img');
      host.innerHTML = drawing;
    }
    function translate() {
      const locale = document.documentElement.lang.toLowerCase().startsWith('en') ? 1 : 0;
      for (const host of windows) {
        host.setAttribute('aria-label', copy.description[locale]);
        for (const node of host.querySelectorAll('[data-ws-copy]')) {
          node.textContent = copy[node.dataset.wsCopy][locale];
        }
      }
    }
    translate();
    window.addEventListener('shimmer:language', translate);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
