const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();
const db = new sqlite3.Database("./app.db");

db.run(`CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  parent_id INTEGER,
  user_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

router.post("/", (req, res) => {
  const { post_id, parent_id, text } = req.body;
  const userId = req.session?.user?.id || "anonymous";
  const nickname = req.session?.user?.nickname || "익명";
  db.run(`INSERT INTO comments (post_id, parent_id, user_id, nickname, text) VALUES (?, ?, ?, ?, ?)`,
    [post_id, parent_id || null, userId, nickname, text],
    function (err) {
      if (err) return res.status(500).json({ error: "저장 실패" });
      db.get("SELECT * FROM comments WHERE id = ?", [this.lastID], (e, row) => res.json(row));
    });
});

router.get("/:post_id", (req, res) => {
  db.all(`SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC`, [req.params.post_id], (err, rows) => {
    if (err) return res.status(500).json({ error: "조회 실패" });
    const nested = rows.reduce((acc, row) => {
      const parent = row.parent_id || 0;
      acc[parent] = acc[parent] || [];
      acc[parent].push(row);
      return acc;
    }, {});
    res.json(nested);
  });
});

module.exports = router;