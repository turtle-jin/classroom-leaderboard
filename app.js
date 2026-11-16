// =========================================================================
// 1. SUPABASE CONNECTION KEYS 
// =========================================================================
const SUPABASE_URL = "https://rqrnxivxqpnnqfptegit.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_gzGy_6tQBg4xWvQA-YMezg_0SAGV9t0";
const CLASS_VIEWER_EMAIL = "class@msjinjin.com";
// =========================================================================
// 2. CLASSROOM CONFIGURATION & PALETTES
// =========================================================================
const COLOR_PALETTES = {
  brown: { badge: 'bg-amber-900/15 text-amber-950 border-amber-800/30', dot: 'bg-amber-800' },
  green: { badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-600' },
  yellow: { badge: 'bg-yellow-100 text-yellow-900 border-yellow-300', dot: 'bg-yellow-400' },
  white: { badge: 'bg-slate-100 text-slate-800 border-slate-300', dot: 'bg-white border border-slate-400' },
  blue: { badge: 'bg-blue-100 text-blue-800 border-blue-300', dot: 'bg-blue-600' },
  lime: { badge: 'bg-lime-100 text-lime-900 border-lime-300', dot: 'bg-lime-500' }
};

const AVATAR_OPTIONS = [
  // Cute & Kawaii Favorites
  '🧸', '🦄', '🐣', '🐥', '🐰', '🐼', '🐨', '🦊', '🐶', '🐱',
  '🐹', '🐻‍❄️', '🦦', '🦔', '🦙', '🦥', '🐧', '🦩', '🦭', '🐬',
  '🦋', '🐝', '🐞', '🐢', '🦕', '🦖', '🧚', '🧜‍♀️', '🦸', '🧙',
  '🤖', '👾', '👻', '👽',  '🌸', '🌻', '🍄',

  // Mammals
  '🐭', '🐻', '🐯', '🦁', '🐮', '🐷', '🐸',  '🐕', '🐩', '🦮', '🐕‍🦺', '🐺', '🦝',
  '🐈', '🐈‍⬛', '🐆', '🐅', '🦓', '🦌', '🦬', '🐂', '🐃', 
  '🐎', '🫎', '🫏', '🐖', '🐏',  '🐐', '🐪', '🐫', '🦒',
  '🐘', '🦣', 

  // Birds
  '🐤', '🐦', '🦅', '🦆', '🦢', '🦉', '🦤',
   '🦚', '🦜', '🐦‍⬛', '🪿', '🐦‍🔥',


];

let appConfig = {
  classTitle: "Ms. JinJin's Class Leaderboard",
  goalTitle: "Class Milestone: 20 Credits = Ice Cream for Everyone!",
  goalCurrentCredits: 0,
  goalTarget: 20,
  enableHouses: true,
  houses: [
    { name: "Brown", color: "brown", icon: "🟤" },
    { name: "Green", color: "green", icon: "🟢" },
    { name: "Yellow", color: "yellow", icon: "🟡" },
    { name: "White", color: "white", icon: "⚪" },
    { name: "Blue", color: "blue", icon: "🔵" },
    { name: "Lime", color: "lime", icon: "🍋" }
  ],
  rewards: [
    { id: 'candy', cost: 5, fullName: 'Candy Treat', icon: '🍬', desc: 'Pick one piece of candy from the classroom treat jar.' },
    { id: 'fruitsnack', cost: 8, fullName: 'Fruit Snack Pack', icon: '🍓', desc: 'Redeem for a pouch of fruit snacks during class.' },
    { id: 'yt45', cost: 10, fullName: '45 Mins YouTube Pass', icon: '📺', desc: 'Watch school-appropriate YouTube during independent work for 45 mins.' },
    { id: 'ytfull', cost: 20, fullName: 'All Class Period YouTube', icon: '🎬', desc: 'Full class period YouTube pass during independent study time.' }
  ],
  defaultAddAmount: 1,
  presetBadges: [
    'Top Helper',
    '3-Week Streak',
    'Lab Leader',
    'Quick Thinker',
    'Peer Mentor',
    'Team Spirit',
    '100% Homework',
    'Focus Pro',
    'Kindness Star',
    'Steady Climber',
    'Fast Finisher'
  ],
  showGoalBar: true,
  showShopTab: true,
  showConfetti: true,
  soundEffects: true
};

// =========================================================================
// 3. APPLICATION STATE & SUPABASE CLIENT
// =========================================================================
let sb = null;
let isGateUnlocked = false;
let isAdmin = false;
let currentTeacherEmail = '';
let currentTab = 'weekly';
let currentHouseFilter = 'ALL';
let weekNumber = 1;
let cheerCount = 0;
let pendingDeleteId = null;
let activeModalStudentId = null;
let realtimeChannel = null;

let students = [];
let hallOfFame = [];

// =========================================================================
// 4. SUPABASE INITIALIZATION, OPTION B CLASS GATE & REAL-TIME SYNC
// =========================================================================
function setLiveStatus(text, style = 'neutral') {
  const pill = document.getElementById('live-status-pill');
  const sub = document.getElementById('header-subtitle');
  if (!pill) return;
  const styles = {
    live: 'px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-700 border-2 border-emerald-300',
    warn: 'px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border-2 border-amber-300',
    error: 'px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-700 border-2 border-rose-300',
    neutral: 'px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-600 border-2 border-slate-200'
  };
  pill.className = styles[style] || styles.neutral;
  pill.textContent = text;
  if (sub && style === 'warn') {
    sub.textContent = '⚠️ Paste your Supabase URL & Publishable Key at the top of app.js';
  }
}

function applySessionState(session) {
  const userEmail = (session?.user?.email || '').toLowerCase();
  isGateUnlocked = Boolean(session?.user);
  isAdmin = Boolean(session?.user) && userEmail !== CLASS_VIEWER_EMAIL.toLowerCase();
  currentTeacherEmail = isAdmin ? (session?.user?.email || '') : '';

  const gateScreen = document.getElementById('class-gate-screen');
  const appShell = document.getElementById('app-shell');
  if (gateScreen) gateScreen.classList.toggle('hidden', isGateUnlocked);
  if (appShell) appShell.classList.toggle('hidden', !isGateUnlocked);
}

function startRealtimeSubscription() {
  if (!sb || realtimeChannel) return;
  realtimeChannel = sb.channel('classroom-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => loadFromSupabase(true))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'hall_of_fame' }, () => loadFromSupabase(true))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'class_settings' }, () => loadFromSupabase(true))
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setLiveStatus('● Live Sync', 'live');
      }
    });
}

async function initSupabase() {
  const gateTitle = document.getElementById('gate-class-title');
  if (gateTitle) gateTitle.textContent = appConfig.classTitle;

  if (
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY ||
    SUPABASE_URL.includes('PASTE_YOUR') ||
    SUPABASE_ANON_KEY.includes('PASTE_YOUR')
  ) {
    // Allow previewing the unlocked UI if Supabase keys are not pasted yet
    isGateUnlocked = true;
    document.getElementById('class-gate-screen')?.classList.add('hidden');
    document.getElementById('app-shell')?.classList.remove('hidden');
    setLiveStatus('Setup Needed', 'warn');
    renderAll();
    return;
  }

  try {
    // Use sessionStorage so closing the tab/browser forces a fresh password login
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: window.sessionStorage
      }
    });

    // Check if student class viewer or teacher admin is already signed in
    const { data: { session } } = await sb.auth.getSession();
    applySessionState(session);

    if (isGateUnlocked) {
      await loadFromSupabase(true);
      startRealtimeSubscription();
    }

    // Listen for sign-in / sign-out changes across tabs
    sb.auth.onAuthStateChange(async (_event, newSession) => {
      const wasUnlocked = isGateUnlocked;
      applySessionState(newSession);
      if (isGateUnlocked && !wasUnlocked) {
        await loadFromSupabase(true);
        startRealtimeSubscription();
      } else {
        renderAll();
      }
    });
  } catch (err) {
    console.error('Supabase init error:', err);
    setLiveStatus('Connection Error', 'error');
  }
}

