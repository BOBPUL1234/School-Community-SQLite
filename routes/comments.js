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

router.get("/my-comments", (req, res) => {
  const userId = req.session?.user?.id;
  if (!userId) return res.status(401).json({ message: "로그인 필요" });

  db.all(
    "SELECT * FROM comments WHERE user_id = ? AND parent_id IS NULL ORDER BY created_at DESC",
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "조회 실패" });
      res.json(rows);
    }
  );
});

router.get("/:post_id", (req, res) => {
  const userId = req.session?.user?.id;
  const postId = req.params.post_id;
  db.all(
    "SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC",
    [postId],
    async (err, rows) => {
      if (err) return res.status(500).json({ message: "조회 실패" });
      for (const row of rows) {
        row.isLiked = false;
      }
      res.json(rows);
    }
  );
});

router.post("/", (req, res) => {
  const { post_id, parent_id, text } = req.body;
  const userId = req.session?.user?.id || "anonymous";
  const nickname = req.session?.user?.nickname || "익명";

  db.run(
    `INSERT INTO comments (post_id, parent_id, user_id, nickname, text) VALUES (?, ?, ?, ?, ?)`,
    [post_id, parent_id || null, userId, nickname, text],
    function (err) {
      if (err) return res.status(500).json({ error: "저장 실패" });
      db.get("SELECT * FROM comments WHERE id = ?", [this.lastID], (e, row) => res.json(row));
    }
  );
});

router.delete("/:id", (req, res) => {
  db.run("DELETE FROM comments WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: "삭제 실패" });
    res.json({ success: true });
  });
});

module.exports = router;