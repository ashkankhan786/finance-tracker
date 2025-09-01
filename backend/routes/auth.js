const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const router = express.Router();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "postmessage"
);

console.log("Auth routes loaded with url");

router.post("/google", async (req, res) => {
  const { code } = req.body;
  try {
    if (!code) {
      return res
        .status(400)
        .json({ success: false, message: "No code provided" });
    }
    const { tokens } = await client.getToken(code);
    const id_token = tokens.id_token;

    if (!id_token) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid code provided" });
    }

    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        avatar: payload.picture,
      });
    }

    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    user.refreshTokens.push(refreshToken);
    await user.save();

    res.cookie("jid", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
    res.json({
      success: true,
      message: "Login successful",
      data: {
        accessToken,
        user: { email: user.email, name: user.name, avatar: user.avatar },
      },
    });
  } catch (err) {
    console.log(err);
    res.status(401).json({ success: false, message: "Invalid google token" });
  }
});

router.post("/refresh", async (req, res) => {
  const token = req.cookies.jid;

  if (!token) {
    return res.status(401).send("No token");
  }

  try {
    const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    const newAccessToken = jwt.sign(
      { userId: payload.userId },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const newRefreshToken = jwt.sign(
      { userId: payload.userId },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );
    await User.updateOne(
      { _id: payload.userId },
      { $pull: { refreshTokens: token } }
    );

    // Second, add the new token.
    await User.updateOne(
      { _id: payload.userId },
      { $push: { refreshTokens: newRefreshToken } }
    );
    // if (!user) {
    //   return res
    //     .status(403)
    //     .json({ success: false, message: "Invalid refresh token" });
    // }
    res.cookie("jid", newRefreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.json({
      success: true,
      message: "Access token refreshed successfully",
      data: { accessToken: newAccessToken },
    });
  } catch (err) {
    console.log(err);
    res.status(403).json({ success: false, message: "Forbidden" });
  }
});

router.post("/logout", async (req, res) => {
  const token = req.cookies.jid;

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

      await User.findByIdAndUpdate(payload.userId, {
        $pull: { refreshTokens: token },
      });

      res.clearCookie("jid");
    } catch (err) {
      console.log(err);
      res.clearCookie("jid");
    }
  }
  return res.json({ success: true, message: "Logged out successfully" });
});

router.get("/profile", async (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      message: "Profile fetched successfully",
      data: user,
    });
  } catch (err) {
    console.log(err);
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});

module.exports = router;
