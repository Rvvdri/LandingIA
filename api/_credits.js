// api/_credits.js
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';

function verifyToken(token) {
  try {
    const data = jwt.verify(token, SECRET);
    return data;
  } catch {
    return null;
  }
}

function createToken(email, credits) {
  return jwt.sign(
    { email, credits, createdAt: Date.now() },
    SECRET,
    { expiresIn: '90d' }
  );
}

function decrementCredits(creditData) {
  return createToken(creditData.email, creditData.credits - 1);
}

module.exports = { verifyToken, createToken, decrementCredits };