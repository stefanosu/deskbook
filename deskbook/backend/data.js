// The office: who works here and which desks exist. Loaded once at startup.

const users = [
  { id: 'u-ana', name: 'Ana Ruiz', team: 'Platform' },
  { id: 'u-bo', name: 'Bo Chen', team: 'Platform' },
  { id: 'u-cy', name: 'Cy Okafor', team: 'Design' },
  { id: 'u-dee', name: 'Dee Patel', team: 'Sales' },
  { id: 'u-eli', name: 'Eli Novak', team: 'Sales' },
  { id: 'u-fay', name: 'Fay Moreno', team: 'Finance' },
];

const FEATURES = [['monitor'], ['monitor', 'standing'], [], ['window'], ['monitor', 'window'], ['standing'], ['monitor'], []];

const desks = [];
for (const floor of [2, 3, 4]) {
  for (let n = 1; n <= 8; n += 1) {
    desks.push({
      id: `d-${floor}${String(n).padStart(2, '0')}`,
      label: `${floor}-${String(n).padStart(2, '0')}`,
      floor,
      features: FEATURES[n - 1],
    });
  }
}

module.exports = { users, desks };