async function unlockClassGate(e) {
  e.preventDefault();
  const input = document.getElementById('class-gate-input');
  const errEl = document.getElementById('class-gate-error');
  const submitBtn = document.getElementById('class-gate-submit');
  const card = document.getElementById('class-gate-card');
  const password = (input?.value || '').trim();

  if (!sb) {
    showToast('Connect Supabase in app.js first.', 'amber');
    return;
  }

  errEl?.classList.add('hidden');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Checking Class Password...';
  }

  const { data, error } = await sb.auth.signInWithPassword({
    email: CLASS_VIEWER_EMAIL,
    password
  });

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enter Classroom →';
  }

  if (error || !data?.session) {
    errEl?.classList.remove('hidden');
    if (card) {
      card.classList.remove('animate-shake');
      void card.offsetWidth;
      card.classList.add('animate-shake');
    }
    if (input) {
      input.value = '';
      input.focus();
    }
    return;
  }

  if (input) input.value = '';
  applySessionState(data.session);
  await loadFromSupabase(true);
  startRealtimeSubscription();
  showToast('Welcome to the classroom leaderboard!', 'emerald');
}

function openPinModalFromGate() {
  document.getElementById('admin-password-input').value = '';
  document.getElementById('pin-error').classList.add('hidden');
  document.getElementById('pin-modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('admin-email-input').focus(), 50);
}

async function loadFromSupabase(silent = false) {
  if (!sb || !isGateUnlocked) {
    if (!silent && !sb) showToast('Paste your Supabase keys in app.js first.', 'amber');
    return;
  }

  const [sRes, wRes, cRes] = await Promise.all([
    sb.from('students').select('*').order('created_at', { ascending: true }),
    sb.from('hall_of_fame').select('*').order('created_at', { ascending: false }),
    sb.from('class_settings').select('*').eq('id', 1).maybeSingle()
  ]);

  if (sRes.error) {
    console.error('Error loading students:', sRes.error);
    setLiveStatus('DB Error', 'error');
    if (!silent) showToast('Could not load students: ' + sRes.error.message, 'rose');
    return;
  }

  students = (sRes.data || []).map(r => ({
    id: r.id,
    name: r.name,
    avatar: r.avatar || '🦊',
    house: r.house || 'Brown',
    weeklyPoints: Number(r.weekly_points || 0),
    allTimePoints: Number(r.all_time_points || 0),
    badges: Array.isArray(r.badges) ? r.badges : [],
    history: Array.isArray(r.history) ? r.history : []
  }));

  hallOfFame = (wRes.data || []).map(w => ({
    id: w.id,
    weekLabel: w.week_label,
    date: w.date,
    podium: Array.isArray(w.podium) ? w.podium : []
  }));

  if (cRes.data) {
    weekNumber = Number(cRes.data.week_number || 1);
    cheerCount = Number(cRes.data.cheer_count || 0);
    appConfig.goalTitle = cRes.data.goal_title || appConfig.goalTitle;
    appConfig.goalCurrentCredits = Number(cRes.data.goal_current_credits ?? appConfig.goalCurrentCredits);
    appConfig.goalTarget = Number(cRes.data.goal_target || appConfig.goalTarget);
    if (Array.isArray(cRes.data.rewards) && cRes.data.rewards.length) {
      appConfig.rewards = cRes.data.rewards;
    }
    if (Array.isArray(cRes.data.preset_badges) && cRes.data.preset_badges.length) {
      appConfig.presetBadges = cRes.data.preset_badges;
    }
  }

  const sub = document.getElementById('header-subtitle');
  if (sub) {
    sub.textContent = `Live Classroom Points & Weekly Top 3 Podium • ${students.length} student${students.length === 1 ? '' : 's'}`;
  }

  renderAll();
  if (activeModalStudentId) openStudentModal(activeModalStudentId);
  if (!silent) showToast('Synced with Supabase!', 'emerald');
}

async function saveSharedSettings() {
  if (!sb) return;
  const { error } = await sb.from('class_settings').upsert({
    id: 1,
    week_number: weekNumber,
    cheer_count: cheerCount,
    goal_title: appConfig.goalTitle,
    goal_current_credits: appConfig.goalCurrentCredits,
    goal_target: appConfig.goalTarget,
    rewards: appConfig.rewards,
    preset_badges: appConfig.presetBadges
  });
  if (error) {
    console.error('Error saving settings:', error);
    showToast('Error saving settings: ' + error.message, 'rose');
  }
}

// =========================================================================
// 5. UTILITIES (TIMESTAMPS, SOUND, TOASTS, CONFETTI, PODIUM TIES)
// =========================================================================
function formatActivityTimestamp() {
  return new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(message, color = 'indigo') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const styles = {
    indigo: 'bg-slate-900 text-white border-slate-700',
    emerald: 'bg-emerald-600 text-white border-emerald-800',
    amber: 'bg-amber-400 text-slate-950 border-amber-600',
    rose: 'bg-rose-600 text-white border-rose-800'
  };
  const el = document.createElement('div');
  el.className = `px-4 py-2.5 rounded-2xl border-2 border-b-4 shadow-xl text-xs font-extrabold transition-all duration-300 ${styles[color] || styles.indigo}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(6px)';
    setTimeout(() => el.remove(), 300);
  }, 2600);
}

function playChime(type = 'add') {
  if (!appConfig.soundEffects) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = type === 'celebrate' ? [523.25, 659.25, 783.99, 1046.5] : type === 'deduct' ? [440, 349.23] : [523.25, 659.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.08, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.26);
    });
  } catch (e) { }
}

async function triggerCelebration() {
  const maxCheers = students.length;
  if (maxCheers > 0 && cheerCount < maxCheers) {
    cheerCount += 1;
    updateCheerLabel();
    if (sb) {
      await sb.from('class_settings').upsert({ id: 1, cheer_count: cheerCount });
    }
  }
  playChime('celebrate');
  if (appConfig.showConfetti && typeof confetti === 'function') {
    confetti({ particleCount: 95, spread: 75, origin: { y: 0.6 } });
  }
  if (cheerCount >= maxCheers && maxCheers > 0) {
    showToast(`All ${maxCheers} students have cheered for the Top 3!`, 'amber');
  } else {
    showToast('Celebrating this week’s Top 3 Podium!', 'amber');
  }
}

function updateCheerLabel() {
  const el = document.getElementById('cheer-counter-label');
  if (!el) return;
  const maxCheers = students.length;
  const capped = Math.min(cheerCount, maxCheers);
  const noun = capped === 1 ? 'person' : 'people';
  el.textContent = `👏 ${capped} / ${maxCheers} ${noun} cheered for the winners!`;
}

// Groups students into Rank 1, Rank 2, and Rank 3 including ties (ignores 0-point students)
function getTop3PodiumGroups(studentList) {
  const sorted = [...studentList]
    .filter(s => s.weeklyPoints > 0)
    .sort((a, b) => (b.weeklyPoints - a.weeklyPoints) || a.name.localeCompare(b.name));

  const groups = { 1: [], 2: [], 3: [] };
  let currentRank = 1;

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].weeklyPoints < sorted[i - 1].weeklyPoints) {
      currentRank = i + 1;
    }
    if (currentRank > 3) break;
    groups[currentRank].push(sorted[i]);
  }
  return groups;
}

// =========================================================================
// 6. RENDERING ENGINE (TACTILE POP + OLYMPIC STAGE PODIUM)
// =========================================================================
function renderAll() {
  document.getElementById('header-title').textContent = appConfig.classTitle;
  document.getElementById('week-number-label').textContent = weekNumber;
  updateCheerLabel();

  const modePill = document.getElementById('mode-pill');
  const adminBtn = document.getElementById('admin-toggle-btn');
  const adminToolbar = document.getElementById('admin-toolbar');
  const goalEditor = document.getElementById('goal-admin-editor');
  const shopAddBtn = document.getElementById('shop-add-btn');
  const syncBtn = document.getElementById('sync-btn');
  const emailBadge = document.getElementById('admin-email-badge');

  if (isAdmin) {
    modePill.textContent = 'Teacher Admin';
    modePill.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border-2 border-amber-300';
    adminBtn.classList.remove('hidden');
    adminBtn.innerHTML = '<span>🔓</span> Sign Out';
    adminBtn.className = 'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold bg-amber-400 text-slate-950 hover:bg-amber-300 border-b-4 border-amber-600 active:translate-y-0.5 transition';
    adminToolbar.classList.remove('hidden');
    goalEditor.classList.remove('hidden');
    if (shopAddBtn) shopAddBtn.classList.remove('hidden');
    if (syncBtn) {
      syncBtn.classList.remove('hidden');
      syncBtn.classList.add('inline-flex');
    }
    if (emailBadge) emailBadge.textContent = currentTeacherEmail ? `Signed in as ${currentTeacherEmail}` : 'Signed in as Teacher';
  } else {
    modePill.textContent = 'Student View';
    modePill.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-700 border-2 border-emerald-300';
    adminBtn.classList.remove('hidden');
    adminBtn.innerHTML = '<span>🔒</span> Teacher Admin';
    adminBtn.className = 'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold bg-slate-900 text-white hover:bg-slate-800 border-b-4 border-slate-950 active:translate-y-0.5 transition';
    adminToolbar.classList.add('hidden');
    goalEditor.classList.add('hidden');
    if (shopAddBtn) shopAddBtn.classList.add('hidden');
    if (syncBtn) {
      syncBtn.classList.add('hidden');
      syncBtn.classList.remove('inline-flex');
    }
  }

  const addHouseSelect = document.getElementById('add-house');
  if (addHouseSelect) {
    addHouseSelect.innerHTML = appConfig.houses
      .map(h => `<option value="${escapeHtml(h.name)}">${escapeHtml(h.icon)} Team ${escapeHtml(h.name)}</option>`)
      .join('');
  }

  const goalCard = document.getElementById('goal-card');
  goalCard.classList.toggle('hidden', !appConfig.showGoalBar);
  document.getElementById('goal-title-display').textContent = appConfig.goalTitle;
  document.getElementById('goal-numbers').textContent = `${appConfig.goalCurrentCredits} / ${appConfig.goalTarget} credits`;
  const pct = Math.min(100, Math.max(0, (Number(appConfig.goalCurrentCredits) / Math.max(0.01, Number(appConfig.goalTarget))) * 100));
  document.getElementById('goal-bar-fill').style.width = `${pct}%`;

  if (document.activeElement?.id !== 'inline-goal-title') {
    document.getElementById('inline-goal-title').value = appConfig.goalTitle;
  }
  if (document.activeElement?.id !== 'inline-goal-current') {
    document.getElementById('inline-goal-current').value = appConfig.goalCurrentCredits;
  }
  if (document.activeElement?.id !== 'inline-goal-target') {
    document.getElementById('inline-goal-target').value = appConfig.goalTarget;
  }

  const tabShop = document.getElementById('tab-shop');
  if (tabShop) tabShop.classList.toggle('hidden', !appConfig.showShopTab);
  if (!appConfig.showShopTab && currentTab === 'shop') {
    currentTab = 'weekly';
  }

  // Olympic Stage 3-Column Stepped Podium (Supports Ties + Hides 0-Point Scores)
  const podiumGroups = getTop3PodiumGroups(students);
  const spotlightEl = document.getElementById('spotlight-content');
  const hasAnyPodiumWinners = podiumGroups[1].length || podiumGroups[2].length || podiumGroups[3].length;

  if (!hasAnyPodiumWinners) {
    spotlightEl.innerHTML = `
      <div class="col-span-full rounded-2xl border-2 border-white/25 bg-white/15 p-4 text-xs sm:text-sm font-bold text-white text-center">
        ${students.length === 0
          ? 'No students on the leaderboard yet! Sign in via <strong>Teacher Admin</strong> above to add your class roster.'
          : '🌟 New week started! Earn weekly points to claim a spot on the Top 3 Podium!'}
      </div>
    `;
  } else {
    const renderPedestalMembers = (group, isFirst) => group.map(st => {
      const hObj = (isAdmin && appConfig.enableHouses) ? appConfig.houses.find(h => h.name === st.house) : null;
      const teamChip = hObj
        ? `<span class="inline-block mt-1 px-2 py-0.5 rounded-full ${isFirst ? 'bg-white/85 text-slate-900 border border-amber-600/30' : 'bg-white/20 text-white'} text-[10px] font-extrabold">${escapeHtml(hObj.icon)} Team ${escapeHtml(st.house)}</span>`
        : '';
      return `
        <div onclick="openStudentModal('${st.id}')" class="cursor-pointer hover:scale-[1.03] transition flex flex-col items-center">
          <div class="${isFirst ? 'w-14 h-14 bg-white border-2 border-amber-500 border-b-4 text-3xl' : 'w-11 h-11 bg-white/20 border-2 border-white/50 text-2xl'} mx-auto rounded-2xl flex items-center justify-center mb-1">
            ${st.avatar}
          </div>
          <div class="font-extrabold ${isFirst ? 'text-base sm:text-lg text-slate-950' : 'text-sm sm:text-base text-white'} truncate max-w-full">${escapeHtml(st.name)}</div>
          ${teamChip}
        </div>
      `;
    }).join('');

    const g1 = podiumGroups[1];
    const g2 = podiumGroups[2];
    const g3 = podiumGroups[3];

    const card2nd = g2.length ? `
      <div class="order-2 sm:order-1 rounded-2xl bg-white/15 backdrop-blur-xs border-2 border-slate-200/80 border-b-[6px] border-b-slate-300 p-4 text-center space-y-2">
        <div class="inline-block px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-900 text-[10px] font-extrabold uppercase">
          🥈 ${g2.length > 1 ? '2nd Place Tie' : '2nd Place'}
        </div>
        <div class="flex flex-wrap justify-center gap-3">
          ${renderPedestalMembers(g2, false)}
        </div>
        <div class="text-xs font-extrabold text-violet-100">${g2[0].weeklyPoints} weekly pts</div>
      </div>
    ` : '<div></div>';

    const card1st = g1.length ? `
      <div class="order-1 sm:order-2 rounded-3xl bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-500 border-2 border-amber-100 border-b-[8px] border-b-amber-600 p-5 text-center text-slate-950 sm:-mt-3 shadow-xl space-y-2">
        <div class="text-xl leading-none">👑</div>
        <div class="inline-block px-3 py-0.5 rounded-full bg-slate-950 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
          🥇 ${g1.length > 1 ? '1st Place Tie' : '1st Place Champion'}
        </div>
        <div class="flex flex-wrap justify-center gap-3">
          ${renderPedestalMembers(g1, true)}
        </div>
        <div class="text-xs font-extrabold text-amber-950">${g1[0].weeklyPoints} weekly pts</div>
      </div>
    ` : '<div></div>';

    const card3rd = g3.length ? `
      <div class="order-3 rounded-2xl bg-white/15 backdrop-blur-xs border-2 border-orange-300/80 border-b-[6px] border-b-orange-400 p-3.5 text-center space-y-2">
        <div class="inline-block px-2.5 py-0.5 rounded-full bg-orange-200 text-orange-950 text-[10px] font-extrabold uppercase">
          🥉 ${g3.length > 1 ? '3rd Place Tie' : '3rd Place'}
        </div>
        <div class="flex flex-wrap justify-center gap-3">
          ${renderPedestalMembers(g3, false)}
        </div>
        <div class="text-xs font-extrabold text-violet-100">${g3[0].weeklyPoints} weekly pts</div>
      </div>
    ` : '<div></div>';

    spotlightEl.innerHTML = card2nd + card1st + card3rd;
  }

  const filterBar = document.getElementById('house-filter-bar');
  if (isAdmin && appConfig.enableHouses && (currentTab === 'weekly' || currentTab === 'allTime')) {
    filterBar.classList.remove('hidden');
    const allBtn = `<button onclick="setHouseFilter('ALL')" class="px-3.5 py-1.5 rounded-2xl text-xs font-extrabold transition ${currentHouseFilter === 'ALL' ? 'bg-slate-900 text-white border-b-4 border-black' : 'bg-white text-slate-600 border-2 border-slate-200 border-b-4 hover:bg-slate-50'}">All Teams</button>`;
    const teamBtns = appConfig.houses.map(h => {
      const active = currentHouseFilter === h.name;
      return `<button onclick="setHouseFilter('${escapeHtml(h.name)}')" class="px-3.5 py-1.5 rounded-2xl text-xs font-extrabold transition ${active ? 'bg-sky-500 text-white border-b-4 border-sky-700' : 'bg-white text-slate-700 border-2 border-slate-200 border-b-4 hover:bg-slate-50'}">${escapeHtml(h.icon)} ${escapeHtml(h.name)}</button>`;
    }).join('');
    filterBar.innerHTML = allBtn + teamBtns;
  } else {
    filterBar.classList.add('hidden');
    currentHouseFilter = 'ALL';
  }

  document.getElementById('view-leaderboard').classList.toggle('hidden', currentTab !== 'weekly' && currentTab !== 'allTime');
  document.getElementById('view-hall').classList.toggle('hidden', currentTab !== 'hall');
  document.getElementById('view-shop').classList.toggle('hidden', currentTab !== 'shop');

  ['weekly', 'allTime', 'hall', 'shop'].forEach(t => {
    const btn = document.getElementById(`tab-${t}`);
    if (!btn) return;
    btn.className = t === currentTab
      ? 'w-full px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold bg-sky-500 text-white border-b-4 border-sky-700 transition'
      : 'w-full px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold text-slate-600 hover:bg-slate-100 transition';
  });

  if (currentTab === 'hall') {
    renderHallOfFame();
  } else if (currentTab === 'shop') {
    renderShop();
  } else {
    renderLeaderboard();
  }
}

function renderLeaderboard() {
  const listEl = document.getElementById('leaderboard-list');
  const houseOrder = appConfig.houses.map(h => h.name);

  let filtered = students.filter(s => {
    if (!isAdmin || !appConfig.enableHouses || currentHouseFilter === 'ALL') return true;
    return s.house === currentHouseFilter;
  });

  if (!filtered.length) {
    listEl.innerHTML = `<div class="rounded-3xl bg-white border-2 border-slate-200 border-b-4 p-8 text-center text-sm font-semibold text-slate-500">No students to display yet. Sign in via <strong>Teacher Admin</strong> to add students!</div>`;
    return;
  }

  if (currentTab === 'allTime') {
    filtered.sort((a, b) => {
      if (isAdmin && appConfig.enableHouses) {
        const diff = houseOrder.indexOf(a.house) - houseOrder.indexOf(b.house);
        if (diff !== 0) return diff;
      }
      return a.name.localeCompare(b.name);
    });
  } else {
    filtered.sort((a, b) => (b.weeklyPoints - a.weeklyPoints) || a.name.localeCompare(b.name));
  }

  let prevPts = null;
  let prevRank = 1;

  listEl.innerHTML = filtered.map((s, idx) => {
    const houseObj = appConfig.houses.find(h => h.name === s.house) || appConfig.houses[0];
    const palette = COLOR_PALETTES[houseObj?.color] || COLOR_PALETTES.brown;

    const rank = (idx > 0 && s.weeklyPoints === prevPts) ? prevRank : idx + 1;
    prevPts = s.weeklyPoints;
    prevRank = rank;

    const rankBadge = currentTab === 'weekly'
      ? (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`)
      : '⭐';

    const teamPillHtml = (isAdmin && appConfig.enableHouses && houseObj)
      ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${palette.badge}">${escapeHtml(houseObj.icon)} ${escapeHtml(s.house)}</span>`
      : '';

    const badgesHtml = (s.badges || []).map(b =>
      `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 text-[11px] font-bold">⭐ ${escapeHtml(b)}${isAdmin ? ` <button type="button" onclick="event.stopPropagation(); removeBadgeFromStudent('${s.id}', '${escapeHtml(b)}')" title="Remove badge" class="ml-0.5 text-violet-400 hover:text-rose-600 font-extrabold">✕</button>` : ''}</span>`
    ).join('');

    const badgePresetsHtml = (appConfig.presetBadges || []).map(b =>
      `<option value="${escapeHtml(b)}">⭐ ${escapeHtml(b)}</option>`
    ).join('');

    const badgeAwarderHtml = `
      <div class="inline-flex flex-wrap items-center gap-1.5 bg-amber-50/90 border-2 border-amber-200 rounded-2xl p-1">
        <select id="badge-select-${s.id}" onchange="handleBadgeDropdownChange('${s.id}', this.value)"
          class="px-2 py-1 rounded-xl bg-white border border-amber-300 text-xs font-bold text-slate-700 focus:outline-none">
          <option value="">🏅 Award Badge...</option>
          ${badgePresetsHtml}
          <option value="__CUSTOM__">✏️ Custom Badge...</option>
          <option value="__REMOVE_PRESET__">🗑️ Remove Preset Badge...</option>
        </select>
        <input id="badge-custom-${s.id}" type="text" placeholder="Type badge name"
          onkeydown="if(event.key==='Enter'){ event.preventDefault(); awardSelectedBadge('${s.id}'); }"
          class="hidden w-32 px-2 py-1 rounded-xl bg-white border border-amber-300 text-xs font-semibold text-slate-800 focus:outline-none" />
        <select id="badge-remove-select-${s.id}"
          class="hidden px-2 py-1 rounded-xl bg-rose-50 border border-rose-300 text-xs font-bold text-rose-800 focus:outline-none">
          <option value="">Select preset to delete...</option>
          ${badgePresetsHtml}
        </select>
        <button id="badge-action-btn-${s.id}" type="button" onclick="awardSelectedBadge('${s.id}')"
          class="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 border-b-2 border-amber-600 text-slate-950 text-xs font-extrabold transition">
          + Badge
        </button>
      </div>
    `;

    const rewardButtonsHtml = appConfig.rewards.map(r => `
      <button onclick="event.stopPropagation(); applyRewardDeduction('${s.id}', ${r.cost}, '${escapeHtml(r.fullName)}', '${escapeHtml(r.icon)}')"
        class="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border-2 border-rose-200 text-[11px] font-extrabold transition">
        -${r.cost} ${escapeHtml(r.icon)} ${escapeHtml(r.fullName)}
      </button>
    `).join('');

    const teamSelectHtml = appConfig.enableHouses ? `
      <select onclick="event.stopPropagation()" onchange="changeStudentTeam('${s.id}', this.value)"
        class="px-2.5 py-1.5 rounded-xl bg-white border-2 border-slate-300 text-xs font-bold text-slate-700">
        ${appConfig.houses.map(h => `<option value="${escapeHtml(h.name)}" ${h.name === s.house ? 'selected' : ''}>${escapeHtml(h.icon)} ${escapeHtml(h.name)}</option>`).join('')}
      </select>
    ` : '';

    const avatarPickerList = AVATAR_OPTIONS.includes(s.avatar) ? AVATAR_OPTIONS : [s.avatar, ...AVATAR_OPTIONS];
    const avatarSelectHtml = `
      <select onclick="event.stopPropagation()" onchange="changeStudentAvatar('${s.id}', this.value)" title="Change student avatar"
        class="px-2 py-1.5 rounded-xl bg-white border-2 border-slate-300 text-xs font-bold text-slate-700">
        ${avatarPickerList.map(av => `<option value="${av}" ${av === s.avatar ? 'selected' : ''}>${av}</option>`).join('')}
      </select>
    `;

    const adminControlsHtml = isAdmin ? `
      <div onclick="event.stopPropagation()" class="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
        <div class="inline-flex items-center gap-1.5 bg-emerald-50/80 border-2 border-emerald-200 rounded-2xl p-1">
          <input id="custom-add-${s.id}" type="number" min="1" value="${appConfig.defaultAddAmount}"
            class="w-16 px-2 py-1 rounded-xl bg-white border border-emerald-300 text-xs font-extrabold text-slate-900 focus:outline-none" />
          <button onclick="applyCustomAdd('${s.id}')"
            class="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 border-b-2 border-emerald-800 text-white text-xs font-extrabold transition">
            + Add
          </button>
        </div>
        <div class="inline-flex items-center gap-1.5 bg-sky-50/90 border-2 border-sky-200 rounded-2xl p-1">
          <input id="custom-alltime-${s.id}" type="number" min="1" placeholder="pts"
            onkeydown="if(event.key==='Enter'){ event.preventDefault(); applyCustomAllTimeAdd('${s.id}'); }"
            class="w-16 px-2 py-1 rounded-xl bg-white border border-sky-300 text-xs font-extrabold text-slate-900 focus:outline-none" />
          <button onclick="applyCustomAllTimeAdd('${s.id}')"
            class="px-3 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 border-b-2 border-sky-700 text-white text-xs font-extrabold transition">
            + Balance
          </button>
        </div>
        <button onclick="applyBrainTeaserAdd('${s.id}')"
          class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 border-b-2 border-emerald-800 text-white text-xs font-extrabold transition">
          +2 🧠 Brain Teaser
        </button>
        <button onclick="applyDailyGoodStudentAdd('${s.id}')"
          class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 border-b-2 border-emerald-800 text-white text-xs font-extrabold transition">
          +1 🌟 Daily good student reward point
        </button>
        <div class="flex flex-wrap items-center gap-1.5">
          ${rewardButtonsHtml}
        </div>
        ${badgeAwarderHtml}
        <div class="ml-auto flex items-center gap-1.5">
          ${avatarSelectHtml}
          ${teamSelectHtml}
          <button onclick="openDeleteModal('${s.id}')" title="Remove student"
            class="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 border-b-2 border-slate-300 text-slate-600 hover:text-rose-700 text-xs font-bold transition">
            🗑️
          </button>
        </div>
      </div>
    ` : '';

    const primaryPts = currentTab === 'allTime' ? s.allTimePoints : s.weeklyPoints;
    const secondaryLabel = currentTab === 'allTime' ? `${s.weeklyPoints} this week` : `${s.allTimePoints} balance`;

    return `
      <div onclick="openStudentModal('${s.id}')"
        class="cursor-pointer rounded-3xl bg-white border-2 border-slate-200 border-b-4 hover:border-sky-400 hover:border-b-sky-500 p-4 transition">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-2xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center font-extrabold text-sm text-slate-700 shrink-0">
              ${rankBadge}
            </div>
            <div class="w-10 h-10 rounded-2xl bg-sky-50 border-2 border-sky-200 flex items-center justify-center text-xl shrink-0">
              ${s.avatar}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-extrabold text-sm sm:text-base text-slate-900 truncate">${escapeHtml(s.name)}</span>
                ${teamPillHtml}
              </div>
              <div class="flex items-center gap-1.5 flex-wrap mt-1">
                ${badgesHtml || `<span class="text-xs text-slate-400 truncate">${escapeHtml(s.history?.[0] || '')}</span>`}
              </div>
            </div>
          </div>

          <div class="text-right shrink-0">
            <div class="text-lg sm:text-xl font-extrabold text-sky-600">${primaryPts} <span class="text-xs font-bold text-slate-400">pts</span></div>
            <div class="text-[11px] font-semibold text-slate-400">${secondaryLabel}</div>
          </div>
        </div>
        ${adminControlsHtml}
      </div>
    `;
  }).join('');
}

