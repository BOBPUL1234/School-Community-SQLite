const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();
const db = new sqlite3.Database("./app.db");

db.run(`CREATE TABLE IF NOT EXISTS likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  UNIQUE(user_id, target_type, target_id)
)`);

router.post("/", (req, res) => {
  const { targetType, targetId, liked } = req.body;
  const userId = req.session?.user?.id;
  if (!userId) return res.status(401).json({ message: "로그인 필요" });

  db.serialize(() => {
    if (liked) {
      db.run(`INSERT OR IGNORE INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)`,
        [userId, targetType, targetId]);
    } else {
      db.run(`DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?`,
        [userId, targetType, targetId]);
    }
    db.get(`SELECT COUNT(*) as cnt FROM likes WHERE target_type = ? AND target_id = ?`,
      [targetType, targetId],
      (err, row) => {
        const likeCount = row?.cnt || 0;
        const updateQuery = `UPDATE posts SET likes = ? WHERE id = ?`;
        db.run(updateQuery, [likeCount, targetId]);
        res.json({ likes: likeCount });
      });
  });
});

module.exports = router;