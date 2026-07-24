/**
 * BNYL - Bunkyo Night Youth Lounge
 * main.js
 *
 * GASデプロイ後、下記URLを設定してください。
 */
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwQzGptCaBNA4DZB4P49rL_lyP47Y43j57WkcoEC1jmB356dm_yBuvAhdSxFdtoUtuX/exec';

/* ==========================================
   予約フォームモーダル
   ========================================== */
const reserveModalOverlay = document.getElementById('reserveModalOverlay');

function openReserveModal() {
  reserveModalOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function closeReserveModal() {
  reserveModalOverlay.style.display = 'none';
  document.body.style.overflow = '';
}

document.getElementById('reserveModalClose').addEventListener('click', closeReserveModal);
reserveModalOverlay.addEventListener('click', e => {
  if (e.target === reserveModalOverlay) closeReserveModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && reserveModalOverlay.style.display === 'flex') closeReserveModal();
});

const footerReserveLink = document.getElementById('footerReserveLink');
if (footerReserveLink) {
  footerReserveLink.addEventListener('click', e => {
    e.preventDefault();
    openReserveModal();
  });
}

const navReserveLink = document.getElementById('navReserveLink');
if (navReserveLink) {
  navReserveLink.addEventListener('click', e => {
    e.preventDefault();
    openReserveModal();
  });
}

/* メールアドレスをコピー（mailto遷移は妨げない） */
const mailContactCard = document.getElementById('mailContactCard');
if (mailContactCard && navigator.clipboard) {
  mailContactCard.addEventListener('click', () => {
    const email = mailContactCard.href.replace('mailto:', '');
    navigator.clipboard.writeText(email).then(() => {
      const toast = document.getElementById('mailCopyToast');
      toast.classList.add('show');
      clearTimeout(toast._hideTimer);
      toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 2000);
    }).catch(() => {});
  });
}

/* ==========================================
   ナビゲーション
   ========================================== */
(function initNav() {
  const toggle = document.getElementById('navToggle');
  const menu   = document.getElementById('navMenu');
  const navbar = document.getElementById('navbar');

  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
  });

  // メニューリンクをクリックしたら閉じる
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.classList.remove('open');
    });
  });

  // スクロール量によってナビの影を変える
  window.addEventListener('scroll', () => {
    navbar.style.boxShadow = window.scrollY > 10
      ? '0 2px 20px rgba(0,0,0,0.35)'
      : '0 1px 0 rgba(255,255,255,0.08)';
  }, { passive: true });
})();

/* ==========================================
   開館カレンダー
   ========================================== */