function renderHallOfFame() {
  const grid = document.getElementById('hall-grid');
  if (!hallOfFame.length) {
    grid.innerHTML = `<div class="col-span-full rounded-3xl bg-white border-2 border-slate-200 border-b-4 p-8 text-center text-sm font-semibold text-slate-500">No weekly podiums archived yet. Click <strong>Crown Top 3 & Reset Week</strong> in Teacher Admin mode at the end of the week!</div>`;
    return;
  }

  const rankStyles = {
    1: { label: '🥇 1st Place', card: 'bg-amber-50 border-amber-300 text-amber-950' },
    2: { label: '🥈 2nd Place', card: 'bg-slate-50 border-slate-300 text-slate-900' },
    3: { label: '🥉 3rd Place', card: 'bg-orange-50 border-orange-300 text-orange-950' }
  };

  grid.innerHTML = hallOfFame.map(entry => {
    const podiumRows = (entry.podium || []).map(p => {
      const st = rankStyles[p.rank] || rankStyles[3];
      const teamTag = (isAdmin && appConfig.enableHouses && p.house)
        ? `<span class="ml-1.5 text-[11px] font-bold opacity-75">• Team ${escapeHtml(p.house)}</span>`
        : '';
      return `
        <div class="flex items-center justify-between px-3.5 py-2.5 rounded-2xl border-2 ${st.card}">
          <div>
            <span class="text-xs font-extrabold mr-2">${st.label}</span>
            <span class="text-sm font-extrabold">${escapeHtml(p.name)}</span>
            ${teamTag}
          </div>
          <span class="text-xs font-extrabold">${p.points} pts</span>
        </div>
      `;
    }).join('');

    return `
      <div class="rounded-3xl bg-white border-2 border-slate-200 border-b-4 p-5 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-base font-extrabold text-slate-900">🏆 ${escapeHtml(entry.weekLabel)}</span>
          <span class="text-xs font-bold text-slate-400">${escapeHtml(entry.date)}</span>
        </div>
        <div class="space-y-2">${podiumRows}</div>
      </div>
    `;
  }).join('');
}

