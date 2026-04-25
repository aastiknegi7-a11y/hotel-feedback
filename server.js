const express = require('express');
const cors    = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Database ────────────────────────────────────────
const db = new sqlite3.Database(path.join(__dirname, 'feedback.db'));

db.run(`
  CREATE TABLE IF NOT EXISTS feedback (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    rating        INTEGER NOT NULL,
    description   TEXT,
    customer_name TEXT,
    created_at    DATETIME DEFAULT (datetime('now','localtime'))
  )
`);

// ── POST /api/feedback ──────────────────────────────
app.post('/api/feedback', (req, res) => {
  const { rating, description, customer_name } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating 1-5 honi chahiye' });
  }
  db.run(
    `INSERT INTO feedback (rating, description, customer_name) VALUES (?, ?, ?)`,
    [parseInt(rating), description || null, customer_name || null],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// ── GET /api/feedback ───────────────────────────────
app.get('/api/feedback', (req, res) => {
  db.all(`SELECT * FROM feedback ORDER BY created_at DESC LIMIT 200`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ── GET /api/stats ──────────────────────────────────
app.get('/api/stats', (req, res) => {
  db.get(`
    SELECT
      COUNT(*) AS total,
      ROUND(AVG(rating),2) AS avg_rating,
      SUM(CASE WHEN rating=5 THEN 1 ELSE 0 END) AS five_star
    FROM feedback
  `, [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

// ── Health check ────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'Negi Bhojnalaya Backend Running ✅' }));

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