(function initCalendar() {
  const OPEN_DATE = new Date(2026, 7, 7);  // 2026-08-07 オープン
  const END_DATE  = new Date(2027, 3, 1);  // 2027-04-01 事業終了（これ以降は開館・予約なし）
  let current = new Date();
  current = new Date(current.getFullYear(), current.getMonth(), 1);
  // オープン前は2026年8月から表示
  if (current < new Date(2026, 7, 1)) current = new Date(2026, 7, 1);
  // 事業終了後は最終月（2027年3月）を表示
  if (current >= END_DATE) current = new Date(2027, 2, 1);

  const grid  = document.getElementById('calendarGrid');
  const label = document.getElementById('calMonthLabel');

  // 日付(yyyy-MM-dd) → 専門職名 のマップ（GASのgetEventsから取得）
  let staffByDate = {};

  function isOpenDay(date) {
    const isNewYear = date.getMonth() === 0 && date.getDate() === 1;
    return date.getDay() === 5 && date >= OPEN_DATE && date < END_DATE && !isNewYear;
  }

  // 専門職名 → 表示ラベル（該当なしは空文字）
  function staffLabel(staff) {
    if (!staff) return '';
    if (staff.includes('福士')) return '💼キャリア';
    if (staff.includes('井口') || staff.includes('菅野')) return '💚メンタル';
    return '';
  }

  function render() {
    const year  = current.getFullYear();
    const month = current.getMonth();
    label.textContent = `${year}年${month + 1}月`;

    // ヘッダー行を残して日付セルを削除
    const cells = grid.querySelectorAll('.cal-day');
    cells.forEach(c => c.remove());

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const today    = new Date();

    // 空白セル
    for (let i = 0; i < firstDay; i++) {
      const el = document.createElement('div');
      el.className = 'cal-day cal-empty';
      grid.appendChild(el);
    }

    for (let d = 1; d <= lastDate; d++) {
      const date = new Date(year, month, d);
      const el   = document.createElement('div');
      el.className = 'cal-day';
      el.textContent = d;

      const isToday = date.toDateString() === today.toDateString();
      const isPast  = date < today && !isToday;
      const isOpen  = isOpenDay(date);

      if (isToday) el.classList.add('cal-today');
      if (isPast)  el.classList.add('cal-past');
      if (isOpen)  {
        el.classList.add('cal-open');
        el.setAttribute('title', `${year}/${month+1}/${d} 開館日`);
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.addEventListener('click', () => {
          openReserveModal();
        });

        // 専門職の在中表示（データがある日のみ）
        const ymd   = `${year}-${month + 1}-${d}`; // 例: 2026-8-7（パディングなしで統一）
        const label = staffLabel(staffByDate[ymd]);
        if (label) {
          const s = document.createElement('span');
          s.className = 'cal-staff';
          s.textContent = label;
          el.appendChild(s);
        }
      }
      grid.appendChild(el);
    }
  }

  document.getElementById('calPrev').addEventListener('click', () => {
    const min = new Date(2026, 7, 1);
    const prev = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    if (prev >= min) { current = prev; render(); }
  });
  document.getElementById('calNext').addEventListener('click', () => {
    const max  = new Date(2027, 2, 1); // 2027年3月まで（事業最終月）
    const next = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    if (next <= max) { current = next; render(); }
  });

  render();

  // GASの専門職スケジュール（通常開館を含む全開館日）を取得 → マップ化して再描画
  // ※ 取得失敗時はカレンダーに専門職表示を出さない
  (function loadStaffSchedule() {
    if (!GAS_ENDPOINT || GAS_ENDPOINT === 'YOUR_GAS_ENDPOINT_URL') return;
    fetch(`${GAS_ENDPOINT}?action=getStaffSchedule`)
      .then(res => res.text())
      .then(text => JSON.parse(text))
      .then(data => {
        (data.schedule || []).forEach(item => {
          if (!item.date || !item.staff) return;
          // GASは 'yyyy/M/d' を返すので 'yyyy-M-d' に正規化（render側と一致）
          const key = String(item.date).replace(/\//g, '-');
          staffByDate[key] = item.staff;
        });
        render();
      })
      .catch(() => { /* 取得失敗時は専門職表示なし */ });
  })();
})();

/* ==========================================
   イベント一覧
   ========================================== */
const EVENT_TYPES = {
  event:         { label: '交流イベント',   badge: 'badge-event' },
  youth_lecture: { label: '若者支援講座',   badge: 'badge-youth' },
  career_consult:{ label: 'キャリア個別相談',      badge: 'badge-consult' },
  mental_consult:{ label: 'メンタルヘルス個別相談', badge: 'badge-consult' },
};

// 個別相談の時間枠
const CONSULT_SLOTS = ['18:00', '18:45', '19:30', '20:15', '21:00'];

// フォールバック用サンプルイベント（GAS未設定時に表示）
const SAMPLE_EVENTS = [
  {
    id: 'ev1',
    title: 'みんなの居場所、一緒に育てよう',
    type: 'event',
    date: '2026-08-07',
    dateLabel: '2026年8月7日（金）',
    capacity: 20, reserved: 0,
    staff: '井口 智明',
    remark: '',
    status: '受付中',
  },
  {
    id: 'ev3',
    title: '自分の強みって何だろう？',
    type: 'youth_lecture',
    date: '2026-08-21',
    dateLabel: '2026年8月21日（金）',
    capacity: 15, reserved: 0,
    staff: '福士 章子',
    remark: '',
    status: '受付中',
  },
  {
    id: 'ev5',
    title: '推しを展示しよう部',
    type: 'event',
    date: '2026-09-04',
    dateLabel: '2026年9月4日（金）',
    capacity: 20, reserved: 0,
    staff: '福士 章子',
    remark: '',
    status: '受付中',
  },
  {
    id: 'ev6',
    title: 'モヤモヤとうまく付き合う',
    type: 'youth_lecture',
    date: '2026-09-11',
    dateLabel: '2026年9月11日（金）',
    capacity: 15, reserved: 0,
    staff: '井口 智明',
    remark: '',
    status: '受付中',
  },
];

// GASからイベントデータ取得
async function fetchEvents() {
  if (!GAS_ENDPOINT || GAS_ENDPOINT === 'YOUR_GAS_ENDPOINT_URL') {
    return { events: SAMPLE_EVENTS, error: null };
  }
  try {
    const res = await fetch(`${GAS_ENDPOINT}?action=getEvents`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { events: data.events || [], error: null };
  } catch (err) {
    return { events: [], error: err.message };
  }
}

// 開催日が過去（今日より前）かどうか。当日は過去扱いしない
function isPastEvent(isoDate) {
  if (!isoDate) return false;
  const parts = String(isoDate).split('-');
  if (parts.length < 3) return false;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

function buildEventCard(ev) {
  const typeInfo = EVENT_TYPES[ev.type] || { label: ev.type, badge: 'badge-event' };
  const isConsult = ev.type === 'career_consult' || ev.type === 'mental_consult';
  const isPast = isPastEvent(ev.date);
  const isFull = !isConsult && ev.reserved >= ev.capacity;
  const pct    = !isConsult ? Math.min(100, Math.round(ev.reserved / ev.capacity * 100)) : 0;
  const remain = !isConsult ? ev.capacity - ev.reserved : null;

  const item = document.createElement('div');
  item.className = 'event-item' + (isPast ? ' event-past' : '');
  item.dataset.id   = ev.id;
  item.dataset.type = ev.type;

  let capacityHtml = '';
  if (!isConsult) {
    capacityHtml = `
      <div class="event-capacity-bar-wrap">
        <div class="event-capacity-bar">
          <div class="event-capacity-fill ${isFull ? 'full' : ''}" style="width:${pct}%"></div>
        </div>
        <span class="event-seats ${isFull ? 'seats-full' : 'seats-available'}">
          ${isFull ? '満席' : `残${remain}席`}
        </span>
      </div>`;
  }

  let slotHtml = '';
  if (isConsult && ev.slots) {
    slotHtml = `<div class="consult-slots">
      ${ev.slots.map(s => {
        const slotFull = s.reserved >= s.capacity;
        return `<button type="button" class="slot-btn ${slotFull ? 'slot-full' : ''}"
          data-slot="${s.id}" data-time="${s.time}" data-ev="${ev.id}"
          ${slotFull ? 'disabled' : ''}>
          ${s.time}${slotFull ? '<br><small>満席</small>' : ''}
        </button>`;
      }).join('')}
    </div>`;
  }

  // 過去イベントは予約ボタンを非表示
  const btnHtml = (isConsult || isPast) ? '' : `
    <button type="button" class="event-reserve-btn ${isFull ? 'full-btn' : ''}"
      data-ev="${ev.id}" data-type="${ev.type}" data-title="${ev.title}" data-date="${ev.dateLabel}"
      ${isFull ? 'disabled' : ''}>
      ${isFull ? '満席' : '予約する →'}
    </button>`;

  const closedBadge = isPast ? `<span class="event-closed-badge">受付終了</span>` : '';

  item.innerHTML = `
    <div class="event-header">
      <div class="event-header-left">
        <span class="event-title">${ev.title}</span>
        <div class="event-meta-row">
          <span class="event-type-badge ${typeInfo.badge}">${typeInfo.label}</span>
          <span class="event-date-text">${ev.dateLabel}</span>
          ${closedBadge}
        </div>
      </div>
      ${capacityHtml}
      <svg class="event-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 9l6 6 6-6"/>
      </svg>
    </div>
    <div class="event-body">
      ${(ev.description || ev.desc || ev.remark) ? `<p class="event-desc"></p>` : ''}
      ${slotHtml}
      ${btnHtml}
    </div>`;

  // 説明文をXSS安全に設定（textContentでHTMLタグを無害化）
  const descEl = item.querySelector('.event-desc');
  if (descEl) descEl.textContent = ev.description || ev.desc || ev.remark || '';

  // アコーディオン
  item.querySelector('.event-header').addEventListener('click', () => {
    item.classList.toggle('open');
  });

  // 通常予約ボタン（過去・満席・相談を除く）
  if (!isConsult && !isFull && !isPast) {
    item.querySelector('.event-reserve-btn').addEventListener('click', () => {
      prefillForm({ type: ev.type, scheduleId: ev.id, scheduleLabel: `${ev.title}｜${ev.dateLabel}` });
    });
  }

  // 個別相談枠ボタン
  if (isConsult) {
    item.querySelectorAll('.slot-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        prefillForm({
          type: ev.type,
          scheduleId: btn.dataset.slot,
          scheduleLabel: `${ev.title}｜${btn.dataset.time}〜`,
        });
      });
    });
  }

  return item;
}

