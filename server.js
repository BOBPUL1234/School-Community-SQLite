const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ["http://localhost:3000", "https://school-community-sqlite.onrender.com"],
  credentials: true
}));

app.use(session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true }
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));  // public 폴더 기준

// ✅ HTML 라우팅
const htmlPages = ["login", "main", "timetable", "chat", "chatroom", "anonymous", "profile"];
htmlPages.forEach(page => {
  app.get(`/${page === "login" ? "" : page}`, (req, res) => {
    res.sendFile(path.join(__dirname, "public", `${page}.html`));
  });
});

// ✅ 라우터 연결
app.use("/auth", require("./routes/auth"));
app.use("/time", require("./routes/time"));
app.use("/chat", require("./routes/chat_messages"));
app.use("/chat", require("./routes/chat_rooms"));
app.use("/board", require("./routes/board"));
app.use("/comments", require("./routes/comments"));
app.use("/likes", require("./routes/likes"));
app.use("/home", require("./routes/home")); // ✅ 수정 완료!

// ✅ 서버 시작
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
