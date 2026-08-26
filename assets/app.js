/* ============================================================
   N8N MARKETING — 講座一覧のフロントエンド
   データ定義 → 描画 → 絞り込み / 並び替え / 検索 / ページ送り
   ============================================================ */

/* ---------- アイコン ---------- */
const ICONS = {
  home:     '<path d="M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1h-3.5v-4.5h-5V17H4a1 1 0 0 1-1-1z"/>',
  book:     '<path d="M4 4h5a2 2 0 0 1 2 2v10a2 2 0 0 0-2-2H4z"/><path d="M16 4h-5a2 2 0 0 0-2 2v10a2 2 0 0 1 2-2h5z"/>',
  play:     '<circle cx="10" cy="10" r="7"/><path d="M8.5 7.2 13 10l-4.5 2.8z"/>',
  bookmark: '<path d="M6 3.5h8v13l-4-3-4 3z"/>',
  gift:     '<path d="M3.5 8.5h13V16a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z"/><path d="M2.8 5.5h14.4v3H2.8zM10 5.5V17"/>',
  users:    '<circle cx="7.5" cy="8" r="2.6"/><path d="M3 16c.6-2.6 2.4-4 4.5-4s3.9 1.4 4.5 4"/><circle cx="14" cy="7.5" r="2"/><path d="M13 12c2 0 3.4 1.3 4 3.4"/>',
  life:     '<circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="2.8"/><path d="m5 5 3 3m4 4 3 3m0-10-3 3m-4 4-3 3"/>',
  search:   '<circle cx="9" cy="9" r="5.2"/><path d="m13 13 4 4"/>',
  history:  '<path d="M10 5.5V10l3 1.8"/><circle cx="10" cy="10" r="7"/>',
  chevron:  '<path d="m5 8 5 5 5-5"/>',
  check:    '<path d="m4.5 10.5 3.5 3.5 7.5-8"/>',
  clock:    '<circle cx="10" cy="10" r="7"/><path d="M10 6v4.2l2.8 1.6"/>',
  edit:     '<path d="m4 16 .8-3.2 8-8 2.4 2.4-8 8z"/><path d="M12.8 4.8 15.2 7.2"/>',
  arrow:    '<path d="M4 10h11m-4-4 4 4-4 4"/>',
  lesson:   '<rect x="3.5" y="4.5" width="13" height="11" rx="1.6"/><path d="M3.5 8h13M8 8v7.5"/>',
  prev:     '<path d="m12 5-5 5 5 5"/>',
  next:     '<path d="m8 5 5 5-5 5"/>'
};

function paintIcons(root = document) {
  root.querySelectorAll('i[data-icon]').forEach(el => {
    const path = ICONS[el.dataset.icon];
    if (!path) return;
    el.innerHTML =
      `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block">${path}</svg>`;
    el.style.display = 'inline-block';
  });
}

