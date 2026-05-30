// api/_credits.js
// Manejo de créditos con JWT (sin base de datos)
// Los créditos van firmados dentro del token del usuario

import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';

/**
 * Verifica un token y retorna los datos de créditos
 * @param {string} token
 * @returns {{ credits: number, email: string } | null}
 */
export function verifyToken(token) {
  try {
    const data = jwt.verify(token, SECRET);
    return data;
  } catch {
    return null;
  }
}

/**
 * Crea un nuevo token con los créditos dados
 * @param {string} email
 * @param {number} credits
 * @returns {string} token JWT
 */
export function createToken(email, credits) {
  return jwt.sign(
    { email, credits, createdAt: Date.now() },
    SECRET,
    { expiresIn: '90d' } // válido por 90 días
  );
}

/**
 * Devuelve un nuevo token con 1 crédito menos
 * @param {{ email: string, credits: number }} creditData
 * @returns {string} nuevo token JWT
 */
export function decrementCredits(creditData) {
  return createToken(creditData.email, creditData.credits - 1);
}
