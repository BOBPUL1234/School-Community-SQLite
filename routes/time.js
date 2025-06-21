const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();
const db = new sqlite3.Database("./app.db");

db.run(`CREATE TABLE IF NOT EXISTS timetable (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  cell_key TEXT NOT NULL,
  subject TEXT NOT NULL,
  UNIQUE(user_id, cell_key)
)`);

router.post("/save", (req, res) => {
  const { user_id, cell_key, subject } = req.body;
  db.run(`INSERT INTO timetable (user_id, cell_key, subject) VALUES (?, ?, ?)
          ON CONFLICT(user_id, cell_key) DO UPDATE SET subject = ?`,
    [user_id, cell_key, subject, subject],
    (err) => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true });
    });
});

router.get("/:user_id", (req, res) => {
  const user_id = req.params.user_id;
  db.all(`SELECT cell_key, subject FROM timetable WHERE user_id = ?`, [user_id], (err, rows) => {
    const data = {};
    for (const row of rows) data[row.cell_key] = row.subject;
    res.json(data);
  });
});

module.exports = router;