function renderShop() {
  const grid = document.getElementById('shop-grid');
  const countBadge = document.getElementById('shop-count-badge');
  if (countBadge) {
    countBadge.textContent = `${appConfig.rewards.length} Active Classroom Reward${appConfig.rewards.length === 1 ? '' : 's'}`;
  }

  grid.innerHTML = appConfig.rewards.map((r, idx) => {
    if (isAdmin) {
      return `
        <div class="rounded-3xl bg-white border-2 border-sky-300 border-b-4 p-4 space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-extrabold uppercase tracking-wider text-sky-600">Reward #${idx + 1}</span>
            <button onclick="removeRewardItem(${idx})" class="text-xs font-extrabold text-rose-600 hover:text-rose-800">✕ Remove</button>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-[10px] font-bold text-slate-400 mb-0.5">Icon</label>
              <input type="text" value="${escapeHtml(r.icon)}" onchange="updateRewardField(${idx}, 'icon', this.value)"
                class="w-full px-2 py-1.5 rounded-xl border-2 border-slate-300 text-center text-sm font-bold" />
            </div>
            <div class="col-span-2">
              <label class="block text-[10px] font-bold text-slate-400 mb-0.5">Point Cost</label>
              <input type="number" min="1" value="${r.cost}" onchange="updateRewardField(${idx}, 'cost', this.value)"
                class="w-full px-2.5 py-1.5 rounded-xl border-2 border-slate-300 text-xs font-extrabold" />
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-400 mb-0.5">Reward Name</label>
            <input type="text" value="${escapeHtml(r.fullName)}" onchange="updateRewardField(${idx}, 'fullName', this.value)"
              class="w-full px-2.5 py-1.5 rounded-xl border-2 border-slate-300 text-xs font-extrabold" />
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-400 mb-0.5">Description</label>
            <textarea rows="2" onchange="updateRewardField(${idx}, 'desc', this.value)"
              class="w-full px-2.5 py-1.5 rounded-xl border-2 border-slate-300 text-xs">${escapeHtml(r.desc)}</textarea>
          </div>
        </div>
      `;
    }

    return `
      <div class="rounded-3xl bg-white border-2 border-slate-200 border-b-4 p-5 flex flex-col justify-between space-y-3">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-3xl">${escapeHtml(r.icon)}</span>
            <span class="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold">-${r.cost} pts</span>
          </div>
          <h3 class="text-base font-extrabold text-slate-900">${escapeHtml(r.fullName)}</h3>
          <p class="text-xs text-slate-500 leading-relaxed">${escapeHtml(r.desc)}</p>
        </div>
        <div class="pt-2 border-t border-slate-100 text-[11px] font-bold text-slate-400">
          Deducts from Point Balance only
        </div>
      </div>
    `;
  }).join('');
}

