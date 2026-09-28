/**
 * PC-98 Game Catalog Application Script
 * Pure Vanilla JavaScript with zero external dependencies.
 */

(function () {
  'use strict';

  // State
  const state = {
    games: [],
    categories: {},
    publishers: [],
    years: [],
    filteredGames: [],
    
    // Active filters
    query: '',
    cat: 'ALL',
    sub: '',
    pub: '',
    year: '',
    sort: 'id_asc',
    view: 'grid', // 'grid' | 'table'
    page: 1,
    pageSize: 48,
    
    // Modal
    selectedGameIndex: -1,
    activeImgIndex: 0,
  };

  // DOM Elements
  const el = {};

  function initElements() {
    el.searchInput = document.getElementById('searchInput');
    el.clearSearch = document.getElementById('clearSearch');
    el.catTabs = document.getElementById('catTabs');
    el.subcatRow = document.getElementById('subcatRow');
    el.subcatChips = document.getElementById('subcatChips');
    el.pubSelect = document.getElementById('pubSelect');
    el.yearSelect = document.getElementById('yearSelect');
    el.sortSelect = document.getElementById('sortSelect');
    el.pageSizeSelect = document.getElementById('pageSizeSelect');
    el.btnGridView = document.getElementById('btnGridView');
    el.btnTableView = document.getElementById('btnTableView');
    el.btnResetFilters = document.getElementById('btnResetFilters');
    
    el.resultsCount = document.getElementById('resultsCount');
    el.activeFilterTags = document.getElementById('activeFilterTags');
    el.gamesContainer = document.getElementById('gamesContainer');
    el.paginationContainer = document.getElementById('paginationContainer');
    
    // Modal
    el.modalOverlay = document.getElementById('modalOverlay');
    el.modalCloseBtn = document.getElementById('modalCloseBtn');
    el.modalTitleJp = document.getElementById('modalTitleJp');
    el.modalTitleEn = document.getElementById('modalTitleEn');
    el.modalGenreBadge = document.getElementById('modalGenreBadge');
    el.modalMainImg = document.getElementById('modalMainImg');
    el.modalThumbStrip = document.getElementById('modalThumbStrip');
    el.modalSpecsGrid = document.getElementById('modalSpecsGrid');
    el.modalNoteSection = document.getElementById('modalNoteSection');
    el.modalPrevBtn = document.getElementById('modalPrevBtn');
    el.modalNextBtn = document.getElementById('modalNextBtn');
    el.modalLegacyLink = document.getElementById('modalLegacyLink');
    
    el.btnBackTop = document.getElementById('btnBackTop');
  }

  function initData() {
    if (window.PC98_DATA) {
      applyLoadedData(window.PC98_DATA);
    } else {
      // Fallback to fetch data.json
      fetch('assets/data.json')
        .then(res => res.json())
        .then(data => applyLoadedData(data))
        .catch(err => {
          console.error('Failed to load PC-98 data:', err);
          el.gamesContainer.innerHTML = '<div class="empty-state"><h3>数据加载失败</h3><p>请确保 assets/data.js 或 assets/data.json 存在。</p></div>';
        });
    }
  }

  function applyLoadedData(data) {
    state.games = data.games || [];
    state.categories = data.categories || {};
    state.publishers = data.publishers || [];
    state.years = data.years || [];

    renderCategoryTabs();
    populateSelectFilters();
    checkUrlHash();
    applyFilters();
  }

  function renderCategoryTabs() {
    const totalCount = state.games.length;
    let html = `
      <div class="cat-tab ${state.cat === 'ALL' ? 'active' : ''}" data-cat="ALL">
        <span>全部游戏</span>
        <span class="cat-tab-badge">${totalCount}</span>
      </div>
    `;

    for (const [key, meta] of Object.entries(state.categories)) {
      const count = state.games.filter(g => g.cat === key).length;
      if (count === 0) continue;
      const isActive = state.cat === key;
      html += `
        <div class="cat-tab ${isActive ? 'active' : ''}" data-cat="${key}" style="--tab-color: ${meta.badge}">
          <span>${meta.name_ja}</span>
          <span class="cat-tab-badge">${count}</span>
        </div>
      `;
    }

    el.catTabs.innerHTML = html;
  }

  // Canonical order for subcategories (50-sound Gojuon and original catalog classification)
  const SUBCATEGORY_ORDER = {
    'AVG': ['あ行', 'か行', 'さ行', 'た行', 'な行', 'は行', 'ま行', 'や行', 'ら行', 'わ行', 'その他'],
    'RPG': ['あ~た行', 'な~わ行', '3D', 'アクションRPG'],
    'SLG': ['戦術級', '戦略級', 'リアルタイム', '育成', 'その他'],
    'TBL': ['麻雀', 'カードゲーム', 'その他']
  };

  function sortSubcategories(cat, list) {
    const canonical = SUBCATEGORY_ORDER[cat];
    return list.slice().sort((a, b) => {
      if (canonical) {
        const idxA = canonical.indexOf(a);
        const idxB = canonical.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
      }
      if (a === 'その他') return 1;
      if (b === 'その他') return -1;
      return a.localeCompare(b, 'ja');
    });
  }

  function updateSubcategories() {
    if (state.cat === 'ALL') {
      el.subcatRow.style.display = 'none';
      return;
    }

    // Find all distinct subcategories for current category
    const subcats = new Set();
    state.games.forEach(g => {
      if (g.cat === state.cat && g.sub) {
        subcats.add(g.sub);
      }
    });

    if (subcats.size <= 1) {
      el.subcatRow.style.display = 'none';
      return;
    }

    el.subcatRow.style.display = 'flex';
    let chipsHtml = `
      <div class="subcat-chip ${!state.sub ? 'active' : ''}" data-sub="">全部</div>
    `;

    const sortedSubcats = sortSubcategories(state.cat, Array.from(subcats));

    sortedSubcats.forEach(sub => {
      const count = state.games.filter(g => g.cat === state.cat && g.sub === sub).length;
      chipsHtml += `
        <div class="subcat-chip ${state.sub === sub ? 'active' : ''}" data-sub="${sub}">
          ${sub} (${count})
        </div>
      `;
    });

    el.subcatChips.innerHTML = chipsHtml;
  }

  function populateSelectFilters() {
    // Publishers
    let pubHtml = '<option value="">全部发行商 (' + state.publishers.length + ')</option>';
    state.publishers.forEach(pub => {
      const count = state.games.filter(g => g.pub === pub).length;
      pubHtml += `<option value="${pub}">${pub} (${count})</option>`;
    });
    el.pubSelect.innerHTML = pubHtml;

    // Years
    let yearHtml = '<option value="">全部发售年份</option>';
    state.years.forEach(yr => {
      const count = state.games.filter(g => g.year === yr).length;
      yearHtml += `<option value="${yr}">${yr} 年 (${count})</option>`;
    });
    el.yearSelect.innerHTML = yearHtml;
  }

  // Filter & Search Pipeline
  function applyFilters() {
    const q = state.query.toLowerCase().trim();
    
    state.filteredGames = state.games.filter(g => {
      // Category filter
      if (state.cat !== 'ALL' && g.cat !== state.cat) {
        return false;
      }

      // Subcategory filter
      if (state.sub && g.sub !== state.sub) {
        return false;
      }

      // Publisher filter
      if (state.pub && g.pub !== state.pub) {
        return false;
      }

      // Year filter
      if (state.year && g.year !== state.year) {
        return false;
      }

      // Full text search query
      if (q) {
        const matchTitleJp = g.jp && g.jp.toLowerCase().includes(q);
        const matchTitleEn = g.en && g.en.toLowerCase().includes(q);
        const matchPub = g.pub && g.pub.toLowerCase().includes(q);
        const matchYear = g.year && g.year.includes(q);
        const matchId = g.id && g.id.includes(q);
        const matchSub = g.sub && g.sub.toLowerCase().includes(q);
        if (!matchTitleJp && !matchTitleEn && !matchPub && !matchYear && !matchId && !matchSub) {
          return false;
        }
      }

      return true;
    });

    // Sort
    sortFilteredGames();

    // Reset page if out of bounds
    const totalPages = state.pageSize === 'all' ? 1 : Math.ceil(state.filteredGames.length / state.pageSize);
    if (state.page > totalPages) {
      state.page = Math.max(1, totalPages);
    }

    renderActiveFilterSummary();
    renderContent();
    renderPagination();
  }

  function sortFilteredGames() {
    const sort = state.sort;
    state.filteredGames.sort((a, b) => {
      if (sort === 'id_asc') {
        return parseInt(a.id, 10) - parseInt(b.id, 10);
      }
      if (sort === 'id_desc') {
        return parseInt(b.id, 10) - parseInt(a.id, 10);
      }
      if (sort === 'year_desc') {
        const yA = parseInt(a.year, 10) || 0;
        const yB = parseInt(b.year, 10) || 0;
        return yB - yA || parseInt(a.id, 10) - parseInt(b.id, 10);
      }
      if (sort === 'year_asc') {
        const yA = parseInt(a.year, 10) || 9999;
        const yB = parseInt(b.year, 10) || 9999;
        return yA - yB || parseInt(a.id, 10) - parseInt(b.id, 10);
      }
      if (sort === 'title_asc') {
        return (a.jp || '').localeCompare(b.jp || '', 'ja');
      }
      return 0;
    });
  }

  function renderActiveFilterSummary() {
    const count = state.filteredGames.length;
    el.resultsCount.innerHTML = `找到 <b>${count}</b> 款游戏 (共 ${state.games.length} 款)`;

    let tagsHtml = '';
    if (state.query) {
      tagsHtml += `<span class="filter-tag">关键词: "${escapeHtml(state.query)}" <span class="filter-tag-remove" data-clear="query">&times;</span></span>`;
    }
    if (state.cat !== 'ALL') {
      const catName = state.categories[state.cat]?.name_ja || state.cat;
      tagsHtml += `<span class="filter-tag">分类: ${catName} <span class="filter-tag-remove" data-clear="cat">&times;</span></span>`;
    }
    if (state.sub) {
      tagsHtml += `<span class="filter-tag">子分类: ${state.sub} <span class="filter-tag-remove" data-clear="sub">&times;</span></span>`;
    }
    if (state.pub) {
      tagsHtml += `<span class="filter-tag">发行商: ${state.pub} <span class="filter-tag-remove" data-clear="pub">&times;</span></span>`;
    }
    if (state.year) {
      tagsHtml += `<span class="filter-tag">年份: ${state.year} <span class="filter-tag-remove" data-clear="year">&times;</span></span>`;
    }

    el.activeFilterTags.innerHTML = tagsHtml;
    el.btnResetFilters.style.display = (state.query || state.cat !== 'ALL' || state.sub || state.pub || state.year) ? 'inline-block' : 'none';
  }

  function renderContent() {
    const total = state.filteredGames.length;
    if (total === 0) {
      el.gamesContainer.innerHTML = `
        <div class="empty-state">
          <h3>未找到匹配的游戏</h3>
          <p>尝试更换关键词或清除筛选条件查看全部游戏。</p>
        </div>
      `;
      return;
    }

    // Pagination slice
    let displayList = state.filteredGames;
    if (state.pageSize !== 'all') {
      const start = (state.page - 1) * state.pageSize;
      displayList = state.filteredGames.slice(start, start + state.pageSize);
    }

    if (state.view === 'grid') {
      renderGridView(displayList);
    } else {
      renderTableView(displayList);
    }
  }

  function renderGridView(games) {
    let html = '<div class="games-grid">';
    
    games.forEach((g) => {
      const catMeta = state.categories[g.cat] || { name_ja: g.cat, badge: '#64748b' };
      const hasThumb = g.imgs && g.imgs.length > 0;
      const thumbSrc = hasThumb ? `PC98/pc98/jpg/${g.imgs[0]}` : '';
      const imgCount = g.imgs ? g.imgs.length : 0;
      
      html += `
        <div class="game-card" data-gid="${g.id}">
          <div class="card-thumb-wrapper">
            <span class="card-genre-badge" style="background: ${catMeta.badge}">${catMeta.name_ja}</span>
            ${hasThumb 
              ? `<img class="card-thumb" src="${thumbSrc}" alt="${escapeHtml(g.jp)}" loading="lazy">`
              : `<div class="no-screenshot-placeholder"><span>NO SCREENSHOT</span><span>未收录截图</span></div>`}
            ${imgCount > 1 ? `<span class="card-img-count">${imgCount}P</span>` : ''}
          </div>
          <div class="card-body">
            <div class="card-title-jp" title="${escapeHtml(g.jp)}">${escapeHtml(g.jp)}</div>
            ${g.en ? `<div class="card-title-en" title="${escapeHtml(g.en)}">${escapeHtml(g.en)}</div>` : ''}
            <div class="card-meta-row">
              <span class="card-publisher" title="${escapeHtml(g.pub || '未知发行商')}">${escapeHtml(g.pub || '—')}</span>
              <span class="card-year-tag">${g.year ? g.year : '—'}</span>
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    el.gamesContainer.innerHTML = html;
  }

  function renderTableView(games) {
    let html = `
      <div class="table-view-container">
        <table class="games-table">
          <thead>
            <tr>
              <th width="60">序号</th>
              <th width="70">预览</th>
              <th>游戏名称</th>
              <th width="140">类型</th>
              <th width="160">发行商</th>
              <th width="70">年份</th>
              <th width="90">介质</th>
              <th width="90">平台</th>
            </tr>
          </thead>
          <tbody>
    `;

    games.forEach(g => {
      const catMeta = state.categories[g.cat] || { name_ja: g.cat, badge: '#64748b' };
      const hasThumb = g.imgs && g.imgs.length > 0;
      const thumbSrc = hasThumb ? `PC98/pc98/jpg/${g.imgs[0]}` : '';
      const genreLabel = g.sub ? `${catMeta.name_ja} (${g.sub})` : catMeta.name_ja;

      html += `
        <tr data-gid="${g.id}">
          <td class="table-id">#${g.id}</td>
          <td>
            ${hasThumb 
              ? `<img class="table-thumb" src="${thumbSrc}" alt="${escapeHtml(g.jp)}" loading="lazy">` 
              : `<div class="table-thumb no-screenshot-placeholder" style="font-size:9px;">无图</div>`}
          </td>
          <td class="table-title-cell">
            <strong>${escapeHtml(g.jp)}</strong>
            ${g.en ? `<span>${escapeHtml(g.en)}</span>` : ''}
          </td>
          <td><span style="color: ${catMeta.badge}; font-weight: 600;">${genreLabel}</span></td>
          <td>${escapeHtml(g.pub || '—')}</td>
          <td style="font-family: var(--font-mono); color: var(--pc98-amber);">${g.year || '—'}</td>
          <td style="font-size: 12px; color: var(--text-dim);">${escapeHtml(g.media || '—')}</td>
          <td style="font-size: 12px; color: var(--text-dim);">${escapeHtml(g.plat || 'PC-9801')}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    el.gamesContainer.innerHTML = html;
  }

  function renderPagination() {
    if (state.pageSize === 'all') {
      el.paginationContainer.innerHTML = '';
      return;
    }

    const totalPages = Math.ceil(state.filteredGames.length / state.pageSize);
    if (totalPages <= 1) {
      el.paginationContainer.innerHTML = '';
      return;
    }

    const cur = state.page;
    let html = '';

    // First & Prev
    html += `<button class="page-btn" ${cur === 1 ? 'disabled' : ''} data-page="1">&laquo;</button>`;
    html += `<button class="page-btn" ${cur === 1 ? 'disabled' : ''} data-page="${cur - 1}">&lsaquo;</button>`;

    // Page numbers with ellipses
    const range = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= cur - 2 && i <= cur + 2)) {
        range.push(i);
      }
    }

    let last = 0;
    range.forEach(p => {
      if (last && p - last > 1) {
        html += `<span style="padding: 0 4px; color: var(--text-dim);">...</span>`;
      }
      html += `<button class="page-btn ${p === cur ? 'active' : ''}" data-page="${p}">${p}</button>`;
      last = p;
    });

    // Next & Last
    html += `<button class="page-btn" ${cur === totalPages ? 'disabled' : ''} data-page="${cur + 1}">&rsaquo;</button>`;
    html += `<button class="page-btn" ${cur === totalPages ? 'disabled' : ''} data-page="${totalPages}">&raquo;</button>`;

    el.paginationContainer.innerHTML = html;
  }

  // Modal Dialog
  function openModal(gid) {
    const idx = state.filteredGames.findIndex(g => g.id === gid);
    if (idx === -1) return;

    state.selectedGameIndex = idx;
    state.activeImgIndex = 0;
    renderModalGame();

    el.modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    history.replaceState(null, null, `#game=${gid}`);
  }

  function closeModal() {
    el.modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
    state.selectedGameIndex = -1;
    history.replaceState(null, null, ' ');
  }

  function renderModalGame() {
    const g = state.filteredGames[state.selectedGameIndex];
    if (!g) return;

    const catMeta = state.categories[g.cat] || { name_ja: g.cat, badge: '#64748b' };

    el.modalTitleJp.textContent = g.jp;
    el.modalTitleEn.textContent = g.en || '';
    el.modalGenreBadge.textContent = g.sub ? `${catMeta.name_ja}・${g.sub}` : catMeta.name_ja;
    el.modalGenreBadge.style.background = catMeta.badge;

    // Screenshots
    if (g.imgs && g.imgs.length > 0) {
      const curImg = g.imgs[state.activeImgIndex] || g.imgs[0];
      el.modalMainImg.src = `PC98/pc98/jpg/${curImg}`;
      el.modalMainImg.style.display = 'block';

      let stripHtml = '';
      g.imgs.forEach((img, i) => {
        stripHtml += `
          <div class="modal-thumb-item ${i === state.activeImgIndex ? 'active' : ''}" data-img-idx="${i}">
            <img src="PC98/pc98/jpg/${img}" alt="Preview ${i + 1}">
          </div>
        `;
      });
      el.modalThumbStrip.innerHTML = stripHtml;
      el.modalThumbStrip.style.display = g.imgs.length > 1 ? 'flex' : 'none';
    } else {
      el.modalMainImg.style.display = 'none';
      el.modalThumbStrip.innerHTML = '';
      el.modalThumbStrip.style.display = 'none';
    }

    // Specs
    el.modalSpecsGrid.innerHTML = `
      <div class="spec-item">
        <span class="spec-label">编号 (Catalog ID)</span>
        <span class="spec-value" style="font-family: var(--font-mono); color: var(--pc98-green);">#${g.id}</span>
      </div>
      <div class="spec-item">
        <span class="spec-label">对应机种 (Platform)</span>
        <span class="spec-value">${escapeHtml(g.plat || 'PC-9801')}</span>
      </div>
      <div class="spec-item">
        <span class="spec-label">发售年份 (Year)</span>
        <span class="spec-value" style="color: var(--pc98-amber);">${g.year ? g.year + ' 年' : '—'}</span>
      </div>
      <div class="spec-item">
        <span class="spec-label">软件发行商 (Publisher)</span>
        <span class="spec-value">${escapeHtml(g.pub || '—')}</span>
      </div>
      <div class="spec-item">
        <span class="spec-label">媒体介质 (Media)</span>
        <span class="spec-value">${escapeHtml(g.media || '—')}</span>
      </div>
      <div class="spec-item">
        <span class="spec-label">游戏类型 (Genre)</span>
        <span class="spec-value">${catMeta.name_ja} ${g.sub ? `(${g.sub})` : ''}</span>
      </div>
    `;

    // Notes & Reviews
    let noteHtml = '';
    if (g.rev) {
      noteHtml += `
        <div class="modal-note-box">
          <h4>Review / 简评</h4>
          <div>${g.rev}</div>
        </div>
      `;
    }
    if (g.note) {
      noteHtml += `
        <div class="modal-note-box">
          <h4>Note / 攻略与操作说明</h4>
          <div>${g.note}</div>
        </div>
      `;
    }
    el.modalNoteSection.innerHTML = noteHtml;

    // Navigation buttons
    el.modalPrevBtn.disabled = state.selectedGameIndex <= 0;
    el.modalNextBtn.disabled = state.selectedGameIndex >= state.filteredGames.length - 1;

    // Legacy link
    el.modalLegacyLink.href = `PC98/pc98/${g.id}.html`;
  }

  function modalNext() {
    if (state.selectedGameIndex < state.filteredGames.length - 1) {
      state.selectedGameIndex++;
      state.activeImgIndex = 0;
      renderModalGame();
      const nextGame = state.filteredGames[state.selectedGameIndex];
      history.replaceState(null, null, `#game=${nextGame.id}`);
    }
  }

  function modalPrev() {
    if (state.selectedGameIndex > 0) {
      state.selectedGameIndex--;
      state.activeImgIndex = 0;
      renderModalGame();
      const prevGame = state.filteredGames[state.selectedGameIndex];
      history.replaceState(null, null, `#game=${prevGame.id}`);
    }
  }

  function checkUrlHash() {
    const hash = window.location.hash;
    const match = hash.match(/#game=(\d+)/);
    if (match) {
      const gid = match[1];
      setTimeout(() => openModal(gid), 100);
    }
  }

  // Utilities
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Event Listeners
  function bindEvents() {
    // Search input
    el.searchInput.addEventListener('input', debounce(e => {
      state.query = e.target.value;
      state.page = 1;
      el.clearSearch.style.display = state.query ? 'block' : 'none';
      applyFilters();
    }, 200));

    el.clearSearch.addEventListener('click', () => {
      el.searchInput.value = '';
      state.query = '';
      state.page = 1;
      el.clearSearch.style.display = 'none';
      applyFilters();
    });

    // Category tabs
    el.catTabs.addEventListener('click', e => {
      const tab = e.target.closest('.cat-tab');
      if (!tab) return;
      const cat = tab.dataset.cat;
      state.cat = cat;
      state.sub = '';
      state.page = 1;
      
      document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      updateSubcategories();
      applyFilters();
    });

    // Subcategory chips
    el.subcatChips.addEventListener('click', e => {
      const chip = e.target.closest('.subcat-chip');
      if (!chip) return;
      const sub = chip.dataset.sub;
      state.sub = sub;
      state.page = 1;

      document.querySelectorAll('.subcat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      applyFilters();
    });

    // Select filters
    el.pubSelect.addEventListener('change', e => {
      state.pub = e.target.value;
      state.page = 1;
      applyFilters();
    });

    el.yearSelect.addEventListener('change', e => {
      state.year = e.target.value;
      state.page = 1;
      applyFilters();
    });

    el.sortSelect.addEventListener('change', e => {
      state.sort = e.target.value;
      state.page = 1;
      applyFilters();
    });

    el.pageSizeSelect.addEventListener('change', e => {
      const val = e.target.value;
      state.pageSize = val === 'all' ? 'all' : parseInt(val, 10);
      state.page = 1;
      applyFilters();
    });

    // View toggles
    el.btnGridView.addEventListener('click', () => {
      state.view = 'grid';
      el.btnGridView.classList.add('active');
      el.btnTableView.classList.remove('active');
      renderContent();
    });

    el.btnTableView.addEventListener('click', () => {
      state.view = 'table';
      el.btnTableView.classList.add('active');
      el.btnGridView.classList.remove('active');
      renderContent();
    });

    // Reset filters button
    el.btnResetFilters.addEventListener('click', () => {
      state.query = '';
      state.cat = 'ALL';
      state.sub = '';
      state.pub = '';
      state.year = '';
      state.page = 1;

      el.searchInput.value = '';
      el.clearSearch.style.display = 'none';
      el.pubSelect.value = '';
      el.yearSelect.value = '';
      
      document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      const allTab = document.querySelector('.cat-tab[data-cat="ALL"]');
      if (allTab) allTab.classList.add('active');

      updateSubcategories();
      applyFilters();
    });

    // Active filter tags removal
    el.activeFilterTags.addEventListener('click', e => {
      const removeBtn = e.target.closest('.filter-tag-remove');
      if (!removeBtn) return;
      const type = removeBtn.dataset.clear;
      if (type === 'query') {
        state.query = '';
        el.searchInput.value = '';
        el.clearSearch.style.display = 'none';
      } else if (type === 'cat') {
        state.cat = 'ALL';
        state.sub = '';
        document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
        const allTab = document.querySelector('.cat-tab[data-cat="ALL"]');
        if (allTab) allTab.classList.add('active');
        updateSubcategories();
      } else if (type === 'sub') {
        state.sub = '';
        document.querySelectorAll('.subcat-chip').forEach(c => c.classList.remove('active'));
        const allChip = document.querySelector('.subcat-chip[data-sub=""]');
        if (allChip) allChip.classList.add('active');
      } else if (type === 'pub') {
        state.pub = '';
        el.pubSelect.value = '';
      } else if (type === 'year') {
        state.year = '';
        el.yearSelect.value = '';
      }
      state.page = 1;
      applyFilters();
    });

    // Pagination buttons
    el.paginationContainer.addEventListener('click', e => {
      const btn = e.target.closest('.page-btn');
      if (!btn || btn.disabled) return;
      const page = parseInt(btn.dataset.page, 10);
      if (page && page !== state.page) {
        state.page = page;
        renderContent();
        renderPagination();
        window.scrollTo({ top: 120, behavior: 'smooth' });
      }
    });

    // Game click (delegated)
    el.gamesContainer.addEventListener('click', e => {
      const card = e.target.closest('.game-card, tr[data-gid]');
      if (!card) return;
      const gid = card.dataset.gid;
      if (gid) openModal(gid);
    });

    // Modal navigation & interactions
    el.modalCloseBtn.addEventListener('click', closeModal);
    el.modalOverlay.addEventListener('click', e => {
      if (e.target === el.modalOverlay) closeModal();
    });

    el.modalThumbStrip.addEventListener('click', e => {
      const thumb = e.target.closest('.modal-thumb-item');
      if (!thumb) return;
      state.activeImgIndex = parseInt(thumb.dataset.imgIdx, 10);
      renderModalGame();
    });

    el.modalPrevBtn.addEventListener('click', modalPrev);
    el.modalNextBtn.addEventListener('click', modalNext);

    // Keyboard navigation
    window.addEventListener('keydown', e => {
      if (el.modalOverlay.classList.contains('open')) {
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowLeft') modalPrev();
        if (e.key === 'ArrowRight') modalNext();
      } else {
        if (e.key === '/' && document.activeElement !== el.searchInput) {
          e.preventDefault();
          el.searchInput.focus();
        }
      }
    });

    // Back to top button
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        el.btnBackTop.classList.add('show');
      } else {
        el.btnBackTop.classList.remove('show');
      }
    });

    el.btnBackTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    initElements();
    bindEvents();
    initData();
  });
})();
