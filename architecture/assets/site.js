// BawtHub Architecture — shared client JS (v3: no mega-menu)
// Cmd-K palette + coming-soon toast + section-rail active highlighting.

(function(){
  'use strict';

  // ---- Site index (single source of truth for cmdk + rails) ----
  const PAGES = {
    overview: {
      label: 'Overview', icon: '◧',
      items: [
        { href: '/architecture/', icon: '✦', name: 'System map', desc: 'The whole stack on one page.', built: true },
        { href: '/story.html',    icon: '✍', name: 'The story',  desc: 'How a CLI grew into a multi-bot platform.', built: true },
        { href: '/',              icon: '⌂', name: 'Home',       desc: 'Back to the bawthub.com landing page.', built: true },
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
        { href: '/architecture/bawthub/chat.html',     icon: '💬', name: 'Chat surface',       desc: 'How tool calls render. Diffs, parsed commands, MCP pills.', built: true },
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

  // ---- Cmd-K command palette ----
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
      const groups = {};
      filtered.forEach(it => { (groups[it.section] = groups[it.section] || []).push(it); });
      const html = Object.entries(groups).map(([sec, items]) => `
        <div class="group-label">${sec}</div>
        ${items.map(it => {
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
    function scrollActive(){
      const el = list.querySelector('.it.active');
      if(el) el.scrollIntoView({ block: 'nearest' });
    }

    input.addEventListener('input', e => filter(e.target.value));
    input.addEventListener('keydown', e => {
      if(e.key === 'ArrowDown'){ e.preventDefault(); activeIndex = Math.min(filtered.length - 1, activeIndex + 1); render(); scrollActive(); }
      else if(e.key === 'ArrowUp'){ e.preventDefault(); activeIndex = Math.max(0, activeIndex - 1); render(); scrollActive(); }
      else if(e.key === 'Enter'){ e.preventDefault(); go(filtered[activeIndex]); }
      else if(e.key === 'Escape'){ e.preventDefault(); close(); }
    });
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
    document.querySelectorAll('[data-cmdk]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); open(); }));
  }

  // ---- Section accent colors ----
  const SECTION_COLORS = {
    overview:    '#4fd1ff',
    'llm-bawt':  '#8b5cf6',
    bawthub:     '#4fd1ff',
    agents:      '#ff63d8',
    more:        '#ffd24f',
  };

  // ---- Detect current section from URL ----
  function currentSectionKey(path){
    if(path === '/architecture/' || path === '/architecture/index.html') return null; // system map = no rail
    if(path.startsWith('/architecture/llm-bawt/')) return 'llm-bawt';
    if(path.startsWith('/architecture/bawthub/'))  return 'bawthub';
    if(path.startsWith('/architecture/agents/'))   return 'agents';
    if(path.startsWith('/architecture/streaming/') ||
       path.startsWith('/architecture/data/') ||
       path.startsWith('/architecture/deployment/')) return 'more';
    return null;
  }

  function pageInSection(sectionKey, path){
    const section = PAGES[sectionKey];
    if(!section) return -1;
    return section.items.findIndex(it => {
      // normalize trailing slashes
      const hrefNorm = it.href.replace(/\/$/, '');
      const pathNorm = path.replace(/\/$/, '').replace(/\/index\.html$/, '');
      return hrefNorm === pathNorm;
    });
  }

  // ---- Auto-render breadcrumb pill in topbar ----
  function setupBreadcrumb(){
    const slot = document.querySelector('[data-bcrumb]');
    if(!slot) return;
    const path = window.location.pathname;
    const sectionKey = currentSectionKey(path);
    if(!sectionKey){
      slot.outerHTML = `<a class="bcrumb" href="/architecture/" style="--accent:#4fd1ff"><span class="crumb-section">Architecture</span></a>`;
      return;
    }
    const section = PAGES[sectionKey];
    const idx = pageInSection(sectionKey, path);
    const here = idx >= 0 ? section.items[idx].name : 'Page';
    const accent = SECTION_COLORS[sectionKey] || '#4fd1ff';
    slot.outerHTML = `<a class="bcrumb" href="/architecture/" style="--accent:${accent}">
      <span class="crumb-section">${section.label}</span>
      <span class="crumb-sep">/</span>
      <span class="crumb-here">${here}</span>
    </a>`;
  }

  // ---- Auto-render section rail ----
  function setupRail(){
    const slot = document.querySelector('[data-rail]');
    if(!slot) return;
    const path = window.location.pathname;
    const sectionKey = currentSectionKey(path);
    if(!sectionKey){ slot.remove(); return; }
    const section = PAGES[sectionKey];
    const idx = pageInSection(sectionKey, path);
    const accent = SECTION_COLORS[sectionKey] || '#4fd1ff';
    const items = section.items.map((it, i) => {
      const active = (i === idx) ? ' active' : '';
      const soon = it.built ? '' : ' soon';
      const dataSoon = it.built ? '' : 'data-soon="1"';
      const num = String(i+1).padStart(2,'0');
      return `<a class="r-item${active}${soon}" href="${it.built ? it.href : '#'}" ${dataSoon}>
        <span class="r-num">${num}</span>${it.name}
      </a>`;
    }).join('');
    slot.outerHTML = `<nav class="rail">
      <div class="rail-inner" style="--accent:${accent}">
        <span class="rail-label">${section.label}</span>
        ${items}
        <div class="rail-jump">
          <a href="/architecture/">System map</a>
        </div>
      </div>
    </nav>`;

    // After insertion, scroll active into view
    requestAnimationFrame(() => {
      const inner = document.querySelector('.rail-inner');
      if(!inner) return;
      const active = inner.querySelector('.r-item.active');
      if(active){
        const target = active.offsetLeft - inner.offsetWidth/2 + active.offsetWidth/2;
        inner.scrollTo({ left: Math.max(0, target), behavior: 'instant' in inner.scrollTo ? 'instant' : 'auto' });
      }
    });
  }

  // ---- Tool-call expand/collapse on the chat page ----
  function setupToolCalls(){
    document.body.addEventListener('click', e => {
      const head = e.target.closest('.tc-head');
      if(head){
        const tc = head.closest('.tc');
        if(tc) tc.classList.toggle('collapsed');
      }
    });
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

  document.addEventListener('DOMContentLoaded', () => {
    setupBreadcrumb();
    setupRail();
    setupCmdK();
    setupSoonLinks();
    setupToolCalls();
  });
})();