// =========================================================================
// 7. NAVIGATION & SUPABASE-SYNCED STUDENT / ADMIN ACTIONS
// =========================================================================
function switchTab(tab) {
  currentTab = tab;
  renderAll();
}

function setHouseFilter(house) {
  currentHouseFilter = house;
  renderAll();
}

async function saveInlineMilestone() {
  appConfig.goalTitle = document.getElementById('inline-goal-title').value || 'Class Milestone';
  appConfig.goalCurrentCredits = Math.max(0, Number(document.getElementById('inline-goal-current').value) || 0);
  appConfig.goalTarget = Math.max(0.01, Number(document.getElementById('inline-goal-target').value) || 20);
  renderAll();
  await saveSharedSettings();
  showToast('Saved Class Milestone to Supabase!', 'emerald');
}

async function updateRewardField(idx, field, value) {
  if (!appConfig.rewards[idx]) return;
  if (field === 'cost') {
    appConfig.rewards[idx].cost = Math.max(1, Number(value) || 1);
  } else {
    appConfig.rewards[idx][field] = value;
  }
  renderLeaderboard();
  await saveSharedSettings();
  showToast('Reward updated!', 'emerald');
}

async function addRewardItem() {
  appConfig.rewards.push({
    id: 'rw_' + Date.now(),
    cost: 5,
    fullName: 'New Classroom Reward',
    icon: '🎟️',
    desc: 'Describe this reward for your students.'
  });
  renderAll();
  await saveSharedSettings();
  showToast('Added new reward item!', 'emerald');
}

