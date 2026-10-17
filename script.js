/* =========================================================================
   Student Dashboard — script.js
   Vanilla JS only. Data is stored in localStorage so it survives reloads.

   Sections:
     1. Sample data (12 students with scores across subjects)
     2. Storage helpers (load / save / reset)
     3. Utility functions (averages, ranking, formatting)
     4. State handling (loading / error / empty / dashboard)
     5. Render functions (rank card, stats, subject bars, leaderboard)
     6. Form handling (add a test score)
     7. Search / filter / sort wiring
     8. Boot — runs on page load
   ========================================================================= */

'use strict';

/* ---------- 1. Sample data --------------------------------------------- */

const SUBJECTS = ['Math', 'Science', 'English', 'History', 'Art'];

// The "current" student — the one whose dashboard this is.
const CURRENT_STUDENT_ID = 's01';

// 12 students, each with an array of test scores per subject.
function makeSampleData() {
  return [
    { id: 's01', name: 'Ava Mitchell',     section: '10-A', scores: { Math:[88,92,90], Science:[85,91,87], English:[90,88,92], History:[82,80,85], Art:[95,93,97] } },
    { id: 's02', name: 'Liam Patel',       section: '10-A', scores: { Math:[78,82,80], Science:[90,88,92], English:[72,75,70], History:[85,83,88], Art:[80,78,82] } },
    { id: 's03', name: 'Sophia Nguyen',    section: '10-B', scores: { Math:[95,93,97], Science:[92,90,94], English:[88,86,90], History:[90,88,92], Art:[85,83,87] } },
    { id: 's04', name: 'Noah Johnson',     section: '10-B', scores: { Math:[65,70,68], Science:[72,68,74], English:[80,78,82], History:[75,73,77], Art:[88,86,90] } },
    { id: 's05', name: 'Emma Williams',    section: '10-A', scores: { Math:[90,88,92], Science:[78,80,76], English:[95,93,97], History:[88,86,90], Art:[92,90,94] } },
    { id: 's06', name: 'Oliver Brown',     section: '10-C', scores: { Math:[72,75,70], Science:[68,72,70], English:[74,70,76], History:[80,78,82], Art:[78,76,80] } },
    { id: 's07', name: 'Isabella Garcia',  section: '10-C', scores: { Math:[84,82,86], Science:[88,86,90], English:[82,80,84], History:[90,88,92], Art:[70,68,72] } },
    { id: 's08', name: 'Ethan Martinez',   section: '10-B', scores: { Math:[91,89,93], Science:[84,82,86], English:[76,74,78], History:[82,80,84], Art:[75,73,77] } },
    { id: 's09', name: 'Mia Robinson',     section: '10-A', scores: { Math:[80,78,82], Science:[92,90,94], English:[90,88,92], History:[86,84,88], Art:[88,86,90] } },
    { id: 's10', name: 'Lucas Davis',      section: '10-C', scores: { Math:[60,65,62], Science:[70,68,72], English:[68,65,70], History:[72,70,74], Art:[80,78,82] } },
    { id: 's11', name: 'Charlotte Lee',    section: '10-B', scores: { Math:[88,86,90], Science:[90,88,92], English:[84,82,86], History:[78,76,80], Art:[92,90,94] } },
    { id: 's12', name: 'Amelia Thompson',  section: '10-A', scores: { Math:[76,74,78], Science:[82,80,84], English:[88,86,90], History:[84,82,86], Art:[86,84,88] } },
  ];
}

/* ---------- 2. Storage helpers ----------------------------------------- */

const STORAGE_KEY = 'student-dashboard-data-v1';

// Load students from localStorage, or fall back to sample data.
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not parse saved data, using sample data.', e);
  }
  return makeSampleData();
}

// Save the current students array to localStorage.
function saveData(students) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  } catch (e) {
    console.error('Could not save data to localStorage.', e);
  }
}

// Wipe localStorage and restore the original sample data.
function resetData() {
  localStorage.removeItem(STORAGE_KEY);
  return makeSampleData();
}

/* ---------- 3. Utility functions --------------------------------------- */

// Average of an array of numbers, rounded to 1 decimal.
function avg(nums) {
  if (!nums || nums.length === 0) return 0;
  const sum = nums.reduce((a, b) => a + b, 0);
  return Math.round((sum / nums.length) * 10) / 10;
}

// A student's average score across ALL subjects and tests.
function overallAverage(student) {
  const all = SUBJECTS.flatMap((s) => student.scores[s] || []);
  return avg(all);
}

