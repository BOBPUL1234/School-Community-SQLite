const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();
const db = new sqlite3.Database("./home.db");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    menu TEXT NOT NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS planner (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    text TEXT NOT NULL,
    done INTEGER DEFAULT 0
  )`);
});

router.post("/meals", (req, res) => {
  const meals = req.body;
  db.serialize(() => {
    const stmt = db.prepare("INSERT INTO meals (date, type, menu) VALUES (?, ?, ?)");
    try {
      for (const date in meals) {
        for (const type in meals[date]) {
          const menu = meals[date][type].join(", ");
          stmt.run(date, type, menu);
        }
      }
      stmt.finalize();
      res.json({ status: "ok" });
    } catch (err) {
      res.status(500).json({ error: "급식표 저장 실패" });
    }
  });
});

router.get("/meals", (req, res) => {
  db.all("SELECT date, type, menu FROM meals", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "급식표 조회 실패" });
    const result = {};
    rows.forEach(({ date, type, menu }) => {
      if (!result[date]) result[date] = {};
      result[date][type] = menu.split(", ");
    });
    res.json(result);
  });
});

router.get("/planner/:userId/:date", (req, res) => {
  const userId = req.session?.user?.id;
  const { date } = req.params;
  db.all(
    "SELECT id, text, done FROM planner WHERE user_id = ? AND date = ?",
    [userId, date],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "플래너 조회 실패" });
      res.json(rows);
    }
  );
});

router.put("/planner/done/:id", (req, res) => {
  const { id } = req.params;
  const { done } = req.body;
  db.run("UPDATE planner SET done = ? WHERE id = ?", [done ? 1 : 0, id], (err) => {
    if (err) return res.status(500).json({ error: "완료 상태 변경 실패" });
    res.json({ status: "updated" });
  });
});

router.post("/planner", (req, res) => {
  const { date, text } = req.body;
  const userId = req.session?.user?.id;
  if (!userId) return res.status(401).json({ error: "로그인 필요" });

  db.run(
    "INSERT INTO planner (user_id, date, text, done) VALUES (?, ?, ?, 0)",
    [userId, date, text],
    (err) => {
      if (err) return res.status(500).json({ error: "플래너 저장 실패" });
      res.json({ status: "ok" });
    }
  );
});

router.get("/planner/:date", (req, res) => {
  const userId = req.session?.user?.id;
  const { date } = req.params;
  if (!userId) return res.status(401).json({ error: "로그인 필요" });

  db.all(
    "SELECT id, text, done FROM planner WHERE user_id = ? AND date = ?",
    [userId, date],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "플래너 조회 실패" });
      res.json(rows);
    }
  );
});

router.delete("/planner/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM planner WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "플래너 삭제 실패" });
    res.json({ status: "deleted" });
  });
});

module.exports = router;