async function removeRewardItem(idx) {
  if (appConfig.rewards.length <= 1) {
    showToast('Keep at least one reward item in the menu.', 'rose');
    return;
  }
  appConfig.rewards.splice(idx, 1);
  renderAll();
  await saveSharedSettings();
  showToast('Removed reward item.', 'amber');
}

async function applyCustomAdd(studentId) {
  const input = document.getElementById(`custom-add-${studentId}`);
  const delta = Math.max(1, Number(input?.value) || appConfig.defaultAddAmount);
  const s = students.find(st => st.id === studentId);
  if (!s) return;

  s.weeklyPoints += delta;
  s.allTimePoints += delta;
  s.history.unshift(`${formatActivityTimestamp()} • +${delta} pts awarded`);
  playChime('add');
  renderAll();

  if (sb) {
    const { error } = await sb.from('students').update({
      weekly_points: s.weeklyPoints,
      all_time_points: s.allTimePoints,
      history: s.history
    }).eq('id', studentId);
    if (error) {
      showToast('Permission denied: ' + error.message, 'rose');
      await loadFromSupabase(true);
      return;
    }
  }
  showToast(`+${delta} pts awarded to ${s.name}!`, 'emerald');
}

async function applyCustomAllTimeAdd(studentId) {
  const input = document.getElementById(`custom-alltime-${studentId}`);
  const delta = Number(input?.value);
  if (!delta || delta <= 0) {
    showToast('Enter a positive number of Balance points first.', 'amber');
    return;
  }

  const s = students.find(st => st.id === studentId);
  if (!s) return;

  s.allTimePoints += delta;
  s.history.unshift(`${formatActivityTimestamp()} • +${delta} Balance pts awarded`);
  playChime('add');
  renderAll();

  if (sb) {
    const { error } = await sb.from('students').update({
      all_time_points: s.allTimePoints,
      history: s.history
    }).eq('id', studentId);
    if (error) {
      showToast('Permission denied: ' + error.message, 'rose');
      await loadFromSupabase(true);
      return;
    }
  }
  showToast(`+${delta} Balance pts awarded to ${s.name}!`, 'emerald');
}

async function applyBrainTeaserAdd(studentId) {
  const s = students.find(st => st.id === studentId);
  if (!s) return;

  s.allTimePoints += 2;
  s.history.unshift(`${formatActivityTimestamp()} • +2 Balance pts — 🧠 Brain Teaser`);
  playChime('add');
  renderAll();

  if (sb) {
    const { error } = await sb.from('students').update({
      all_time_points: s.allTimePoints,
      history: s.history
    }).eq('id', studentId);
    if (error) {
      showToast('Permission denied: ' + error.message, 'rose');
      await loadFromSupabase(true);
      return;
    }
  }
  showToast(`+2 Balance pts (Brain Teaser) awarded to ${s.name}!`, 'emerald');
}

async function applyDailyGoodStudentAdd(studentId) {
  const s = students.find(st => st.id === studentId);
  if (!s) return;

  s.allTimePoints += 1;
  s.history.unshift(`${formatActivityTimestamp()} • +1 Balance pt — 🌟 Daily good student reward point`);
  playChime('add');
  renderAll();

  if (sb) {
    const { error } = await sb.from('students').update({
      all_time_points: s.allTimePoints,
      history: s.history
    }).eq('id', studentId);
    if (error) {
      showToast('Permission denied: ' + error.message, 'rose');
      await loadFromSupabase(true);
      return;
    }
  }
  showToast(`+1 Balance pt (Daily good student reward point) awarded to ${s.name}!`, 'emerald');
}

async function applyRewardDeduction(studentId, cost, rewardName, icon) {
  const s = students.find(st => st.id === studentId);
  if (!s) return;
  if (s.allTimePoints < cost) {
    showToast(`${s.name} needs ${cost} Balance pts (has ${s.allTimePoints}).`, 'rose');
    return;
  }
  s.allTimePoints = Math.max(0, s.allTimePoints - cost);
  s.history.unshift(`${formatActivityTimestamp()} • -${cost} Balance pts — Redeemed ${icon} ${rewardName}`);
  playChime('deduct');
  renderAll();

  if (sb) {
    const { error } = await sb.from('students').update({
      all_time_points: s.allTimePoints,
      history: s.history
    }).eq('id', studentId);
    if (error) {
      showToast('Permission denied: ' + error.message, 'rose');
      await loadFromSupabase(true);
      return;
    }
  }
  showToast(`${s.name} redeemed ${icon} ${rewardName} (-${cost} Balance pts)`, 'amber');
}

async function changeStudentTeam(studentId, newHouse) {
  const s = students.find(st => st.id === studentId);
  if (!s) return;
  s.house = newHouse;
  s.history.unshift(`${formatActivityTimestamp()} • Reassigned to Team ${newHouse}`);
  renderAll();

  if (sb) {
    await sb.from('students').update({
      house: s.house,
      history: s.history
    }).eq('id', studentId);
  }
  showToast(`Moved ${s.name} to Team ${newHouse}`, 'indigo');
}

