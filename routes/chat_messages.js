const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();
const db = new sqlite3.Database("./app.db");

db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

router.post("/", (req, res) => {
  const { room_id, message } = req.body;
  const user_id = req.session?.user?.id || "guest";
  db.run(`INSERT INTO chat_messages (room_id, user_id, message) VALUES (?, ?, ?)`,
    [room_id, user_id, message], function (err) {
      if (err) return res.status(500).json({ error: "전송 실패" });
      db.get("SELECT * FROM chat_messages WHERE id = ?", [this.lastID], (e, row) => res.json(row));
    });
});

router.get("/:room_id", (req, res) => {
  db.all(`SELECT * FROM chat_messages WHERE room_id = ? ORDER BY created_at ASC`, [req.params.room_id], (err, rows) => {
    if (err) return res.status(500).json({ error: "조회 실패" });
    res.json(rows);
  });
});

module.exports = router;