// カテゴリ → type[] のマッピング
const TAB_FILTER = {
  all:           null,
  event:         ['event'],
  youth_lecture: ['youth_lecture'],
};

async function initEvents() {
  const list    = document.getElementById('eventsList');
  const loading = document.getElementById('eventsLoading');
  const { events, error } = await fetchEvents();

  loading.style.display = 'none';

  if (error) {
    list.innerHTML = `
      <div class="events-error">
        <p>イベント情報の取得に失敗しました。</p>
        <p class="events-error-sub">時間をおいて再度アクセスするか、<a href="mailto:bnyl@dear-logue.com">メール</a>でお問い合わせください。</p>
      </div>`;
    return;
  }

  if (events.length === 0) {
    list.innerHTML = `<p class="events-empty">現在予定されているイベントはありません。</p>`;
    return;
  }

  events.forEach(ev => list.appendChild(buildEventCard(ev)));
  window._bnylEvents = events;

  // タブ絞り込み
  document.getElementById('eventsTabs').addEventListener('click', e => {
    const tab = e.target.closest('.events-tab');
    if (!tab) return;

    document.querySelectorAll('.events-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const cat   = tab.dataset.cat;
    const types = TAB_FILTER[cat];
    const cards = list.querySelectorAll('.event-item');

    cards.forEach(card => {
      const type    = card.dataset.type;
      const visible = !types || types.includes(type);
      if (visible) {
        card.classList.remove('hidden');
        card.classList.remove('fade-in');
        void card.offsetWidth; // reflow
        card.classList.add('fade-in');
      } else {
        card.classList.add('hidden');
      }
    });
  });
}

initEvents();

// スロットボタン用スタイル（動的追加）
(function addSlotStyles() {
  const s = document.createElement('style');
  s.textContent = `
    .consult-slots { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px; }
    .slot-btn {
      padding:8px 14px; border-radius:8px; font-size:0.82rem; font-weight:600;
      background:var(--pink-dark); color:#fff; cursor:pointer;
      transition:all 0.2s; border:none; font-family:var(--font); line-height:1.3; text-align:center;
    }
    .slot-btn:hover { background:#a84460; transform:translateY(-1px); }
    .slot-btn.slot-full { background:var(--gray-200); color:var(--gray-400); cursor:not-allowed; }
  `;
  document.head.appendChild(s);
})();

/* ==========================================
   予約フォーム
   ========================================== */
// GASから個別相談の受付可能日程を取得
async function fetchConsultDates(type) {
  if (!GAS_ENDPOINT || GAS_ENDPOINT === 'YOUR_GAS_ENDPOINT_URL') throw new Error('no endpoint');
  const res  = await fetch(`${GAS_ENDPOINT}?action=getConsultDates&type=${type}`);
  const text = await res.text();
  const data = JSON.parse(text);
  return data.dates || [];
}

// GASから個別相談の時間帯空き状況を取得
async function fetchConsultSlots(type, dateKey) {
  if (!GAS_ENDPOINT || GAS_ENDPOINT === 'YOUR_GAS_ENDPOINT_URL') throw new Error('no endpoint');
  const res  = await fetch(`${GAS_ENDPOINT}?action=getConsultSlots&type=${type}&date=${dateKey}`);
  const text = await res.text();
  const data = JSON.parse(text);
  return data.slots || [];
}

// 直近N週分の金曜日（開館日）を生成
function getUpcomingFridays(weeks = 8) {
  const OPEN_DATE = new Date(2026, 7, 7);
  const result = [];
  const today  = new Date();
  const start  = today > OPEN_DATE ? today : OPEN_DATE;
  let d = new Date(start);

  // 次の金曜日まで進める
  while (d.getDay() !== 5) d.setDate(d.getDate() + 1);

  const days = ['日','月','火','水','木','金','土'];
  while (result.length < weeks) {
    const isNewYear = d.getMonth() === 0 && d.getDate() === 1;
    if (!isNewYear) {
      const label = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日（${days[d.getDay()]}）`;
      const key   = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
      result.push({ date: label, key });
    }
    d.setDate(d.getDate() + 7);
  }
  return result;
}

// 個別相談の日程×時間枠を組み合わせた選択肢を生成
function buildConsultOptions(typePrefix) {
  const fridays = getUpcomingFridays(8);
  return fridays.flatMap(f =>
    CONSULT_SLOTS.map(t => ({
      value: `${typePrefix}_${f.key}_${t.replace(':','')}`,
      label: `${f.date} ${t}〜（30分枠）`,
      full: false,
    }))
  );
}

const SCHEDULE_OPTIONS = {
  event:          [],
  career_lecture: [],
  career_consult: buildConsultOptions('career'),
  mental_lecture: [],
  mental_consult: buildConsultOptions('mental'),
};

function buildScheduleOptions() {
  const events = window._bnylEvents || SAMPLE_EVENTS;

  // イベント・講座はGASデータから生成（過去日程は選択肢に出さない）
  ['event', 'career_lecture', 'youth_lecture', 'mental_lecture'].forEach(type => {
    SCHEDULE_OPTIONS[type] = events
      .filter(e => e.type === type && !isPastEvent(e.date))
      .map(e => ({
        value: e.id,
        label: `${e.title}｜${e.dateLabel}`,
        full: e.reserved >= e.capacity,
      }));
  });

  // 個別相談は直近8週の金曜日×時間枠を動的生成
  SCHEDULE_OPTIONS['career_consult'] = buildConsultOptions('career');
  SCHEDULE_OPTIONS['mental_consult'] = buildConsultOptions('mental');
}

setTimeout(buildScheduleOptions, 1500); // イベントロード後に実行

const ftypeEl    = document.getElementById('ftype');
const schedGroup = document.getElementById('scheduleGroup');
const schedSel   = document.getElementById('fschedule');
const fullBanner = document.getElementById('fullBanner');
const waitlistSec = document.getElementById('waitlistSection');
const waitlistBtn = document.getElementById('waitlistBtn');

const consultDateGroup = document.getElementById('consultDateGroup');
const consultTimeGroup = document.getElementById('consultTimeGroup');
const consultDateSel   = document.getElementById('fconsultDate');
const consultTimeSel   = document.getElementById('fconsultTime');

// 日程ロック表示（イベントカードから予約した場合に使用）
const lockedScheduleGroup = document.getElementById('lockedScheduleGroup');
const lockedScheduleText  = document.getElementById('lockedScheduleText');
const lockedScheduleClear = document.getElementById('lockedScheduleClear');
// イベントカードから予約された日程を保持（null=ドロップダウン選択モード）
let lockedSchedule = null; // { id, label, type }

function isConsultType(type) {
  return type === 'career_consult' || type === 'mental_consult';
}

/* ==========================================
   通知バナー（alert代替）
   type: validation / error / full / duplicate / network
   ========================================== */
const bannerEl     = document.getElementById('formBanner');
const bannerTextEl = document.getElementById('formBannerText');
const bannerClose  = document.getElementById('formBannerClose');
let   bannerTimer  = null;

function hideBanner() {
  if (!bannerEl) return;
  bannerEl.classList.add('fade-out');
  bannerEl.addEventListener('animationend', function onEnd() {
    bannerEl.style.display = 'none';
    bannerEl.classList.remove('fade-out');
    bannerEl.removeEventListener('animationend', onEnd);
  }, { once: true });
}

function showBanner(type, message, autoHide = true) {
  if (!bannerEl) return;
  if (bannerTimer) { clearTimeout(bannerTimer); bannerTimer = null; }

  bannerEl.classList.remove('fade-out');
  bannerEl.className = `form-banner banner-${type}`;
  bannerTextEl.textContent = message;
  bannerEl.style.display = 'flex';

  if (autoHide) {
    bannerTimer = setTimeout(hideBanner, 3000);
  }
}

if (bannerClose) {
  bannerClose.addEventListener('click', () => {
    if (bannerTimer) { clearTimeout(bannerTimer); bannerTimer = null; }
    hideBanner();
  });
}

// 全フォームグループをリセット
function resetFormGroups() {
  schedGroup.style.display        = 'none';
  consultDateGroup.style.display  = 'none';
  consultTimeGroup.style.display  = 'none';
  fullBanner.style.display        = 'none';
  waitlistSec.style.display       = 'none';
  waitlistBtn.style.display       = '';
  lockedScheduleGroup.style.display = 'none';
  lockedSchedule = null;
  document.getElementById('fschedule').innerHTML = '<option value="">選択してください</option>';
  consultDateSel.innerHTML = '<option value="">選択してください</option>';
  consultDateSel.value     = '';
  consultTimeSel.value     = '';
}

ftypeEl.addEventListener('change', () => {
  const type = ftypeEl.value;
  resetFormGroups();
  if (!type) return;

  buildScheduleOptions();

  if (isConsultType(type)) {
    // 相談：日程→時間帯の2段階（GASから取得）
    consultDateGroup.style.display = 'block';
    consultDateSel.innerHTML = '<option value="">読み込み中...</option>';
    consultDateSel.disabled  = true;

    fetchConsultDates(type).then(dates => {
      consultDateSel.innerHTML = '<option value="">日程を選択してください</option>';
      consultDateSel.disabled  = false;

      if (!dates.length) {
        consultDateSel.innerHTML = '<option value="">受付可能な日程がありません</option>';
        return;
      }
      dates.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.dateKey;
        // 新GAS: status（available/onsite/unavailable）／旧GAS: available（true/false）に後方互換
        const status = d.status || (d.available === false ? 'unavailable' : 'available');
        if (status === 'onsite') {
          opt.textContent = `${d.dateLabel}（当日来館受付のみ）`;
          opt.dataset.onsite = '1';
        } else if (status === 'unavailable') {
          opt.textContent = `${d.dateLabel}（受付外）`;
          opt.disabled = true;
        } else {
          opt.textContent = d.dateLabel;
        }
        consultDateSel.appendChild(opt);
      });
    }).catch(() => {
      // GAS未設定時のフォールバック
      consultDateSel.innerHTML = '<option value="">日程を選択してください</option>';
      consultDateSel.disabled  = false;
      getUpcomingFridays(8).forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.key;
        opt.textContent = f.date;
        consultDateSel.appendChild(opt);
      });
    });
  } else {
    // イベント・講座：通常スケジュール1段階
    updateScheduleOptions(type);
  }
});

// 日程選択後 → 時間帯をGASから取得して表示
consultDateSel.addEventListener('change', () => {
  const dateKey = consultDateSel.value;
  const type    = ftypeEl.value;
  consultTimeSel.value = '';

  const onsiteNotice = document.getElementById('consultOnsiteNotice');
  const isOnsite = consultDateSel.selectedOptions[0]?.dataset.onsite === '1';
  onsiteNotice.style.display = isOnsite ? 'block' : 'none';

  if (!dateKey || isOnsite) {
    consultTimeGroup.style.display = 'none';
    fullBanner.style.display  = 'none';
    waitlistSec.style.display = 'none';
    return;
  }

  consultTimeGroup.style.display = 'block';
  consultTimeSel.innerHTML = '<option value="">読み込み中...</option>';
  consultTimeSel.disabled  = true;

  fetchConsultSlots(type, dateKey).then(slots => {
    consultTimeSel.innerHTML = '<option value="">時間帯を選択してください</option>';
    consultTimeSel.disabled  = false;
    slots.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.timeKey;
      opt.textContent = s.booked ? `${s.label}【満席】` : s.label;
      if (s.booked) opt.disabled = true;
      consultTimeSel.appendChild(opt);
    });

    // 全枠満席ならキャンセル待ち導線を表示（日付単位）
    const allFull = slots.length > 0 && slots.every(s => s.booked);
    if (allFull) {
      consultTimeGroup.style.display = 'none';
      showConsultFullBanner();
    } else {
      fullBanner.style.display  = 'none';
      waitlistSec.style.display = 'none';
    }
  }).catch(() => {
    // フォールバック：全枠表示
    consultTimeSel.innerHTML = '<option value="">時間帯を選択してください</option>';
    consultTimeSel.disabled  = false;
    const labels = {'1800':'18:00〜（30分枠）','1845':'18:45〜（30分枠）','1930':'19:30〜（30分枠）','2015':'20:15〜（30分枠）','2100':'21:00〜（30分枠）'};
    Object.entries(labels).forEach(([k,v]) => {
      const opt = document.createElement('option');
      opt.value = k; opt.textContent = v;
      consultTimeSel.appendChild(opt);
    });
    fullBanner.style.display  = 'none';
    waitlistSec.style.display = 'none';
  });
});

// 個別相談：全枠満席時のキャンセル待ちバナーを表示
function showConsultFullBanner() {
  fullBanner.style.display = 'flex';
  const p = fullBanner.querySelector('p');
  if (p) p.textContent = '現在この日は空き枠がありません。キャンセル待ちを登録しますか？';
  waitlistSec.style.display = 'none';
  waitlistBtn.style.display = '';
  waitlistBtn.textContent   = 'キャンセル待ちを登録する';
}

function updateScheduleOptions(type) {
  schedSel.innerHTML = '<option value="">選択してください</option>';
  if (!type) { schedGroup.style.display = 'none'; return; }
  schedGroup.style.display = 'block';
  const opts = SCHEDULE_OPTIONS[type] || [];
  opts.forEach(o => {
    const el = document.createElement('option');
    el.value = o.value;
    el.textContent = o.full ? `${o.label}【満席】` : o.label;
    if (o.full) el.disabled = true;
    schedSel.appendChild(el);
  });
}

schedSel.addEventListener('change', () => {
  const type = ftypeEl.value;
  const opts = SCHEDULE_OPTIONS[type] || [];
  const sel  = opts.find(o => o.value === schedSel.value);
  if (sel && sel.full) {
    fullBanner.style.display = 'flex';
  } else {
    fullBanner.style.display = 'none';
    waitlistSec.style.display = 'none';
  }
});

waitlistBtn.addEventListener('click', () => {
  waitlistSec.style.display = 'block';
  fullBanner.querySelector('p').textContent = 'キャンセル待ちとして登録します。';
  waitlistBtn.style.display = 'none';
});

function prefillForm({ type, scheduleId, scheduleLabel }) {
  openReserveModal();
  setTimeout(() => {
    // ① まずフォームを完全リセット（前に選択した種別の表示を消す）
    resetFormGroups();

    // ② 予約内容ドロップダウンを該当種別に切り替え（changeは発火させず手動制御）
    ftypeEl.value = type;
    ftypeEl.classList.remove('invalid');

    if (isConsultType(type)) {
      // 個別相談カード経由（現状イベント一覧には相談は出ないが念のため）
      ftypeEl.dispatchEvent(new Event('change'));
      return;
    }

    // ③ イベント・講座：日程ドロップダウンは出さず、ロック表示で固定
    lockedSchedule = { id: scheduleId, label: scheduleLabel, type };
    lockedScheduleText.textContent = scheduleLabel;
    lockedScheduleGroup.style.display = 'block';
  }, 400);
}

// 「選び直す」→ ロック解除してドロップダウン選択モードに戻す
if (lockedScheduleClear) {
  lockedScheduleClear.addEventListener('click', () => {
    const type = ftypeEl.value;
    lockedSchedule = null;
    lockedScheduleGroup.style.display = 'none';
    buildScheduleOptions();
    updateScheduleOptions(type);
  });
}

/* 専門職予約ボタン */
document.querySelectorAll('.btn-staff').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    openReserveModal();
    setTimeout(() => {
      const ftypeEl = document.getElementById('ftype');
      ftypeEl.value = type;
      ftypeEl.dispatchEvent(new Event('change'));
    }, 450);
  });
});

/* フォーム送信 */
const form       = document.getElementById('reserveForm');
const submitBtn  = document.getElementById('submitBtn');
const formSuccess = document.getElementById('formSuccess');
const successMsg  = document.getElementById('successMsg');

function validate() {
  let ok = true;
  const member = document.getElementById('fmember');
  const email  = document.getElementById('femail');
  const type   = ftypeEl;

  // エラーリセット
  ['memberError','emailError','typeError','scheduleError','consultDateError','consultTimeError']
    .forEach(id => { const el = document.getElementById(id); if(el) el.textContent = ''; });
  [member, email, type, document.getElementById('fschedule'), consultDateSel, consultTimeSel]
    .forEach(el => { if(el) el.classList.remove('invalid'); });

  if (!member.value.trim()) {
    document.getElementById('memberError').textContent = '会員番号を入力してください';
    member.classList.add('invalid'); ok = false;
  }
  if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    document.getElementById('emailError').textContent = '有効なメールアドレスを入力してください';
    email.classList.add('invalid'); ok = false;
  }
  if (!type.value) {
    document.getElementById('typeError').textContent = '予約内容を選択してください';
    type.classList.add('invalid'); ok = false;
  }
  const isConsultWaitlist = isConsultType(type.value) && waitlistSec.style.display !== 'none';

  if (isConsultType(type.value)) {
    const isOnsiteDate = consultDateSel.selectedOptions[0]?.dataset.onsite === '1';
    if (!consultDateSel.value) {
      document.getElementById('consultDateError').textContent = '希望日程を選択してください';
      consultDateSel.classList.add('invalid'); ok = false;
    } else if (isOnsiteDate) {
      document.getElementById('consultDateError').textContent = 'この日程はWeb予約できません。別の日程をお選びください';
      consultDateSel.classList.add('invalid'); ok = false;
    }
    // キャンセル待ち（全枠満席）の場合は時間帯選択を求めない
    if (!isConsultWaitlist && !isOnsiteDate && consultDateSel.value && !consultTimeSel.value) {
      document.getElementById('consultTimeError').textContent = '希望時間帯を選択してください';
      consultTimeSel.classList.add('invalid'); ok = false;
    }
  } else if (type.value && !lockedSchedule && schedGroup.style.display !== 'none') {
    // ドロップダウン選択モードのみチェック（ロック表示時は固定済みなので不要）
    const sched = document.getElementById('fschedule');
    if (!sched.value) {
      document.getElementById('scheduleError').textContent = '参加希望イベントを選択してください';
      sched.classList.add('invalid'); ok = false;
    }
  }

  if (!ok) showBanner('validation', '入力内容をご確認ください。');
  return ok;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validate()) return;

  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoad = submitBtn.querySelector('.btn-loading');
  btnText.style.display = 'none';
  btnLoad.style.display = 'flex';
  submitBtn.disabled = true;

  const isWaitlist = waitlistSec.style.display !== 'none';
  const type = ftypeEl.value;
  let scheduleVal, scheduleLabel;

  if (isConsultType(type)) {
    const dateKey  = consultDateSel.value;
    const timeVal  = consultTimeSel.value;
    const dateText = consultDateSel.selectedOptions[0]?.text || '';
    const timeText = consultTimeSel.selectedOptions[0]?.text || '';
    if (isWaitlist) {
      // 全枠満席のキャンセル待ち：日付単位（時間帯なし）
      scheduleVal   = `${type}_${dateKey}`;
      scheduleLabel = `${dateText}（キャンセル待ち）`;
    } else {
      scheduleVal   = `${type}_${dateKey}_${timeVal}`;
      scheduleLabel = `${dateText} ${timeText}`;
    }
  } else if (lockedSchedule) {
    // イベントカードから予約：ロックされた日程を使用
    scheduleVal   = lockedSchedule.id;
    scheduleLabel = lockedSchedule.label;
  } else {
    const sched   = document.getElementById('fschedule');
    scheduleVal   = sched.value;
    scheduleLabel = sched.selectedOptions[0]?.text || '';
  }

  const payload = {
    action:        isWaitlist ? 'waitlist' : 'reserve',
    memberNo:      document.getElementById('fmember').value.trim(),
    email:         document.getElementById('femail').value.trim(),
    reserveType:   type,
    schedule:      scheduleVal,
    scheduleLabel: scheduleLabel,
  };

  try {
    if (!GAS_ENDPOINT || GAS_ENDPOINT === 'YOUR_GAS_ENDPOINT_URL') {
      // デモモード
      await new Promise(r => setTimeout(r, 1200));
      showSuccess(payload, isWaitlist);
      return;
    }
    const res = await fetch(GAS_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    // GASはリダイレクト経由のためJSONパースが失敗することがある
    // res.okなら成功扱い（データは保存済みのため）
    let data = {};
    try {
      const text = await res.text();
      data = JSON.parse(text);
    } catch { /* パース失敗はGASリダイレクト由来のため無視 */ }

    if (res.ok && (data.status === 'ok' || !data.status)) {
      // 成功（res.okかつエラーstatusなし）
      showSuccess(payload, isWaitlist, data.receiptNo);
    } else if (data.status && data.status !== 'ok') {
      // GASがエラーstatusを返した → ボタンを戻してバナー表示
      btnText.style.display = '';
      btnLoad.style.display = 'none';
      submitBtn.disabled = false;

      const fallback = {
        full:      '満席です。キャンセル待ちをご利用ください。',
        duplicate: 'すでに同じ日程・枠で予約が存在します。',
        error:     'この日程・枠は受け付けられません。別の日程をお選びください。',
      };
      const bannerType = ['full','duplicate','error'].includes(data.status) ? data.status : 'error';
      showBanner(bannerType, data.message || fallback[bannerType] || 'エラーが発生しました。');
    } else {
      // res.okでないがstatusも取れない → 成功扱い（GASリダイレクト由来）
      showSuccess(payload, isWaitlist, data.receiptNo);
    }
  } catch (err) {
    btnText.style.display = '';
    btnLoad.style.display = 'none';
    submitBtn.disabled = false;
    showBanner('network', '送信に失敗しました。通信環境をご確認のうえ、時間をおいて再度お試しください。');
  }
});

// 予約完了モーダル要素
const completeModal   = document.getElementById('completeModal');
const modalIcon       = document.getElementById('modalIcon');
const modalTitle      = document.getElementById('modalTitle');
const modalReceipt    = document.getElementById('modalReceipt');
const modalReceiptNo  = document.getElementById('modalReceiptNo');
const modalDetail     = document.getElementById('modalDetail');
const modalMsg        = document.getElementById('modalMsg');
const modalOkBtn      = document.getElementById('modalOkBtn');

const TYPE_LABEL_MAP = {
  event: '交流イベント', youth_lecture: '若者支援講座',
  career_consult: 'キャリア個別相談', mental_consult: 'メンタルヘルス個別相談',
};

function showSuccess(payload, isWaitlist, receiptNo) {
  // 受付番号
  if (receiptNo) {
    modalReceiptNo.textContent = receiptNo;
    modalReceipt.style.display = 'inline-flex';
  } else {
    modalReceipt.style.display = 'none';
  }

  // 予約内容・日程
  const typeLabel = TYPE_LABEL_MAP[payload.reserveType] || payload.reserveType;
  modalDetail.innerHTML =
    `<dt>予約内容</dt><dd>${typeLabel}</dd>` +
    `<dt>日程・内容</dt><dd>${payload.scheduleLabel || payload.schedule || '-'}</dd>`;

  if (isWaitlist) {
    modalIcon.textContent  = '📋';
    modalTitle.textContent = 'キャンセル待ちを受け付けました';
    modalMsg.textContent   = '空きが出た場合、ご登録のメールアドレスにご連絡します。確認メールもお送りしました。';
  } else {
    modalIcon.textContent  = '✓';
    modalTitle.textContent = '予約を受け付けました';
    modalMsg.textContent   = 'ご登録のメールアドレスに確認メールをお送りしました。届かない場合は迷惑メールフォルダもご確認ください。';
  }

  // モーダル表示（背景スクロール固定）
  completeModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  modalOkBtn.focus();
}

// OK → ページ再読み込み（イベント一覧・残席を最新化）
if (modalOkBtn) {
  modalOkBtn.addEventListener('click', () => {
    location.reload();
  });
}

/* ==========================================
   スムーズスクロール（ナビ固定分オフセット）
   ========================================== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
