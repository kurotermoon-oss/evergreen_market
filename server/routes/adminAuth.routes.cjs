const express = require("express");
const jwt = require("jsonwebtoken");

const { createAdminToken } = require("../middleware/adminAuth.cjs");

const router = express.Router();

const ADMIN_LOGIN = process.env.ADMIN_LOGIN || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-this-password";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

router.post("/login", (req, res) => {
  const { login, password } = req.body;

  if (login !== ADMIN_LOGIN || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Wrong login or password" });
  }

  const token = createAdminToken();

  res.cookie("admin_token", token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ ok: true });
});

router.post("/logout", (req, res) => {
  res.clearCookie("admin_token", {
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  });

  res.json({ ok: true });
});

router.get("/me", (req, res) => {
  const token = req.cookies.admin_token;

  if (!token) {
    return res.json({ authenticated: false });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    res.json({
      authenticated: payload.role === "admin",
    });
  } catch {
    res.json({ authenticated: false });
  }
});

module.exports = router;