/* ---------- サムネイルのアートワーク ---------- */
const ART = {
  desk:     { from: '#1d2a3f', to: '#0a1220', motif: g => `
    <rect x="${g(58)}" y="46" width="86" height="52" rx="4" fill="none" stroke="#d9b45b" stroke-width="1.4" opacity=".9"/>
    <rect x="${g(66)}" y="54" width="70" height="28" rx="2" fill="#d9b45b" opacity=".18"/>
    <rect x="${g(160)}" y="60" width="52" height="38" rx="4" fill="none" stroke="#9fb4d4" stroke-width="1.2" opacity=".7"/>
    <path d="M${g(40)} 104h180" stroke="#d9b45b" stroke-width="1" opacity=".35"/>` },
  chess:    { from: '#2a2417', to: '#0b0f18', motif: g => `
    <path d="M${g(96)} 96V70c-8-4-8-14 0-18-4-6 2-12 8-12s10 6 8 12c8 4 8 14 0 18v26z" fill="#e6d3a3" opacity=".85"/>
    <path d="M${g(150)} 96V74c-10-4-10-16 0-20l-4-12h20l-4 12c10 4 10 16 0 20v22z" fill="#8fa2bd" opacity=".5"/>
    <rect x="${g(70)}" y="96" width="110" height="6" rx="2" fill="#d9b45b" opacity=".5"/>` },
  gears:    { from: '#232b38', to: '#080d16', motif: g => `
    <circle cx="${g(105)}" cy="66" r="26" fill="none" stroke="#cfd8e6" stroke-width="6" opacity=".55"/>
    <circle cx="${g(105)}" cy="66" r="9" fill="#d9b45b" opacity=".7"/>
    <circle cx="${g(150)}" cy="94" r="18" fill="none" stroke="#cfd8e6" stroke-width="5" opacity=".4"/>
    <circle cx="${g(66)}" cy="98" r="13" fill="none" stroke="#d9b45b" stroke-width="4" opacity=".6"/>` },
  mail:     { from: '#16213a', to: '#070d18', motif: g => `
    <rect x="${g(80)}" y="46" width="104" height="62" rx="6" fill="none" stroke="#f2d992" stroke-width="2"/>
    <path d="M${g(80)} 52l52 38 52-38" fill="none" stroke="#f2d992" stroke-width="2" opacity=".8"/>
    <path d="M${g(20)} 40h44M${g(200)} 116h44M${g(30)} 120h30" stroke="#d9b45b" stroke-width="1" opacity=".35"/>` },
  chart:    { from: '#132038', to: '#070d18', motif: g => `
    <path d="M${g(40)} 104 ${g(80)} 78 ${g(112)} 88 ${g(148)} 56 ${g(184)} 68 ${g(224)} 38"
          fill="none" stroke="#f2d992" stroke-width="2.4" stroke-linejoin="round"/>
    <g fill="#f2d992">
      <circle cx="${g(80)}" cy="78" r="3"/><circle cx="${g(148)}" cy="56" r="3"/><circle cx="${g(224)}" cy="38" r="3"/>
    </g>
    <path d="M${g(30)} 116h204" stroke="#9fb4d4" stroke-width="1" opacity=".35"/>` },
  template: { from: '#1b2637', to: '#080e19', motif: g => `
    <rect x="${g(52)}" y="40" width="70" height="70" rx="5" fill="none" stroke="#cfd8e6" stroke-width="1.4" opacity=".6"/>
    <rect x="${g(58)}" y="46" width="58" height="16" rx="2" fill="#d9b45b" opacity=".45"/>
    <rect x="${g(58)}" y="68" width="58" height="4" rx="2" fill="#cfd8e6" opacity=".35"/>
    <rect x="${g(58)}" y="78" width="40" height="4" rx="2" fill="#cfd8e6" opacity=".25"/>
    <rect x="${g(136)}" y="40" width="70" height="70" rx="5" fill="none" stroke="#d9b45b" stroke-width="1.4" opacity=".8"/>
    <rect x="${g(142)}" y="60" width="58" height="4" rx="2" fill="#cfd8e6" opacity=".3"/>
    <rect x="${g(142)}" y="70" width="46" height="4" rx="2" fill="#cfd8e6" opacity=".2"/>` },
  network:  { from: '#101d33', to: '#070d18', motif: g => `
    <g stroke="#d9b45b" stroke-width="1" opacity=".5" fill="none">
      <path d="M${g(66)} 92 ${g(132)} 52 ${g(198)} 92 ${g(132)} 108Z"/>
      <path d="M${g(132)} 52v56M${g(66)} 92h132"/>
    </g>
    <g fill="#f2d992">
      <circle cx="${g(132)}" cy="52" r="5"/><circle cx="${g(66)}" cy="92" r="4"/>
      <circle cx="${g(198)}" cy="92" r="4"/><circle cx="${g(132)}" cy="108" r="4"/>
    </g>` },
  rocket:   { from: '#2a1e14', to: '#0a0f1a', motif: g => `
    <path d="M${g(132)} 34c16 12 22 30 20 50l-14 10h-12l-14-10c-2-20 4-38 20-50z" fill="#e6d3a3" opacity=".9"/>
    <circle cx="${g(132)}" cy="62" r="7" fill="#0a0f1a"/>
    <path d="M${g(112)} 84 ${g(98)} 100h20zM${g(152)} 84 ${g(166)} 100h-20z" fill="#d9b45b" opacity=".8"/>
    <path d="M${g(132)} 96c6 10 6 20 0 28-6-8-6-18 0-28z" fill="#f2d992" opacity=".55"/>` },
  workflow: { from: '#101b2e', to: '#070d18', motif: g => `
    <g fill="none" stroke="#d9b45b" stroke-width="1.4" opacity=".7">
      <rect x="${g(44)}" y="60" width="44" height="26" rx="6"/>
      <rect x="${g(110)}" y="38" width="44" height="26" rx="6"/>
      <rect x="${g(110)}" y="86" width="44" height="26" rx="6"/>
      <rect x="${g(176)}" y="60" width="44" height="26" rx="6"/>
      <path d="M${g(88)} 73h10c8 0 6-22 12-22M${g(88)} 73h10c8 0 6 26 12 26M${g(154)} 51h10c8 0 6 22 12 22M${g(154)} 99h10c8 0 6-26 12-26"/>
    </g>
    <g fill="#f2d992"><circle cx="${g(66)}" cy="73" r="3"/><circle cx="${g(198)}" cy="73" r="3"/></g>` },
  scale:    { from: '#182338', to: '#070d18', motif: g => `
    <g fill="#d9b45b" opacity=".65">
      <rect x="${g(58)}" y="86" width="26" height="26" rx="3"/>
      <rect x="${g(96)}" y="70" width="26" height="42" rx="3"/>
      <rect x="${g(134)}" y="54" width="26" height="58" rx="3"/>
      <rect x="${g(172)}" y="36" width="26" height="76" rx="3" opacity=".85"/>
    </g>
    <path d="M${g(58)} 82 ${g(190)} 32" stroke="#f2d992" stroke-width="1.6" fill="none" opacity=".8"/>` },
  target:   { from: '#141f36', to: '#070d18', motif: g => `
    <g fill="none" stroke="#d9b45b" opacity=".6">
      <circle cx="${g(132)}" cy="73" r="38" stroke-width="1.4"/>
      <circle cx="${g(132)}" cy="73" r="24" stroke-width="1.4"/>
      <circle cx="${g(132)}" cy="73" r="10" stroke-width="1.4"/>
    </g>
    <circle cx="${g(132)}" cy="73" r="4" fill="#f2d992"/>
    <path d="M${g(132)} 73 ${g(206)} 30" stroke="#f2d992" stroke-width="1.8" fill="none"/>` },
  brand:    { from: '#221c12', to: '#080d16', motif: g => `
    <path d="M${g(132)} 32 ${g(178)} 73 ${g(132)} 114 ${g(86)} 73Z" fill="none" stroke="#f2d992" stroke-width="1.6" opacity=".85"/>
    <path d="M${g(132)} 50 ${g(160)} 73 ${g(132)} 96 ${g(104)} 73Z" fill="#d9b45b" opacity=".35"/>
    <path d="M${g(40)} 73h34M${g(190)} 73h34" stroke="#d9b45b" stroke-width="1" opacity=".4"/>` }
};