// A student's average for a single subject.
function subjectAverage(student, subject) {
  return avg(student.scores[subject] || []);
}

// The class-wide average for one subject (across every student).
function classSubjectAverage(students, subject) {
  const all = students.flatMap((s) => s.scores[subject] || []);
  return avg(all);
}

// Return students sorted by overall average (descending) with a rank.
function rankStudents(students) {
  const sorted = [...students].sort((a, b) => overallAverage(b) - overallAverage(a));
  let prevAvg = null;
  let prevRank = 0;
  return sorted.map((s, i) => {
    const a = overallAverage(s);
    // Equal averages get the same rank (standard competition ranking).
    if (prevAvg !== null && a === prevAvg) {
      return { ...s, rank: prevRank };
    }
    prevAvg = a;
    prevRank = i + 1;
    return { ...s, rank: i + 1 };
  });
}

// Find the subject with the highest average for a student.
function bestSubject(student) {
  let best = null;
  let bestAvg = -1;
  SUBJECTS.forEach((subj) => {
    const a = subjectAverage(student, subj);
    if (a > bestAvg) { bestAvg = a; best = subj; }
  });
  return best;
}

// Compare the student's first test vs last test to show a trend.
function trendInfo(student) {
  const all = SUBJECTS.flatMap((s) => student.scores[s] || []);
  if (all.length < 2) return '—';
  const first = all[0];
  const last = all[all.length - 1];
  const diff = Math.round((last - first) * 10) / 10;
  if (diff > 0) return '+' + diff;
  if (diff < 0) return diff.toString();
  return '0';
}

/* ---------- 4. State handling ------------------------------------------ */

// Helper to toggle a "hidden" class on an element by id.
function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }

// Decide which state to show based on the data.
function showState(students) {
  hide('loadingState');
  if (!students || students.length === 0) {
    hide('dashboard');
    hide('errorState');
    show('emptyState');
    return;
  }
  hide('emptyState');
  hide('errorState');
  show('dashboard');
}

/* ---------- 5. Render functions ---------------------------------------- */

// --- Rank card ---
function renderRankCard(students) {
  const ranked = rankStudents(students);
  const me = ranked.find((s) => s.id === CURRENT_STUDENT_ID);
  const classAvg = avg(students.map(overallAverage));

  document.getElementById('rankNumber').textContent = '#' + (me ? me.rank : '—');
  document.getElementById('rankTotal').textContent = students.length;
  document.getElementById('rankStudentName').textContent = me ? me.name : '—';
  document.getElementById('rankMedal').textContent = '#' + (me ? me.rank : '—');
  document.getElementById('classAverage').textContent = Math.round(classAvg) + '%';
}

// --- Stats cards ---
function renderStats(students) {
  const me = students.find((s) => s.id === CURRENT_STUDENT_ID);
  if (!me) return;

  const allScores = SUBJECTS.flatMap((s) => me.scores[s] || []);
  document.getElementById('statOverall').textContent = Math.round(overallAverage(me)) + '%';
  document.getElementById('statTests').textContent = allScores.length;
  document.getElementById('statBest').textContent = bestSubject(me) || '—';

  const trend = trendInfo(me);
  const trendEl = document.getElementById('statTrend');
  trendEl.textContent = trend;
  trendEl.style.color =
    trend.startsWith('+') ? 'var(--success)' :
    trend.startsWith('-') ? 'var(--error)' : 'var(--neutral-900)';
}

// --- Subject bars (student vs class average) ---
function renderSubjectBars(students) {
  const me = students.find((s) => s.id === CURRENT_STUDENT_ID);
  const wrap = document.getElementById('subjectBars');
  wrap.innerHTML = '';

  SUBJECTS.forEach((subj) => {
    const myAvg = subjectAverage(me, subj);
    const clsAvg = classSubjectAverage(students, subj);

    // Each row shows: subject name, my avg, class avg, then a bar.
    const row = document.createElement('div');
    row.className = 'subject-row';
    row.innerHTML = `
      <div class="subject-meta">
        <span class="subject-name">${subj}</span>
        <span class="subject-vals">You: ${myAvg}% &middot; Class: ${clsAvg}%</span>
      </div>
      <div class="subject-track">
        <div class="subject-fill" style="width:0%"></div>
        <div class="subject-avg-marker" style="left:${clsAvg}%">
          <span class="subject-avg-label">${clsAvg}%</span>
        </div>
      </div>
    `;
    wrap.appendChild(row);

    // Animate the fill in on the next frame for a nice effect.
    requestAnimationFrame(() => {
      row.querySelector('.subject-fill').style.width = myAvg + '%';
    });
  });
}

