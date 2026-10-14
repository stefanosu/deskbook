// Smoke test of the API the frontend calls: the shapes it reads and the one rule that must hold.
// Your policy choices are not graded here. They are printed at the end so you can say what you decided.

const app = require('../backend/server');
const { users, desks } = require('../backend/data');

function bookableDay(minDaysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + minDaysAhead);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function main() {
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}/api`;
  const call = async (method, path, user, body) => {
    const headers = { 'Content-Type': 'application/json' };
    if (user) headers['X-User-Id'] = user;
    const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { status: res.status, data };
  };

  const results = [];
  const check = (name, pass, got) => results.push({ name, pass: Boolean(pass), got });
  const [ana, bo, cy] = users.map((u) => u.id);
  const day = bookableDay(2);
  const desk = desks[0];

  try {
    let r = await call('GET', '/users', ana);
    check('GET /api/users lists people with id and name', r.status === 200 && Array.isArray(r.data) && r.data.length === users.length && r.data.every((u) => u.id && u.name), r.status);

    r = await call('GET', `/desks?date=${day}`, ana);
    const shapeOk = r.status === 200 && Array.isArray(r.data) && r.data.length === desks.length
      && r.data.every((d) => d.id && d.label && typeof d.floor === 'number' && Array.isArray(d.features) && d.booking === null);
    check('GET /api/desks?date= returns every desk, free, in the shape the frontend reads', shapeOk, r.status);

    r = await call('GET', `/desks?date=${day}&floor=3`, ana);
    check('GET /api/desks?floor=3 returns only floor 3', r.status === 200 && Array.isArray(r.data) && r.data.length > 0 && r.data.every((d) => d.floor === 3), r.status);

    r = await call('GET', '/desks?date=next-tuesday', ana);
    check('A date that is not YYYY-MM-DD is a 400', r.status === 400, r.status);

    r = await call('POST', '/bookings', ana, { deskId: desk.id, date: day });
    const booking = r.data || {};
    check('POST /api/bookings books a free desk: 201 with id and date', r.status === 201 && booking.id && booking.date === day, r.status);

    r = await call('POST', '/bookings', bo, { deskId: desk.id, date: day });
    check('The same desk on the same date is a 409 with an error message', r.status === 409 && r.data && typeof r.data.error === 'string', r.status);

    r = await call('POST', '/bookings', bo, { deskId: 'd-999', date: day });
    check('An unknown desk is a 404 (or 400) with an error message', (r.status === 404 || r.status === 400) && r.data && typeof r.data.error === 'string', r.status);

    r = await call('POST', '/bookings', null, { deskId: desks[1].id, date: day });
    check('No X-User-Id is a 401 (or 400)', r.status === 401 || r.status === 400, r.status);

    r = await call('GET', `/desks?date=${day}`, bo);
    const seen = Array.isArray(r.data) ? r.data.find((d) => d.id === desk.id) : null;
    check('The booked desk shows booking.userId', seen && seen.booking && seen.booking.userId === ana, r.status);

    r = await call('GET', '/me/bookings', ana);
    const mine = Array.isArray(r.data) ? r.data.find((b) => b.id === booking.id) : null;
    check('GET /api/me/bookings includes it, with desk.label and desk.floor', r.status === 200 && mine && mine.date === day && mine.desk && mine.desk.label === desk.label && mine.desk.floor === desk.floor, r.status);

    r = await call('DELETE', `/bookings/${booking.id}`, bo);
    check("Someone else cannot cancel Ana's booking (403 or 404 with an error message)", (r.status === 403 || r.status === 404) && r.data && typeof r.data.error === 'string', r.status);

    r = await call('DELETE', `/bookings/${booking.id}`, ana);
    check('DELETE /api/bookings/:id by its owner is a 204', r.status === 204, r.status);

    r = await call('GET', `/desks?date=${day}`, bo);
    const freed = Array.isArray(r.data) ? r.data.find((d) => d.id === desk.id) : null;
    check('After the cancel the desk is free again', freed && freed.booking === null, r.status);

    r = await call('POST', '/bookings', bo, { deskId: desk.id, date: day });
    check('After the cancel someone else can book it', r.status === 201, r.status);

    const policy = [];
    r = await call('POST', '/bookings', bo, { deskId: desks[2].id, date: day });
    policy.push(`Bo books a second desk on the same date: ${r.status}`);
    r = await call('POST', '/bookings', cy, { deskId: desks[3].id, date: '2020-01-06' });
    policy.push(`Cy books a desk in 2020: ${r.status}`);
    r = await call('GET', `/desks?date=${day}`, cy);
    const other = Array.isArray(r.data) ? r.data.find((d) => d.booking && d.booking.userId === bo) : null;
    policy.push(`Cy can see who booked Bo's desk: ${other && other.booking.userName ? 'yes, ' + other.booking.userName : 'no'}`);

    const passed = results.filter((x) => x.pass).length;
    for (const x of results) console.log(`${x.pass ? 'PASS' : 'FAIL'}  ${x.name}${x.pass ? '' : `  (got ${x.got})`}`);
    console.log(`\n${passed}/${results.length} passed`);
    console.log('\nYour policy choices (not graded here, say what you decided and why):');
    for (const line of policy) console.log(`  ${line}`);
    process.exitCode = passed === results.length ? 0 : 1;
  } catch (err) {
    console.log(`The check crashed: ${err.message}`);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

main();
