const path = require('path');
const express = require('express');
const { users, desks } = require('./data');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// TODO: the API the frontend needs.

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Deskbook running on http://localhost:${port}`));
}

module.exports = app;
