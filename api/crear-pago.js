// api/crear-pago.js
// Crea una preferencia de pago en Mercado Pago
// El usuario elige cuántos créditos comprar y se redirige al checkout

import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

// Planes de créditos disponibles
const PLANES = {
  basico: {
    nombre: 'Pack Básico',
    creditos: 3,
    precio: 4990,
    descripcion: '3 páginas web generadas con IA'
  },
  pro: {
    nombre: 'Pack Pro',
    creditos: 10,
    precio: 12990,
    descripcion: '10 páginas web generadas con IA'
  },
  agencia: {
    nombre: 'Pack Agencia',
    creditos: 30,
    precio: 29990,
    descripcion: '30 páginas web generadas con IA'
  }
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  const { plan, email } = req.body;

  if (!plan || !PLANES[plan]) {
    return res.status(400).json({ error: 'Plan inválido. Opciones: basico, pro, agencia' });
  }

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  const planData = PLANES[plan];
  const APP_URL = process.env.APP_URL || 'https://tu-app.vercel.app';

  try {
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            title: planData.nombre,
            description: planData.descripcion,
            quantity: 1,
            currency_id: 'CLP',
            unit_price: planData.precio
          }
        ],
        payer: { email },
        back_urls: {
          success: `${APP_URL}/api/pago-exitoso?plan=${plan}&email=${encodeURIComponent(email)}`,
          failure: `${APP_URL}?pago=fallido`,
          pending: `${APP_URL}?pago=pendiente`
        },
        auto_return: 'approved',
        metadata: { plan, email, creditos: planData.creditos }
      }
    });

    return res.status(200).json({
      checkoutUrl: result.init_point,
      preferenceId: result.id
    });

  } catch (err) {
    console.error('Error MP:', err);
    return res.status(500).json({ error: 'Error al crear el pago. Intenta nuevamente.' });
  }
}