let artSeq = 0;

/** サムネイル用の SVG を生成する（viewBox は常に 264x146、枠に合わせて slice） */
function artSvg(type) {
  const a = ART[type] || ART.desk;
  const id = `g${++artSeq}`;
  return `<svg viewBox="0 0 264 146" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${a.from}"/><stop offset="1" stop-color="${a.to}"/>
      </linearGradient>
    </defs>
    <rect width="264" height="146" fill="url(#${id})"/>
    ${a.motif(v => v)}
  </svg>`;
}

/* ---------- カテゴリー ---------- */
const CATEGORIES = [
  { id: 'all',      label: 'すべて' },
  { id: 'strategy', label: '戦略・思考' },
  { id: 'traffic',  label: '集客・コンテンツ' },
  { id: 'auto',     label: '自動化・仕組み化' },
  { id: 'analysis', label: '分析・改善' },
  { id: 'template', label: 'テンプレート活用' }
];

/* ---------- 講座データ ---------- */
const COURSES = [
  { no: '01', title: 'リード獲得の全体設計',     desc: '全体像を理解し、成果につながる導線設計を学ぶ', cat: 'strategy', badge: 'NEW', art: 'desk',     progress: 75, lessons: 8,  minutes: 130 },
  { no: '02', title: 'コンテンツ戦略と企画設計', desc: '価値あるコンテンツを継続的に生み出す仕組み',   cat: 'traffic',  badge: 'NEW', art: 'chess',    progress: 40, lessons: 7,  minutes: 105 },
  { no: '03', title: 'n8n 自動化実践講座',        desc: 'n8n を使った業務自動化の基礎から応用まで',    cat: 'auto',     badge: 'NEW', art: 'gears',    progress: 10, lessons: 10, minutes: 200 },
  { no: '04', title: 'メールマーケティング戦略', desc: '開封率・クリック率を高める設計と改善術',       cat: 'traffic',  badge: '人気', art: 'mail',     progress: 90, lessons: 6,  minutes: 90  },
  { no: '05', title: 'データ分析と改善サイクル', desc: 'データから示唆を見つけ、改善を回す方法',       cat: 'analysis', badge: '人気', art: 'chart',    progress: 60, lessons: 6,  minutes: 160 },
  { no: '06', title: 'テンプレート活用マスター', desc: 'LP・ステップ配信・オファーの型を使いこなす',   cat: 'template', badge: '人気', art: 'template', progress: 80, lessons: 5,  minutes: 75  },
  { no: '07', title: 'コミュニティ＆教育設計',   desc: 'ファンを育て、価値提供を続ける仕組みづくり',   cat: 'strategy', badge: '注目', art: 'network',  progress: 30, lessons: 6,  minutes: 80  },
  { no: '08', title: 'オファー設計と販売導線',   desc: '高単価でも選ばれるオファーの作り方',           cat: 'strategy', badge: '注目', art: 'rocket',   progress: 50, lessons: 7,  minutes: 120 },
  { no: '09', title: 'ワークフロー実装ガイド',   desc: '実務で使える自動化ワークフローの実装手順',     cat: 'auto',     badge: '注目', art: 'workflow', progress: 20, lessons: 8,  minutes: 150 },
  { no: '10', title: 'スケール戦略とチーム構築', desc: 'ビジネスを拡大するための組織と仕組み',         cat: 'strategy', badge: '',     art: 'scale',    progress: 0,  lessons: 9,  minutes: 175 },
  { no: '11', title: '広告運用の基礎と最適化',   desc: '少額から始めて勝ちパターンを見つける運用術',   cat: 'analysis', badge: '',     art: 'target',   progress: 0,  lessons: 7,  minutes: 140 },
  { no: '12', title: 'ブランディングと世界観',   desc: '選ばれ続けるための世界観とメッセージ設計',     cat: 'template', badge: '',     art: 'brand',    progress: 0,  lessons: 5,  minutes: 95  }
];

