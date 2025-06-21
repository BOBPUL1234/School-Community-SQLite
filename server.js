const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');

const app = express();

// ✅ CORS 설정
const allowedOrigins = [
  "http://localhost:3000",
  "https://school-community-sqlite.onrender.com"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// ✅ 세션 설정
app.use(session({
  secret: "bc79c1d3b7e23c4aa1bd9f28e12cbccd2a3c488ab6f91f14958fd2c81b8b263a",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true }
}));

// ✅ 기본 미들웨어
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// ✅ 페이지 라우팅
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "login.html")));
app.get("/main", (req, res) => res.sendFile(path.join(__dirname, "main.html")));
app.get("/timetable", (req, res) => res.sendFile(path.join(__dirname, "timetable.html")));
app.get("/chat", (req, res) => res.sendFile(path.join(__dirname, "chat.html")));
app.get("/chatroom", (req, res) => res.sendFile(path.join(__dirname, "chatroom.html")));
app.get("/anonymous", (req, res) => res.sendFile(path.join(__dirname, "anonymous.html")));
app.get("/profile", (req, res) => res.sendFile(path.join(__dirname, "profile.html")));

// ✅ 라우터 연결 (비동기 처리)
const authRoutes = require('./routes/auth');
const timetableRouter = require('./routes/time');
const boardRoutes = require('./routes/board');
const commentsRoutes = require('./routes/comments');
const likesRouter = require("./routes/likes");
const homeRouter = require("./routes/home");

app.use("/home", homeRouter);
app.use("/auth", authRoutes);
app.use("/time", timetableRouter);
app.use("/chat", require('./routes/chat_messages'));
app.use("/chat", require('./routes/chat_rooms'));
// app.use("/chat", require('./routes/chat_participants'));
app.use("/board", boardRoutes);
app.use("/comments", commentsRoutes);
app.use("/likes", likesRouter); 

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
