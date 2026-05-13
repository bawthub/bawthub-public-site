// BawtHub Architecture — shared client JS
// Mega-menu hover/click + command palette + coming-soon toast

(function(){
  'use strict';

  // ---- Site index (single source of truth for nav + cmdk) ----
  const PAGES = {
    overview: {
      label: 'Overview', icon: '◧',
      items: [
        { href: '/architecture/', icon: '✦', name: 'System map', desc: 'The whole stack on one page.', built: true },
        { href: '/story.html',   icon: '✍', name: 'The story',  desc: 'How a CLI grew into a multi-bot platform.', built: true },
        { href: '/',             icon: '⌂', name: 'Home',       desc: 'Back to the bawthub.com landing page.', built: true },
      ]
    },
    'llm-bawt': {
      label: 'llm-bawt', icon: '⌬',
      items: [
        { href: '/architecture/llm-bawt/overview.html',       icon: '◐', name: 'Overview',          desc: 'Big picture: what llm-bawt is and how requests flow.', built: true },
        { href: '/architecture/llm-bawt/api.html',            icon: '⌥', name: 'OpenAI-compat API',  desc: 'FastAPI service · 18 route modules · streaming.', built: true },
        { href: '/architecture/llm-bawt/pipeline.html',       icon: '⟶', name: 'Request pipeline',   desc: 'Turn lifecycle · prompt build · dispatch.', built: true },
        { href: '/architecture/llm-bawt/clients.html',        icon: '⊞', name: 'Model clients',      desc: 'OpenAI · Claude · Grok · vLLM · llama.cpp — one interface.', built: true },
        { href: '/architecture/llm-bawt/memory.html',         icon: '◈', name: 'Memory',             desc: 'pgvector · 5 layers · decay · supersede chains.', built: true },
        { href: '/architecture/llm-bawt/tools.html',          icon: '⚙', name: 'Tools',              desc: 'Native tool loop + ReAct parser + streaming events.', built: true },
        { href: '/architecture/llm-bawt/agent-backends.html', icon: '⊡', name: 'Agent backends',     desc: 'The bridge pattern. How external agents become bots.', built: true },
        { href: '/architecture/llm-bawt/mcp-server.html',     icon: '⌘', name: 'MCP server',         desc: '60 tools over streamable-http for agents.', built: true },
        { href: '/architecture/llm-bawt/adapters.html',       icon: '◇', name: 'Prompt adapters',    desc: 'Per-model chat templates (dolphin, pygmalion, default).', built: true },
      ]
    },
    bawthub: {
      label: 'BawtHub', icon: '◐',
      items: [
        { href: '/architecture/bawthub/overview.html', icon: '◑', name: 'Overview',           desc: 'Next.js web + Python voice + 3D avatar.', built: true },
        { href: '/architecture/bawthub/frontend.html', icon: '◇', name: 'Frontend',           desc: 'Next.js 16 · React 19 · Zustand store.', built: true },
        { href: '/architecture/bawthub/voice.html',    icon: '◉', name: 'Voice pipeline',     desc: 'STT (moshi) · TTS · pause-driven turns · realtime ws.', built: true },
        { href: '/architecture/bawthub/avatar.html',   icon: '☻', name: '3D avatar',          desc: 'VRM/GLB · three.js · lip-sync.', built: true },
        { href: '/architecture/bawthub/surfaces.html', icon: '⌗', name: 'UI surfaces',        desc: 'Chat · agents · tools · unraid · memory dashboards.', built: true },
      ]
    },
    agents: {
      label: 'Agents', icon: '⊡',
      items: [
        { href: '/architecture/agents/task-system.html',         icon: '✓', name: 'Task system',        desc: 'Projects, plan, dispatch, review, MCP tools.', built: true },
        { href: '/architecture/agents/claude-code-bridge.html',  icon: '◈', name: 'Claude Code bridge', desc: 'SDK bridge · Redis fanout · streamed tool events.', built: true },
        { href: '/architecture/agents/codex-bridge.html',        icon: '◊', name: 'Codex bridge',       desc: 'OAuth · session queue · per-bot threads.', built: true },
        { href: '/architecture/agents/openclaw-bridge.html',     icon: '◍', name: 'OpenClaw bridge',    desc: 'The original. WebSocket · ingest · fanout.', built: true },
        { href: '/architecture/agents/inter-bot-comm.html',      icon: '⇄', name: 'Inter-bot comm',     desc: 'Bots messaging bots via MCP tools.', built: true },
      ]
    },
    more: {
      label: 'More', icon: '⋯',
      items: [
        { href: '/architecture/streaming/',  icon: '⌁', name: 'Streaming events', desc: 'Redis-backed event bus. The hard problem.', built: true },
        { href: '/architecture/data/',       icon: '⌗', name: 'Data & schema',    desc: 'Postgres · Prisma · turn logs · activity.', built: true },
        { href: '/architecture/deployment/', icon: '⌘', name: 'Deployment',       desc: 'Docker on Unraid · NPM · Authelia · br0.2.', built: true },
        { href: 'https://github.com/zenoran/llm-bawt', icon: '↗', name: 'llm-bawt on GitHub', desc: 'The public core repo.', built: true, external: true },
      ]
    },
  };

  // Mark "built" pages globally so the rest are marked soon.
  // (Items default to soon unless built:true.)

  // ---- Mega-menu ----
  function setupMegaMenu(){
    const buttons = document.querySelectorAll('.topbar .nav .nav-btn[data-menu]');
    let openPanel = null;
    let closeTimer = null;

    function buildPanel(key){
      const section = PAGES[key];
      if(!section) return null;
      const panel = document.createElement('div');
      panel.className = 'megapanel';
      panel.dataset.menu = key;
      panel.innerHTML = `
        <div class="head"><span class="t">${section.label}</span><span class="h">${section.items.length} pages</span></div>
        <div class="grid">
          ${section.items.map(it => `
            <a class="card${it.built ? '' : ' soon'}" href="${it.built ? it.href : '#'}" ${it.built ? '' : 'data-soon="1"'} ${it.external ? 'target="_blank" rel="noopener"' : ''}>
              <div class="ic">${it.icon}</div>
              <div>
                <div class="nm">${it.name}${it.built ? '' : '<span class="badge">soon</span>'}</div>
                <div class="ds">${it.desc}</div>
              </div>
            </a>`).join('')}
        </div>
      `;
      // Keep panel open while hovered
      panel.addEventListener('mouseenter', () => { clearTimeout(closeTimer); });
      panel.addEventListener('mouseleave', () => scheduleClose());
      panel.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if(a && a.dataset.soon){
          e.preventDefault();
          showToast(`${a.querySelector('.nm').textContent.replace('soon','').trim()} — coming soon`);
          closeMenu();
        }
      });
      document.body.appendChild(panel);
      return panel;
    }

    function openMenu(btn){
      const key = btn.dataset.menu;
      let panel = document.querySelector(`.megapanel[data-menu="${key}"]`) || buildPanel(key);
      if(!panel) return;
      if(openPanel && openPanel !== panel){ openPanel.classList.remove('open'); }
      buttons.forEach(b => b.classList.toggle('open', b === btn));
      panel.classList.add('open');
      // Position relative to button
      const rect = btn.getBoundingClientRect();
      panel.style.left = '';
      panel.style.transform = '';
      const w = panel.offsetWidth;
      const desiredLeft = rect.left + rect.width/2 - w/2;
      const clampedLeft = Math.max(12, Math.min(window.innerWidth - w - 12, desiredLeft));
      panel.style.left = clampedLeft + 'px';
      panel.style.transform = 'translateY(0)';
      openPanel = panel;
    }

    function closeMenu(){
      if(openPanel){ openPanel.classList.remove('open'); openPanel = null; }
      buttons.forEach(b => b.classList.remove('open'));
    }
    function scheduleClose(){ clearTimeout(closeTimer); closeTimer = setTimeout(closeMenu, 140); }

    buttons.forEach(btn => {
      btn.addEventListener('mouseenter', () => { clearTimeout(closeTimer); openMenu(btn); });
      btn.addEventListener('mouseleave', () => scheduleClose());
      btn.addEventListener('click', (e) => { e.preventDefault(); openMenu(btn); });
      btn.addEventListener('focus', () => openMenu(btn));
    });
    document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeMenu(); });
    document.addEventListener('click', (e) => {
      if(!e.target.closest('.megapanel') && !e.target.closest('.nav-btn[data-menu]')) closeMenu();
    });
  }

  // ---- Command palette ----
  function setupCmdK(){
    const flat = [];
    Object.entries(PAGES).forEach(([key, sec]) => {
      sec.items.forEach(it => flat.push({ section: sec.label, ...it }));
    });

    const backdrop = document.createElement('div');
    backdrop.className = 'cmdk-backdrop';
    backdrop.innerHTML = `
      <div class="cmdk" role="dialog" aria-label="Search architecture pages">
        <div class="search">
          <span class="ic">⌕</span>
          <input type="text" placeholder="Search the architecture site…" autocomplete="off" spellcheck="false" />
          <kbd>esc</kbd>
        </div>
        <div class="list"></div>
        <div class="foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate · <kbd>↵</kbd> open</span>
          <span><kbd>⌘K</kbd> toggle</span>
        </div>
      </div>`;
    document.body.appendChild(backdrop);
    const input = backdrop.querySelector('input');
    const list = backdrop.querySelector('.list');
    const cmdk = backdrop.querySelector('.cmdk');
    let activeIndex = 0;
    let filtered = flat.slice();

    function render(){
      if(!filtered.length){ list.innerHTML = `<div class="empty">No matches.</div>`; return; }
      // Group by section
      const groups = {};
      filtered.forEach(it => { (groups[it.section] = groups[it.section] || []).push(it); });
      const html = Object.entries(groups).map(([sec, items]) => `
        <div class="group-label">${sec}</div>
        ${items.map((it, i) => {
          const globalIdx = filtered.indexOf(it);
          return `
            <a class="it${it.built ? '' : ' soon'}${globalIdx === activeIndex ? ' active' : ''}" href="${it.built ? it.href : '#'}" data-idx="${globalIdx}" ${it.built ? '' : 'data-soon="1"'} ${it.external ? 'target="_blank" rel="noopener"' : ''}>
              <div class="ic">${it.icon}</div>
              <div><div class="nm">${it.name}</div><div class="ds">${it.desc}</div></div>
              <div class="arrow">→</div>
            </a>`;
        }).join('')}
      `).join('');
      list.innerHTML = html;
    }
    function open(){ backdrop.classList.add('open'); cmdk.classList.add('open'); input.value = ''; filtered = flat.slice(); activeIndex = 0; render(); setTimeout(() => input.focus(), 40); }
    function close(){ backdrop.classList.remove('open'); cmdk.classList.remove('open'); }
    function filter(q){
      const ql = q.trim().toLowerCase();
      if(!ql){ filtered = flat.slice(); }
      else {
        filtered = flat.filter(it =>
          it.name.toLowerCase().includes(ql) ||
          it.desc.toLowerCase().includes(ql) ||
          it.section.toLowerCase().includes(ql)
        );
      }
      activeIndex = 0;
      render();
    }
    function go(it){
      if(!it) return;
      if(!it.built){ showToast(`${it.name} — coming soon`); return; }
      if(it.external) window.open(it.href, '_blank'); else window.location.href = it.href;
    }

    input.addEventListener('input', e => filter(e.target.value));
    input.addEventListener('keydown', e => {
      if(e.key === 'ArrowDown'){ e.preventDefault(); activeIndex = Math.min(filtered.length - 1, activeIndex + 1); render(); scrollActive(); }
      else if(e.key === 'ArrowUp'){ e.preventDefault(); activeIndex = Math.max(0, activeIndex - 1); render(); scrollActive(); }
      else if(e.key === 'Enter'){ e.preventDefault(); go(filtered[activeIndex]); }
      else if(e.key === 'Escape'){ e.preventDefault(); close(); }
    });
    function scrollActive(){
      const el = list.querySelector('.it.active');
      if(el) el.scrollIntoView({ block: 'nearest' });
    }
    backdrop.addEventListener('click', e => {
      if(e.target === backdrop){ close(); return; }
      const a = e.target.closest('a.it');
      if(a){
        if(a.dataset.soon){
          e.preventDefault();
          const it = filtered[parseInt(a.dataset.idx,10)];
          showToast(`${it.name} — coming soon`);
          return;
        }
        close();
      }
    });
    document.addEventListener('keydown', e => {
      if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){
        e.preventDefault();
        if(backdrop.classList.contains('open')) close(); else open();
      }
      else if(e.key === '/' && !e.target.matches('input,textarea')){
        e.preventDefault();
        if(!backdrop.classList.contains('open')) open();
      }
    });
    // Click search button
    document.querySelectorAll('[data-cmdk]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); open(); }));
  }

  // ---- Coming-soon toast ----
  let toastEl = null, toastTimer = null;
  function showToast(msg){
    if(!toastEl){
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.innerHTML = `<span class="ic">✦</span><span class="msg"></span>`;
      document.body.appendChild(toastEl);
    }
    toastEl.querySelector('.msg').textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
  }
  // Wire any element with data-soon attribute (used in inline sysmap cards too)
  function setupSoonLinks(){
    document.body.addEventListener('click', e => {
      const a = e.target.closest('a[data-soon]');
      if(a){
        e.preventDefault();
        const nm = a.dataset.name || a.querySelector('.t,.nm')?.textContent?.trim() || 'This page';
        showToast(`${nm} — coming soon`);
      }
    });
  }

  // ---- Mobile menu ----
  function setupMobileMenu(){
    const toggle = document.querySelector('.menu-toggle');
    if(!toggle) return;
    toggle.addEventListener('click', () => {
      // On mobile, fallback to cmdk
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupMegaMenu();
    setupCmdK();
    setupSoonLinks();
    setupMobileMenu();
  });
})();