// --- Leaderboard (with search, filter, sort) ---
let currentSearch = '';
let currentSection = 'all';
let currentSort = 'average-desc';

function renderLeaderboard(students) {
  const ranked = rankStudents(students);
  let rows = ranked;

  // Filter by section.
  if (currentSection !== 'all') {
    rows = rows.filter((s) => s.section === currentSection);
  }

  // Filter by search text (name, case-insensitive).
  if (currentSearch.trim()) {
    const q = currentSearch.trim().toLowerCase();
    rows = rows.filter((s) => s.name.toLowerCase().includes(q));
  }

  // Sort.  Note: rank is based on overall average, so re-sorting may
  // reorder rows without changing their rank number.
  rows = [...rows].sort((a, b) => {
    switch (currentSort) {
      case 'average-asc':  return overallAverage(a) - overallAverage(b);
      case 'name-asc':     return a.name.localeCompare(b.name);
      case 'name-desc':    return b.name.localeCompare(a.name);
      case 'average-desc':
      default:             return overallAverage(b) - overallAverage(a);
    }
  });

  const body = document.getElementById('leaderboardBody');
  body.innerHTML = '';

  const noResults = document.getElementById('noResults');
  if (rows.length === 0) {
    noResults.classList.remove('hidden');
    return;
  }
  noResults.classList.add('hidden');

  rows.forEach((s) => {
    const tr = document.createElement('tr');
    if (s.id === CURRENT_STUDENT_ID) tr.classList.add('you-row');

    // Medal styling for the top 3.
    let badgeClass = '';
    if (s.rank === 1) badgeClass = 'top1';
    else if (s.rank === 2) badgeClass = 'top2';
    else if (s.rank === 3) badgeClass = 'top3';

    const label = s.id === CURRENT_STUDENT_ID ? s.name + ' (you)' : s.name;
    const testCount = SUBJECTS.flatMap((sub) => s.scores[sub] || []).length;

    tr.innerHTML = `
      <td class="col-rank"><span class="rank-badge ${badgeClass}">${s.rank}</span></td>
      <td class="col-name">${label}</td>
      <td class="col-section">${s.section}</td>
      <td class="col-avg">${Math.round(overallAverage(s))}%</td>
      <td class="col-tests">${testCount}</td>
    `;
    body.appendChild(tr);
  });
}

// --- Section filter dropdown ---
function populateSectionFilter(students) {
  const select = document.getElementById('sectionFilter');
  const sections = [...new Set(students.map((s) => s.section))].sort();
  // Keep the "All sections" option, then add each unique section.
  select.innerHTML = '<option value="all">All sections</option>';
  sections.forEach((sec) => {
    const opt = document.createElement('option');
    opt.value = sec;
    opt.textContent = sec;
    select.appendChild(opt);
  });
}

// --- Add-score form dropdowns ---
function populateFormDropdowns(students) {
  const studentSel = document.getElementById('formStudent');
  studentSel.innerHTML = '';
  students.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name + (s.id === CURRENT_STUDENT_ID ? ' (you)' : '');
    studentSel.appendChild(opt);
  });
  // Default to the current student.
  studentSel.value = CURRENT_STUDENT_ID;

  const subjectSel = document.getElementById('formSubject');
  subjectSel.innerHTML = '';
  SUBJECTS.forEach((subj) => {
    const opt = document.createElement('option');
    opt.value = subj;
    opt.textContent = subj;
    subjectSel.appendChild(opt);
  });
}

/* ---------- 6. Form handling ------------------------------------------- */

// Show / hide the add-score form panel.
function toggleForm(visible) {
  const panel = document.getElementById('addFormPanel');
  if (visible) {
    panel.classList.remove('hidden');
    document.getElementById('formScore').focus();
  } else {
    panel.classList.add('hidden');
  }
}

