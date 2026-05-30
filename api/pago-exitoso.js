// api/pago-exitoso.js
// Mercado Pago redirige aquí cuando el pago es aprobado
// Genera el token JWT con los créditos y redirige al frontend

import { createToken } from './_credits.js';

const PLANES = {
  basico:  { creditos: 3 },
  pro:     { creditos: 10 },
  agencia: { creditos: 30 }
};

export default async function handler(req, res) {
  const { plan, email, status, payment_status } = req.query;

  // Verificar que el pago fue aprobado
  const aprobado = status === 'approved' || payment_status === 'approved';

  if (!aprobado) {
    return res.redirect(`${process.env.APP_URL}?pago=fallido`);
  }

  if (!plan || !PLANES[plan] || !email) {
    return res.redirect(`${process.env.APP_URL}?pago=error`);
  }

  const creditos = PLANES[plan].creditos;
  const token = createToken(decodeURIComponent(email), creditos);

  // Redirigir al frontend con el token en el hash (no queda en logs del servidor)
  const APP_URL = process.env.APP_URL || 'https://tu-app.vercel.app';
  return res.redirect(`${APP_URL}/#token=${token}&creditos=${creditos}`);
}
