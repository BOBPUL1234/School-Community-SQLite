const express = require("express");
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();
const db = new sqlite3.Database("./app.db");

db.run(`CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  nickname TEXT NOT NULL
)`);

router.post("/signup", (req, res) => {
  const { id, password, nickname } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  db.run(`INSERT INTO users (id, password, nickname) VALUES (?, ?, ?)`, [id, hash, nickname], function (err) {
    if (err) return res.status(400).json({ error: "이미 존재하는 ID" });
    res.json({ message: "가입 완료" });
  });
});

router.post("/login", (req, res) => {
  const { id, password } = req.body;
  db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, user) => {
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "로그인 실패" });
    }
    req.session.user = { id: user.id, nickname: user.nickname };
    res.json({ message: "로그인 성공", user: req.session.user });
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ message: "로그아웃 완료" }));
});

module.exports = router;