// Handle the form submit: add a score, save, and re-render.
function handleScoreSubmit(e, students) {
  e.preventDefault();
  const studentId = document.getElementById('formStudent').value;
  const subject = document.getElementById('formSubject').value;
  const scoreVal = document.getElementById('formScore').value;
  const msgEl = document.getElementById('formMessage');

  const score = Number(scoreVal);

  // --- Validate the input ---
  if (!studentId || !subject || scoreVal === '') {
    showFormMessage(msgEl, 'Please fill in all fields.', 'error');
    return;
  }
  if (isNaN(score) || score < 0 || score > 100) {
    showFormMessage(msgEl, 'Score must be a number between 0 and 100.', 'error');
    return;
  }

  // --- Find the student and append the score ---
  const student = students.find((s) => s.id === studentId);
  if (!student) {
    showFormMessage(msgEl, 'Student not found.', 'error');
    return;
  }
  if (!student.scores[subject]) student.scores[subject] = [];
  student.scores[subject].push(score);

  // --- Persist and refresh the UI ---
  saveData(students);
  showFormMessage(msgEl, 'Score saved! The leaderboard has been updated.', 'success');

  // Clear the score input so the next entry is quick.
  document.getElementById('formScore').value = '';

  // Re-render everything so ranks and stats update live.
  renderAll(students);
}

function showFormMessage(el, text, type) {
  el.textContent = text;
  el.className = 'form-message ' + type;
  el.classList.remove('hidden');
  // Auto-hide the message after 3 seconds.
  setTimeout(() => el.classList.add('hidden'), 3000);
}

/* ---------- 7. Search / filter / sort wiring --------------------------- */

function wireControls(students) {
  // Search input — updates the leaderboard as you type.
  document.getElementById('searchInput').addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderLeaderboard(students);
  });

  // Section filter dropdown.
  document.getElementById('sectionFilter').addEventListener('change', (e) => {
    currentSection = e.target.value;
    renderLeaderboard(students);
  });

  // Sort dropdown.
  document.getElementById('sortBy').addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderLeaderboard(students);
  });

  // Header "Add test score" button toggles the form.
  document.getElementById('addToggleBtn').addEventListener('click', () => {
    const panel = document.getElementById('addFormPanel');
    toggleForm(panel.classList.contains('hidden'));
  });

  // Close button inside the form.
  document.getElementById('closeFormBtn').addEventListener('click', () => toggleForm(false));

  // Empty-state button also opens the form.
  document.getElementById('emptyAddBtn').addEventListener('click', () => {
    showState(students);
    toggleForm(true);
  });

  // Form submit.
  document.getElementById('scoreForm').addEventListener('submit', (e) => handleScoreSubmit(e, students));

  // Reset button — restores sample data.
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Reset all data back to the original sample?')) {
      const fresh = resetData();
      // Repopulate dropdowns and re-render.
      populateSectionFilter(fresh);
      populateFormDropdowns(fresh);
      renderAll(fresh);
      wireControlsFresh(fresh);
    }
  });
}

// After a reset we need to re-wire controls because the students
// array reference changed.  We simply re-attach listeners that depend
// on the new array.
function wireControlsFresh(students) {
  // Replace the old listeners by cloning each node (removes all listeners).
  ['searchInput', 'sectionFilter', 'sortBy'].forEach((id) => {
    const old = document.getElementById(id);
    const clone = old.cloneNode(true);
    old.parentNode.replaceChild(clone, old);
  });
  // Re-attach.
  document.getElementById('searchInput').addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderLeaderboard(students);
  });
  document.getElementById('sectionFilter').addEventListener('change', (e) => {
    currentSection = e.target.value;
    renderLeaderboard(students);
  });
  document.getElementById('sortBy').addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderLeaderboard(students);
  });
  // Re-attach the form submit with the new students array.
  const form = document.getElementById('scoreForm');
  const freshForm = form.cloneNode(true);
  form.parentNode.replaceChild(freshForm, form);
  freshForm.addEventListener('submit', (e) => handleScoreSubmit(e, students));
}

/* ---------- 8. Master render + boot ------------------------------------ */

// Render every part of the dashboard.
function renderAll(students) {
  renderRankCard(students);
  renderStats(students);
  renderSubjectBars(students);
  renderLeaderboard(students);
}

// Boot: runs once when the page loads.
function boot() {
  // 1. Show the loading state immediately.
  show('loadingState');

  // 2. Simulate a brief loading delay so the loading state is visible.
  setTimeout(() => {
    try {
      const students = loadData();

      // 3. Choose which state to show.
      showState(students);
      if (students.length === 0) return;

      // 4. Populate dropdowns.
      populateSectionFilter(students);
      populateFormDropdowns(students);

      // 5. Render the dashboard.
      renderAll(students);

      // 6. Wire up all interactive controls.
      wireControls(students);
    } catch (err) {
      console.error(err);
      hide('loadingState');
      hide('dashboard');
      hide('emptyState');
      show('errorState');
    }
  }, 500);
}

// Start the app when the DOM is ready.
document.addEventListener('DOMContentLoaded', boot);
