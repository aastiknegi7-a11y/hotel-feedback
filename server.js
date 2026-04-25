// ═══════════════════════════════════════════════════════
//  NEGI BHOJNALAYA — Node.js Backend
//  Stack: Express + better-sqlite3 (SQLite, no setup needed)
//  Netlify pe sirf frontend jayega, ye backend alag host karo
//  Free hosting: Render.com / Railway.app / Cyclic.sh
// ═══════════════════════════════════════════════════════

const express = require('express');
const cors    = require('cors');
const Database = require('better-sqlite3');
const path    = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────
app.use(cors({
  origin: '*'   // Production me apna Netlify URL dalo
}));
app.use(express.json());

// ── Database Setup ──────────────────────────────────────
const db = new Database(path.join(__dirname, 'negi_feedback.db'));

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS feedback (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    rating        INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    description   TEXT,
    customer_name TEXT,
    created_at    DATETIME DEFAULT (datetime('now','localtime'))
  );
`);

// ── Routes ──────────────────────────────────────────────

// POST /api/feedback   — naya feedback save karo
app.post('/api/feedback', (req, res) => {
  const { rating, description, customer_name } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating 1-5 ke beech honi chahiye' });
  }

  const stmt = db.prepare(`
    INSERT INTO feedback (rating, description, customer_name)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(
    parseInt(rating),
    description || null,
    customer_name || null
  );

  res.json({ success: true, id: result.lastInsertRowid });
});

// GET /api/feedback    — saara feedback lao (latest first)
app.get('/api/feedback', (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM feedback ORDER BY created_at DESC LIMIT 200
  `).all();
  res.json(rows);
});

// GET /api/stats       — aggregate stats
app.get('/api/stats', (req, res) => {
  const stats = db.prepare(`
    SELECT
      COUNT(*)              AS total,
      ROUND(AVG(rating),2)  AS avg_rating,
      SUM(rating = 5)       AS five_star,
      SUM(rating = 4)       AS four_star,
      SUM(rating = 3)       AS three_star,
      SUM(rating = 2)       AS two_star,
      SUM(rating = 1)       AS one_star
    FROM feedback
  `).get();
  res.json(stats);
});

// ── Start ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Negi Bhojnalaya backend running on port ${PORT}`);
});

// ═══════════════════════════════════════════════════════
//  SQL SCHEMA (MySQL/PostgreSQL version)
//  Agar MySQL use karna ho toh ye SQL run karo
// ═══════════════════════════════════════════════════════
/*

-- DATABASE BANAO
CREATE DATABASE negi_bhojnalaya CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE negi_bhojnalaya;

-- FEEDBACK TABLE
CREATE TABLE feedback (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  rating        TINYINT     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  description   TEXT,
  customer_name VARCHAR(100),
  created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_rating     (rating),
  INDEX idx_created_at (created_at)
);

-- USEFUL QUERIES

-- Saara feedback latest pehle
SELECT * FROM feedback ORDER BY created_at DESC;

-- Average rating
SELECT ROUND(AVG(rating), 2) AS avg_rating FROM feedback;

-- Har rating ka count
SELECT rating, COUNT(*) AS total
FROM feedback
GROUP BY rating
ORDER BY rating DESC;

-- Aaj ka feedback
SELECT * FROM feedback
WHERE DATE(created_at) = CURDATE()
ORDER BY created_at DESC;

-- Is hafte ka summary
SELECT DATE(created_at) AS din, COUNT(*) AS count, ROUND(AVG(rating),1) AS avg
FROM feedback
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at)
ORDER BY din DESC;

*/
