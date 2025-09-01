require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authenticate = require("./middlewares/auth");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

const app = express();

// middlewares
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());

// port
const port = process.env.PORT || 5000;

// db
connectDB();

// routes
app.use("/auth", require("./routes/auth"));
app.use("/api/transactions", authenticate, require("./routes/transaction"));
app.use("/api/analytics", authenticate, require("./routes/analytics"));

// test route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// app listener
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