const PER_PAGE = 9;

/** 右レール「学習中の講座」に表示する講座番号 */
const LEARNING_NOW = ['01', '05', '08'];

/* ---------- ユーティリティ ---------- */
const badgeClass = b => (b === 'NEW' ? 'badge--new' : b === '人気' ? 'badge--hot' : 'badge--pick');

function formatDuration(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}分`;
  return `${h}時間${String(m).padStart(2, '0')}分`;
}

/* ---------- 状態 ---------- */
const state = { category: 'all', sort: 'new', keyword: '', page: 1 };

const el = {
  chips: document.getElementById('chips'),
  grid: document.getElementById('grid'),
  count: document.getElementById('count'),
  empty: document.getElementById('empty'),
  pagination: document.getElementById('pagination'),
  sort: document.getElementById('sort'),
  search: document.getElementById('search'),
  inprogress: document.getElementById('inprogress'),
  next: document.getElementById('next')
};

/* ---------- 絞り込み・並び替え ---------- */
function visibleCourses() {
  const kw = state.keyword.trim().toLowerCase();
  let list = COURSES.filter(c => {
    const byCat = state.category === 'all' || c.cat === state.category;
    const byKw = !kw || `${c.no} ${c.title} ${c.desc}`.toLowerCase().includes(kw);
    return byCat && byKw;
  });

  const sorters = {
    new:       (a, b) => a.no.localeCompare(b.no),
    progress:  (a, b) => b.progress - a.progress || a.no.localeCompare(b.no),
    remaining: (a, b) => a.progress - b.progress || a.no.localeCompare(b.no),
    short:     (a, b) => a.minutes - b.minutes || a.no.localeCompare(b.no)
  };
  return list.sort(sorters[state.sort] || sorters.new);
}

/* ---------- 描画 ---------- */
function courseCard(c) {
  return `
    <article class="card" tabindex="0">
      <div class="thumb">
        ${c.badge ? `<span class="badge ${badgeClass(c.badge)}">${c.badge}</span>` : ''}
        ${artSvg(c.art)}
      </div>
      <div class="card-body">
        <h3 class="card-title">${c.no}. ${c.title}</h3>
        <p class="card-desc">${c.desc}</p>
        <div class="progress">
          <span class="bar"><span style="width:${c.progress}%"></span></span>
          <b>${c.progress}%</b>
        </div>
        <div class="card-meta">
          <span><i data-icon="lesson"></i>${c.lessons}レッスン</span>
          <span><i data-icon="clock"></i>${formatDuration(c.minutes)}</span>
        </div>
      </div>
    </article>`;
}

function renderChips() {
  el.chips.innerHTML = CATEGORIES.map(c =>
    `<button class="chip${c.id === state.category ? ' is-active' : ''}" type="button" data-cat="${c.id}">${c.label}</button>`
  ).join('');
}

function renderPagination(total) {
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  if (pages <= 1) { el.pagination.innerHTML = ''; return; }

  const buttons = [`<button class="page" type="button" data-page="${state.page - 1}" ${state.page === 1 ? 'disabled' : ''} aria-label="前のページ"><i data-icon="prev"></i></button>`];
  for (let p = 1; p <= pages; p++) {
    buttons.push(`<button class="page${p === state.page ? ' is-active' : ''}" type="button" data-page="${p}">${p}</button>`);
  }
  buttons.push(`<button class="page" type="button" data-page="${state.page + 1}" ${state.page === pages ? 'disabled' : ''} aria-label="次のページ"><i data-icon="next"></i></button>`);
  el.pagination.innerHTML = buttons.join('');
}

function renderCourses() {
  const list = visibleCourses();
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  state.page = Math.min(state.page, pages);

  const start = (state.page - 1) * PER_PAGE;
  const slice = list.slice(start, start + PER_PAGE);

  el.grid.innerHTML = slice.map(courseCard).join('');
  el.empty.hidden = list.length > 0;
  el.count.textContent = `（${list.length}）`;
  renderPagination(list.length);
  paintIcons(el.grid);
  paintIcons(el.pagination);
}

function renderRail() {
  const learning = COURSES.filter(c => LEARNING_NOW.includes(c.no));
  el.inprogress.innerHTML = learning.map(c => `
    <li class="mini">
      <span class="mini-thumb">${artSvg(c.art)}</span>
      <div>
        <p class="mini-title">${c.no}. ${c.title}</p>
        <div class="progress">
          <span class="bar"><span style="width:${c.progress}%"></span></span>
          <b>${c.progress}%</b>
        </div>
      </div>
    </li>`).join('');

  const next = COURSES.find(c => c.progress === 0);
  if (next) {
    el.next.innerHTML = `
      <span class="next-thumb">${artSvg(next.art)}</span>
      <div>
        <p class="next-title">${next.no}. ${next.title}</p>
        <p class="next-desc">${next.desc}</p>
        <div class="progress">
          <span class="bar"><span style="width:${next.progress}%"></span></span>
          <b>${next.progress}%</b>
        </div>
      </div>`;
  }
}

/* ---------- イベント ---------- */
el.chips.addEventListener('click', e => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  state.category = btn.dataset.cat;
  state.page = 1;
  renderChips();
  renderCourses();
});

el.pagination.addEventListener('click', e => {
  const btn = e.target.closest('.page');
  if (!btn || btn.disabled) return;
  state.page = Number(btn.dataset.page);
  renderCourses();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

el.sort.addEventListener('change', () => {
  state.sort = el.sort.value;
  state.page = 1;
  renderCourses();
});

let searchTimer;
el.search.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.keyword = el.search.value;
    state.page = 1;
    renderCourses();
  }, 120);
});

document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    el.search.focus();
    el.search.select();
  }
});

/* ---------- 初期化 ---------- */
paintIcons();
renderChips();
renderCourses();
renderRail();
