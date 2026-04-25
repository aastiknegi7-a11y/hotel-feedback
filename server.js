const express = require('express');
const cors    = require('cors');
const { Pool } = require('pg');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Supabase PostgreSQL Connection ──────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Aastikn123%40@db.orgtrldbljwrxhjdqsge.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

// ── POST /api/feedback ──────────────────────────────
app.post('/api/feedback', async (req, res) => {
  const { rating, description, customer_name } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating 1-5 honi chahiye' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO feedback (rating, description, customer_name) VALUES ($1, $2, $3) RETURNING id`,
      [parseInt(rating), description || null, customer_name || null]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/feedback ───────────────────────────────
app.get('/api/feedback', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM feedback ORDER BY created_at DESC LIMIT 200`
    );
    res.json(result.rows);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/stats ──────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total,
        ROUND(AVG(rating)::numeric, 2) AS avg_rating,
        SUM(CASE WHEN rating=5 THEN 1 ELSE 0 END) AS five_star
      FROM feedback
    `);
    res.json(result.rows[0]);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'Negi Bhojnalaya Backend Running ✅' }));

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
