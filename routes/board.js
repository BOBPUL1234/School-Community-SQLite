// ✅ SQLite 기반 게시판 router
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();
const db = new sqlite3.Database("./app.db");

// ✅ posts 테이블 생성
const init = () => {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      likes INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      is_bookmarked INTEGER DEFAULT 0,
      UNIQUE(user_id, target_type, target_id)
    )`);
  });
};
init();

// ✅ 게시글 목록 조회
router.get("/posts", (req, res) => {
  const userId = req.session?.user?.id;
  db.all("SELECT * FROM posts ORDER BY created_at DESC", [], async (err, rows) => {
    if (err) return res.status(500).json({ message: "❌ 게시글 목록 조회 실패", error: err.message });

    for (const post of rows) {
      const liked = await new Promise(resolve => {
        db.get(`SELECT 1 FROM likes WHERE user_id = ? AND target_type = 'post' AND target_id = ?`, [userId, post.id], (err, row) => {
          resolve(!!row);
        });
      });

      const bookmarked = await new Promise(resolve => {
        db.get(`SELECT 1 FROM likes WHERE user_id = ? AND target_type = 'post' AND target_id = ? AND is_bookmarked = 1`, [userId, post.id], (err, row) => {
          resolve(!!row);
        });
      });

      post.isLiked = liked;
      post.isBookmarked = bookmarked;
    }
    res.json(rows);
  });
});

// ✅ 게시글 작성
router.post("/post", (req, res) => {
  const { title, content } = req.body;
  const userId = req.session?.user?.id;
  if (!userId) return res.status(401).json({ message: "❌ 로그인 후 작성해주세요." });
  if (!title || !content) return res.status(400).json({ message: "❌ 제목, 내용은 필수입니다." });

  db.run(`INSERT INTO posts (title, content, author_id, created_at) VALUES (?, ?, ?, datetime('now'))`,
    [title, content, userId],
    function (err) {
      if (err) return res.status(500).json({ message: "❌ 게시글 저장 실패", error: err.message });
      db.get("SELECT * FROM posts WHERE id = ?", [this.lastID], (e, row) => res.json(row));
    });
});

// ✅ 게시글 삭제 + 관련 댓글 및 좋아요 삭제
router.delete("/post/:id", (req, res) => {
  const postId = req.params.id;

  db.serialize(() => {
    db.run("DELETE FROM comments WHERE post_id = ?", [postId]);
    db.run("DELETE FROM likes WHERE target_type = 'post' AND target_id = ?", [postId]);
    db.run("DELETE FROM posts WHERE id = ?", [postId], function (err) {
      if (err) return res.status(500).json({ message: "게시글 삭제 실패", error: err.message });
      res.json({ success: true });
    });
  });
});

// ✅ 북마크 토글 (post만)
router.post("/bookmarks", (req, res) => {
  const { targetId, bookmarked } = req.body;
  const userId = req.session?.user?.id;
  if (!userId) return res.status(401).json({ message: "로그인 필요" });

  if (bookmarked) {
    db.run(`INSERT OR IGNORE INTO likes (user_id, target_type, target_id, is_bookmarked) VALUES (?, 'post', ?, 1)`, [userId, targetId]);
  } else {
    db.run(`UPDATE likes SET is_bookmarked = 0 WHERE user_id = ? AND target_type = 'post' AND target_id = ?`, [userId, targetId]);
  }
  res.json({ success: true });
});

// ✅ 내가 쓴 게시물 조회
router.get("/my-posts", (req, res) => {
  const userId = req.session?.user?.id;
  if (!userId) return res.status(401).json({ message: "로그인이 필요합니다." });
  db.all("SELECT id, title, content, created_at FROM posts WHERE author_id = ? ORDER BY created_at DESC", [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: "내 글 조회 실패", error: err.message });
    res.json(rows);
  });
});

// ✅ 북마크된 게시글 목록
router.get("/bookmarked-posts", (req, res) => {
  const userId = req.session?.user?.id;
  if (!userId) return res.status(401).json({ message: "로그인 필요" });
  db.all(`SELECT p.* FROM posts p JOIN likes l ON p.id = l.target_id WHERE l.user_id = ? AND l.target_type = 'post' AND l.is_bookmarked = 1 ORDER BY p.created_at DESC`,
    [userId], (err, rows) => {
      if (err) return res.status(500).json({ message: "서버 오류", error: err.message });
      res.json(rows);
    });
});

// ✅ 통합 북마크 처리
router.post("/bookmark", (req, res) => {
  const { targetType, targetId, bookmarked } = req.body;
  const userId = req.session?.user?.id;
  if (!userId) return res.status(401).json({ message: "로그인 필요" });

  if (bookmarked) {
    db.run(`INSERT INTO likes (user_id, target_type, target_id, is_bookmarked) VALUES (?, ?, ?, 1) ON CONFLICT(user_id, target_type, target_id) DO UPDATE SET is_bookmarked = 1`,
      [userId, targetType, targetId]);
  } else {
    db.run(`UPDATE likes SET is_bookmarked = 0 WHERE user_id = ? AND target_type = ? AND target_id = ?`,
      [userId, targetType, targetId]);
  }
  res.json({ success: true });
});

module.exports = router;