async function changeStudentAvatar(studentId, newAvatar) {
  const s = students.find(st => st.id === studentId);
  if (!s || !newAvatar) return;
  s.avatar = newAvatar;
  renderAll();
  if (activeModalStudentId === studentId) openStudentModal(studentId);

  if (sb) {
    const { error } = await sb.from('students').update({
      avatar: s.avatar
    }).eq('id', studentId);
    if (error) {
      showToast('Permission denied: ' + error.message, 'rose');
      await loadFromSupabase(true);
      return;
    }
  }
  showToast(`Updated ${s.name}'s avatar to ${newAvatar}`, 'indigo');
}

function handleBadgeDropdownChange(studentId, val) {
  const customInput = document.getElementById(`badge-custom-${studentId}`);
  const removeSelect = document.getElementById(`badge-remove-select-${studentId}`);
  const actionBtn = document.getElementById(`badge-action-btn-${studentId}`);
  if (!customInput || !removeSelect || !actionBtn) return;

  customInput.classList.add('hidden');
  removeSelect.classList.add('hidden');

  if (val === '__CUSTOM__') {
    customInput.classList.remove('hidden');
    customInput.focus();
    actionBtn.textContent = '+ Badge';
    actionBtn.className = 'px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 border-b-2 border-amber-600 text-slate-950 text-xs font-extrabold transition';
  } else if (val === '__REMOVE_PRESET__') {
    removeSelect.classList.remove('hidden');
    removeSelect.focus();
    actionBtn.textContent = 'Remove Preset';
    actionBtn.className = 'px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 border-b-2 border-rose-800 text-white text-xs font-extrabold transition';
  } else {
    customInput.value = '';
    actionBtn.textContent = '+ Badge';
    actionBtn.className = 'px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 border-b-2 border-amber-600 text-slate-950 text-xs font-extrabold transition';
  }
}

async function awardSelectedBadge(studentId) {
  const selectEl = document.getElementById(`badge-select-${studentId}`);
  const customInput = document.getElementById(`badge-custom-${studentId}`);
  const removeSelect = document.getElementById(`badge-remove-select-${studentId}`);
  if (!selectEl) return;

  if (selectEl.value === '__REMOVE_PRESET__') {
    const presetToDelete = (removeSelect?.value || '').trim();
    if (!presetToDelete) {
      showToast('Choose which preset badge to remove from the dropdown.', 'amber');
      return;
    }
    await removePresetBadge(presetToDelete);
    return;
  }

  let badgeName = selectEl.value === '__CUSTOM__'
    ? (customInput?.value || '').trim()
    : (selectEl.value || '').trim();

  if (!badgeName) {
    showToast('Choose a preset badge or type a custom badge name first.', 'amber');
    return;
  }

  await awardBadgeToStudent(studentId, badgeName);
  selectEl.value = '';
  if (customInput) {
    customInput.value = '';
    customInput.classList.add('hidden');
  }
}

async function removePresetBadge(badgeName) {
  const target = String(badgeName || '').trim();
  if (!target) return;
  appConfig.presetBadges = (appConfig.presetBadges || []).filter(b => b !== target);
  renderAll();
  await saveSharedSettings();
  showToast(`Removed "${target}" from preset badge menu.`, 'rose');
}

async function awardBadgeToStudent(studentId, rawBadge) {
  const s = students.find(st => st.id === studentId);
  const badge = String(rawBadge || '').trim();
  if (!s || !badge) return;

  s.badges = s.badges || [];
  if (s.badges.some(b => b.toLowerCase() === badge.toLowerCase())) {
    showToast(`${s.name} already has the "${badge}" badge!`, 'amber');
    return;
  }

  s.badges.push(badge);
  let presetsChanged = false;
  if (!(appConfig.presetBadges || []).some(b => b.toLowerCase() === badge.toLowerCase())) {
    appConfig.presetBadges = [...(appConfig.presetBadges || []), badge];
    presetsChanged = true;
  }
  s.history.unshift(`${formatActivityTimestamp()} • 🏅 Earned badge: ${badge}`);
  playChime('add');
  renderAll();
  if (activeModalStudentId === studentId) openStudentModal(studentId);

  if (sb) {
    await sb.from('students').update({
      badges: s.badges,
      history: s.history
    }).eq('id', studentId);
    if (presetsChanged) await saveSharedSettings();
  }
  showToast(`Awarded ⭐ ${badge} to ${s.name}!`, 'emerald');
}

async function removeBadgeFromStudent(studentId, badgeName) {
  const s = students.find(st => st.id === studentId);
  if (!s) return;
  s.badges = (s.badges || []).filter(b => b !== badgeName);
  s.history.unshift(`${formatActivityTimestamp()} • Removed badge: ${badgeName}`);
  renderAll();
  if (activeModalStudentId === studentId) openStudentModal(studentId);

  if (sb) {
    await sb.from('students').update({
      badges: s.badges,
      history: s.history
    }).eq('id', studentId);
  }
  showToast(`Removed "${badgeName}" from ${s.name}.`, 'rose');
}

async function handleAddStudent(e) {
  e.preventDefault();
  if (!sb) {
    showToast('Connect Supabase in app.js before adding students.', 'amber');
    return;
  }
  const nameInput = document.getElementById('add-name');
  const houseInput = document.getElementById('add-house');
  const badgeInput = document.getElementById('add-badge');

  const name = nameInput.value.trim();
  if (!name) return;
  const autoAvatar = AVATAR_OPTIONS[students.length % AVATAR_OPTIONS.length];
  const badge = badgeInput.value.trim();

  const newStudent = {
    id: 's' + Date.now(),
    name,
    avatar: autoAvatar,
    house: houseInput.value || appConfig.houses[0]?.name || 'Brown',
    weekly_points: 0,
    all_time_points: 0,
    badges: badge ? [badge] : [],
    history: [`${formatActivityTimestamp()} • Joined the classroom leaderboard`]
  };

  const { error } = await sb.from('students').insert(newStudent);
  if (error) {
    showToast('Error adding student: ' + error.message, 'rose');
    return;
  }

  nameInput.value = '';
  badgeInput.value = '';
  playChime('add');
  await loadFromSupabase(true);
  showToast(`Added ${name} to the leaderboard!`, 'emerald');
}

