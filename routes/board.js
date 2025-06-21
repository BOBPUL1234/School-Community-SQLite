const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();
const db = new sqlite3.Database("./app.db");

db.run(`CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  likes INTEGER DEFAULT 0
)`);

router.post("/post", (req, res) => {
  const { title, content } = req.body;
  const userId = req.session?.user?.id;
  if (!userId) return res.status(401).json({ message: "로그인 필요" });

  db.run(`INSERT INTO posts (title, content, author_id, created_at) VALUES (?, ?, ?, datetime('now'))`,
    [title, content, userId],
    function (err) {
      if (err) return res.status(500).json({ message: "저장 실패" });
      db.get("SELECT * FROM posts WHERE id = ?", [this.lastID], (e, row) => res.json(row));
    });
});

router.get("/posts", (req, res) => {
  db.all("SELECT * FROM posts ORDER BY created_at DESC", [], (err, rows) => res.json(rows));
});

module.exports = router;