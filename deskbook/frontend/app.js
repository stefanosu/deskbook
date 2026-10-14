// Deskbook frontend. Do not modify this file: build the backend it calls.

const API = '/api';
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
let currentUser = localStorage.getItem('deskbook.user') || '';

async function call(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUser },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function show(text, isError = false) {
  $('message').textContent = text;
  $('message').className = isError ? 'error' : '';
}

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function loadUsers() {
  const users = await call('GET', '/users');
  $('user').innerHTML = users.map((u) => `<option value="${esc(u.id)}">${esc(u.name)}</option>`).join('');
  if (!users.some((u) => u.id === currentUser)) currentUser = users.length ? users[0].id : '';
  $('user').value = currentUser;
}

async function loadDesks() {
  const query = new URLSearchParams({ date: $('date').value });
  if ($('floor').value) query.set('floor', $('floor').value);
  const desks = await call('GET', `/desks?${query}`);

  if ($('floor').options.length === 1) {
    const floors = [...new Set(desks.map((d) => d.floor))].sort((a, b) => a - b);
    $('floor').innerHTML += floors.map((f) => `<option value="${f}">Floor ${f}</option>`).join('');
  }

  $('desks').innerHTML = desks.map((d) => {
    const taken = d.booking !== null;
    const mine = taken && d.booking.userId === currentUser;
    let status = 'Free';
    if (mine) status = 'Your desk';
    else if (taken) status = d.booking.userName ? `Booked by ${esc(d.booking.userName)}` : 'Booked';
    const features = d.features.length ? ` &middot; ${d.features.map(esc).join(', ')}` : '';
    const button = taken ? '' : `<button data-desk="${esc(d.id)}">Book</button>`;
    return `<li class="${mine ? 'mine' : taken ? 'taken' : 'free'}"><span><b>${esc(d.label)}</b> floor ${d.floor}${features}</span><span>${status}</span>${button}</li>`;
  }).join('') || '<li>No desks match.</li>';
}

async function loadMine() {
  const bookings = await call('GET', '/me/bookings');
  $('mine').innerHTML = bookings.map((b) => (
    `<li><span>${esc(b.date)}: desk <b>${esc(b.desk.label)}</b>, floor ${b.desk.floor}</span><button data-cancel="${esc(b.id)}">Cancel</button></li>`
  )).join('') || '<li>No bookings yet.</li>';
}

async function refresh() {
  try {
    await Promise.all([loadDesks(), loadMine()]);
  } catch (err) {
    show(err.message, true);
  }
}

$('desks').addEventListener('click', async (event) => {
  const deskId = event.target.dataset.desk;
  if (!deskId) return;
  try {
    const booking = await call('POST', '/bookings', { deskId, date: $('date').value });
    show(`Booked for ${booking.date}.`);
  } catch (err) {
    show(err.message, true);
  }
  refresh();
});

$('mine').addEventListener('click', async (event) => {
  const bookingId = event.target.dataset.cancel;
  if (!bookingId) return;
  try {
    await call('DELETE', `/bookings/${encodeURIComponent(bookingId)}`);
    show('Booking cancelled.');
  } catch (err) {
    show(err.message, true);
  }
  refresh();
});

$('user').addEventListener('change', () => {
  currentUser = $('user').value;
  localStorage.setItem('deskbook.user', currentUser);
  show('');
  refresh();
});
$('date').addEventListener('change', () => { show(''); refresh(); });
$('floor').addEventListener('change', refresh);

(async () => {
  $('date').value = tomorrow();
  try {
    await loadUsers();
    await refresh();
  } catch (err) {
    show(err.message, true);
  }
})();
