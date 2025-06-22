const express = require("express");
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();

const allowedStudents = [
    { id: "1111", name: "배준형" },
    { id: "1115", name: "이노아" },
    { id: "1123", name: "한지후" },
    { id: "1210", name: "노윤성" },
    { id: "1212", name: "박창익" },
    { id: "1308", name: "김우찬" },
    { id: "1313", name: "신서우" },
    { id: "1316", name: "오제홍" },
    { id: "1321", name: "정재문" },
    { id: "1407", name: "김채원" },
    { id: "1410", name: "이원후" },
    { id: "1412", name: "이종건" },
    { id: "1505", name: "김성윤" },
    { id: "1522", name: "최유하" },
    { id: "1606", name: "김준완" },
    { id: "1607", name: "김지호" },
    { id: "1614", name: "염도윤" },
    { id: "1705", name: "김민준" },
    { id: "1721", name: "조영림" },
    { id: "1802", name: "구성민" },
    { id: "1804", name: "김민결" },
    { id: "1815", name: "유재하" },
    { id: "2109", name: "박시훈" },
    { id: "2114", name: "이두혁" },
    { id: "2305", name: "김영우" },
    { id: "2306", name: "김호연" },
    { id: "2309", name: "박제민" },
    { id: "2324", name: "홍지원" },
    { id: "2325", name: "허강" },
    { id: "2517", name: "송유빈" },
    { id: "2602", name: "김도원" },
    { id: "2606", name: "박민훈" },
    { id: "2607", name: "김민재" },
    { id: "2702", name: "김건" },
    { id: "2721", name: "최가람" },
    { id: "2803", name: "김준근" },
    { id: "2806", name: "류지완" },
    { id: "2814", name: "윤성운" },
    { id: "2818", name: "조승우" },
    { id: "3108", name: "김승민" },
    { id: "3118", name: "이현수" },
    { id: "3120", name: "장윤서" },
    { id: "3123", name: "정재훈" },
    { id: "3206", name: "김승준" },
    { id: "3221", name: "조원희" },
    { id: "3222", name: "진민호" },
    { id: "3402", name: "김동건" },
    { id: "3406", name: "김영동" },
    { id: "3506", name: "김보성" },
    { id: "3508", name: "김은재" },
    { id: "3509", name: "박정빈" },
    { id: "3510", name: "백승원" },
    { id: "3519", name: "임창제" },
    { id: "3523", name: "최민준" },
    { id: "3610", name: "배정훈" },
    { id: "3623", name: "김성현" },
    { id: "3701", name: "강민재" },
    { id: "3705", name: "류민준" },
    { id: "3709", name: "박성현" },
    { id: "3715", name: "장진" },
    { id: "3817", name: "정지원" },
    { id: "3820", name: "진지윤" },
    { id: "3904", name: "김민재" },
    { id: "3911", name: "신지훈" },
    { id: "3912", name: "유재범" },
    { id: "3917", name: "정성득" },
    { id: "3919", name: "차승민" },
    { id: "3922", name: "황수현" }
];

const TEACHER_SECURITY_KEY = "TCH-2025-SECURE";
const allowedTeachers = ["이세민"];

// 회원가입 (학생)
router.post("/signup/student", (req, res) => {
  const { id, password, nickname } = req.body;

  const isAllowed = allowedStudents.some(student => student.id === id && student.name === nickname);
  if (!isAllowed) return res.status(403).json({ error: "허용된 학생이 아닙니다" });

  const hash = bcrypt.hashSync(password, 10);
  db.run("INSERT INTO users (id, password, nickname, role) VALUES (?, ?, ?, ?)", 
    [id, hash, nickname, "student"], function (err) {
      if (err) return res.status(400).json({ error: "이미 존재하는 ID" });
      res.json({ success: true, message: "학생 가입 완료" });
  });
});

// 회원가입 (교사)
router.post("/signup/teacher", (req, res) => {
  const { id, password, nickname, key } = req.body;
  if (key !== TEACHER_SECURITY_KEY) {
    return res.status(403).json({ error: "보안 키가 일치하지 않습니다" });
  }

  const isAllowed = allowedTeachers.some(teacher => teacher.name === nickname);
  if (!isAllowed) return res.status(403).json({ error: "허용된 교사가 아닙니다" });

  const hash = bcrypt.hashSync(password, 10);
  db.run("INSERT INTO users (id, password, nickname, role) VALUES (?, ?, ?, ?)", 
    [hash, nickname, "teacher"], function (err) {
      if (err) return res.status(400).json({ error: "이미 존재하는 ID" });
      res.json({ success: true, message: "교사 가입 완료" });
  });
});


// 로그인 공통 함수
function login(role, req, res) {
  const { id, password } = req.body;
  db.get("SELECT * FROM users WHERE id = ? AND role = ?", [id, role], (err, user) => {
    if (err) return res.status(500).json({ error: "서버 오류" });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "로그인 실패" });
    }
    req.session.user = { id: user.id, nickname: user.nickname, role: user.role };
    res.json({ message: "로그인 성공", user: req.session.user });
  });
}

router.post("/login/student", (req, res) => login("student", req, res));
router.post("/login/teacher", (req, res) => login("teacher", req, res));

// 로그아웃
router.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "로그아웃 완료" });
});

// 프로필 확인
router.get("/profile", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "로그인이 필요합니다" });
  }
  res.json({ user: req.session.user });
});

// 비밀번호 변경
router.post("/change-password", (req, res) => {
  const { id, currentPassword, newPassword } = req.body;
  db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
    if (err) return res.status(500).json({ error: "서버 오류" });
    if (!user || !bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(403).json({ error: "기존 비밀번호가 일치하지 않습니다" });
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    db.run("UPDATE users SET password = ? WHERE id = ?", [hash, id], function (err) {
      if (err) return res.status(500).json({ error: "비밀번호 변경 실패" });
      res.json({ message: "비밀번호 변경 완료" });
    });
  });
});

module.exports = router;