// =========================================================================
// 8. SUPABASE TEACHER AUTHENTICATION (SIGN IN / SIGN OUT) & MODALS
// =========================================================================
async function handleAdminToggle() {
  if (isAdmin) {
    if (sb) {
      await sb.auth.signOut();
    }
    isAdmin = false;
    currentTeacherEmail = '';
    showToast('Signed out of Teacher Admin.', 'indigo');
    return;
  }
  document.getElementById('admin-password-input').value = '';
  document.getElementById('pin-error').classList.add('hidden');
  document.getElementById('pin-modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('admin-email-input').focus(), 50);
}

function closePinModal() {
  document.getElementById('pin-modal').classList.add('hidden');
}

async function submitTeacherLogin(e) {
  e.preventDefault();
  if (!sb) {
    showToast('Connect Supabase in app.js first.', 'amber');
    return;
  }
  const email = document.getElementById('admin-email-input').value.trim();
  const password = document.getElementById('admin-password-input').value;
  const errEl = document.getElementById('pin-error');
  const submitBtn = document.getElementById('admin-login-submit');

  if (email.toLowerCase() === CLASS_VIEWER_EMAIL.toLowerCase()) {
    errEl.textContent = 'Please use your personal Teacher Admin email, not the student class viewer account.';
    errEl.classList.remove('hidden');
    return;
  }

  errEl.classList.add('hidden');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';

  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  submitBtn.disabled = false;
  submitBtn.textContent = 'Sign In as Teacher';

  if (error || !data?.session) {
    errEl.textContent = error?.message || 'Invalid email or password.';
    errEl.classList.remove('hidden');
    return;
  }

  applySessionState(data.session);
  closePinModal();
  await loadFromSupabase(true);
  startRealtimeSubscription();
  showToast('Signed in to Teacher Admin!', 'amber');
  renderAll();
}

function openResetConfirmModal() {
  const groups = getTop3PodiumGroups(students);
  const winners = [
    ...groups[1].map(s => ({ rank: 1, s })),
    ...groups[2].map(s => ({ rank: 2, s })),
    ...groups[3].map(s => ({ rank: 3, s }))
  ];
  const summary = winners.map(w => `<strong>#${w.rank} ${escapeHtml(w.s.name)}</strong> (${w.s.weeklyPoints} pts)`).join(', ');
  document.getElementById('reset-modal-body').innerHTML =
    `This will archive Week ${weekNumber}’s podium (${summary || 'no students'}) into the <strong>Hall of Fame</strong>, reset all students’ <strong>Weekly Points</strong> to 0, and clear the weekly cheer counter.`;
  document.getElementById('reset-modal').classList.remove('hidden');
}

function closeResetConfirmModal() {
  document.getElementById('reset-modal').classList.add('hidden');
}

async function executeCrownAndReset() {
  const groups = getTop3PodiumGroups(students);
  const podiumData = [
    ...groups[1].map(s => ({ rank: 1, name: s.name, house: s.house, points: s.weeklyPoints })),
    ...groups[2].map(s => ({ rank: 2, name: s.name, house: s.house, points: s.weeklyPoints })),
    ...groups[3].map(s => ({ rank: 3, name: s.name, house: s.house, points: s.weeklyPoints }))
  ];
  const stamp = formatActivityTimestamp();
  const today = new Date().toISOString().slice(0, 10);

  if (podiumData.length > 0 && sb) {
    await sb.from('hall_of_fame').insert({
      id: 'wk_' + Date.now(),
      week_label: `Week ${weekNumber}`,
      date: today,
      podium: podiumData
    });
  }

  for (const s of students) {
    s.weeklyPoints = 0;
    s.history.unshift(`${stamp} • Weekly points reset for Week ${weekNumber + 1}`);
    if (sb) {
      await sb.from('students').update({
        weekly_points: 0,
        history: s.history
      }).eq('id', s.id);
    }
  }

  cheerCount = 0;
  weekNumber += 1;
  await saveSharedSettings();
  closeResetConfirmModal();
  playChime('celebrate');
  if (appConfig.showConfetti && typeof confetti === 'function') {
    confetti({ particleCount: 95, spread: 75, origin: { y: 0.6 } });
  }
  await loadFromSupabase(true);
  showToast(`Week ${weekNumber - 1} Top 3 crowned! Weekly points & cheers reset.`, 'amber');
}

function openDeleteModal(studentId) {
  const s = students.find(st => st.id === studentId);
  if (!s) return;
  pendingDeleteId = studentId;
  document.getElementById('delete-modal-body').innerHTML =
    `Are you sure you want to remove <strong>${escapeHtml(s.name)}</strong> from the leaderboard? This action cannot be undone.`;
  document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
  pendingDeleteId = null;
  document.getElementById('delete-modal').classList.add('hidden');
}

async function executeDeleteStudent() {
  if (!pendingDeleteId) return;
  const idToDelete = pendingDeleteId;
  const target = students.find(st => st.id === idToDelete);
  closeDeleteModal();

  if (sb) {
    const { error } = await sb.from('students').delete().eq('id', idToDelete);
    if (error) {
      showToast('Permission denied: ' + error.message, 'rose');
      return;
    }
  }
  students = students.filter(st => st.id !== idToDelete);
  if (cheerCount > students.length) {
    cheerCount = students.length;
    await saveSharedSettings();
  }
  renderAll();
  if (target) showToast(`Removed ${target.name} from the class.`, 'rose');
}

function openStudentModal(studentId) {
  const s = students.find(st => st.id === studentId);
  if (!s) return;
  activeModalStudentId = studentId;
  document.getElementById('modal-avatar').textContent = s.avatar;
  document.getElementById('modal-name').textContent = s.name;

  const houseBadge = document.getElementById('modal-house-badge');
  const houseObj = appConfig.houses.find(h => h.name === s.house);
  if (isAdmin && appConfig.enableHouses && houseObj) {
    const palette = COLOR_PALETTES[houseObj.color] || COLOR_PALETTES.brown;
    houseBadge.className = `inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${palette.badge}`;
    houseBadge.textContent = `${houseObj.icon} Team ${s.house}`;
    houseBadge.classList.remove('hidden');
  } else {
    houseBadge.classList.add('hidden');
  }

  document.getElementById('modal-weekly').textContent = `${s.weeklyPoints} pts`;
  document.getElementById('modal-alltime').textContent = `${s.allTimePoints} pts`;

  document.getElementById('modal-badges').innerHTML = (s.badges && s.badges.length)
    ? s.badges.map(b => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border-2 border-amber-200 text-amber-900 text-xs font-extrabold">⭐ ${escapeHtml(b)}${isAdmin ? ` <button type="button" onclick="removeBadgeFromStudent('${s.id}', '${escapeHtml(b)}')" title="Remove badge" class="ml-1 text-amber-700 hover:text-rose-600 font-extrabold">✕</button>` : ''}</span>`).join('')
    : `<span class="text-xs text-slate-400">No badges earned yet.</span>`;

  const modalAwarder = document.getElementById('modal-badge-awarder');
  if (modalAwarder) {
    if (isAdmin) {
      modalAwarder.classList.remove('hidden');
      modalAwarder.innerHTML = `
        <select id="modal-badge-select" onchange="const inp=document.getElementById('modal-badge-custom'); if(this.value==='__CUSTOM__'){inp.classList.remove('hidden');inp.focus();}else{inp.classList.add('hidden');inp.value='';}"
          class="px-2.5 py-1.5 rounded-xl border-2 border-amber-300 bg-amber-50/60 text-xs font-bold text-slate-800">
          <option value="">🏅 Select preset badge...</option>
          ${(appConfig.presetBadges || []).map(b => `<option value="${escapeHtml(b)}">⭐ ${escapeHtml(b)}</option>`).join('')}
          <option value="__CUSTOM__">✏️ Custom Badge...</option>
        </select>
        <input id="modal-badge-custom" type="text" placeholder="Custom badge name"
          onkeydown="if(event.key==='Enter'){ event.preventDefault(); const v=this.value.trim(); if(v) awardBadgeToStudent('${s.id}', v); }"
          class="hidden px-2.5 py-1.5 rounded-xl border-2 border-amber-300 text-xs font-semibold" />
        <button type="button" onclick="const sel=document.getElementById('modal-badge-select'); const inp=document.getElementById('modal-badge-custom'); const val=sel.value==='__CUSTOM__'?inp.value:sel.value; if(val.trim()) awardBadgeToStudent('${s.id}', val);"
          class="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 border-b-2 border-amber-600 text-slate-950 text-xs font-extrabold transition">
          + Award Badge
        </button>
      `;
    } else {
      modalAwarder.classList.add('hidden');
      modalAwarder.innerHTML = '';
    }
  }

  document.getElementById('modal-history').innerHTML = (s.history && s.history.length)
    ? s.history.map(item => `<div class="px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">${escapeHtml(item)}</div>`).join('')
    : `<div class="text-xs text-slate-400">No recent activity recorded.</div>`;

  document.getElementById('student-modal').classList.remove('hidden');
}

function closeStudentModal() {
  activeModalStudentId = null;
  document.getElementById('student-modal').classList.add('hidden');
}

// Boot Supabase & Option B Gate
initSupabase();