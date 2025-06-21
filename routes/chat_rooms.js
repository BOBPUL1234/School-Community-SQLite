const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();
const db = new sqlite3.Database("./app.db");

db.run(`CREATE TABLE IF NOT EXISTS chat_rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

router.post("/", (req, res) => {
  const { name } = req.body;
  db.run(`INSERT INTO chat_rooms (name) VALUES (?)`, [name], function (err) {
    if (err) return res.status(500).json({ error: "방 생성 실패" });
    res.json({ id: this.lastID, name });
  });
});

router.get("/", (req, res) => {
  db.all("SELECT * FROM chat_rooms ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "조회 실패" });
    res.json(rows);
  });
});

module.exports = router;