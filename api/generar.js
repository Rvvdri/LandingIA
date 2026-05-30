// api/generar.js
// Recibe los datos del formulario + token de créditos
// Valida que tenga créditos, llama a Anthropic, descuenta 1 crédito

const Anthropic = require('@anthropic-ai/sdk');
const { verifyToken, decrementCredits } = require('./_credits.js');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const { nombre, rubro, servicios, telefono, email, ciudad, estilo, c1, c2, c3, c4 } = req.body;
  const authHeader = req.headers.authorization;

  // Validar campos
  if (!nombre || !rubro) {
    return res.status(400).json({ error: 'Nombre y rubro son obligatorios' });
  }

  // Validar token de créditos
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sin autorización. Compra créditos primero.' });
  }

  const token = authHeader.split(' ')[1];
 const MODO_TEST = true;

let creditData = null;
if (!MODO_TEST) {
  creditData = verifyToken(token);
  if (!creditData) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
  if (creditData.credits <= 0) {
    return res.status(402).json({ error: 'Sin créditos. Recarga para continuar.', needsRecharge: true });
  }
} else {
  creditData = { email: 'test@test.com', credits: 99 };
}
  // Construir prompt
  const numLimpio = (telefono || '').replace(/[^0-9]/g, '');
  const whatsappBtn = numLimpio ? `
    <a href="https://wa.me/${numLimpio}" target="_blank"
      style="position:fixed;bottom:24px;right:24px;width:58px;height:58px;
      background:#25D366;border-radius:50%;display:flex;align-items:center;
      justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,0.45);
      text-decoration:none;z-index:9999;transition:transform 0.2s;"
      onmouseover="this.style.transform='scale(1.1)'"
      onmouseout="this.style.transform='scale(1)'">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>` : '';

  const prompt = `Eres un experto diseñador web. Crea una landing page HTML completa y profesional para este negocio chileno:

DATOS:
- Nombre: ${nombre}
- Rubro: ${rubro}
- Servicios: ${servicios || 'Servicios del rubro ' + rubro}
- WhatsApp/Teléfono: ${telefono || 'No indicado'}
- Email: ${email || 'No indicado'}
- Ciudad: ${ciudad || 'Chile'}

DISEÑO:
- Estilo: ${estilo || 'Moderno'}
- Color principal: ${c1 || '#6C63FF'}
- Color acento: ${c2 || '#FF6584'}
- Color fondo: ${c3 || '#FFFFFF'}
- Color texto: ${c4 || '#1a1a2e'}

SECCIONES (en orden):
1. Navbar sticky con logo y menú (Inicio, Servicios, Contacto)
2. Hero con título impactante, subtítulo persuasivo y botón CTA
3. Servicios: 3-4 tarjetas con ícono SVG, título y descripción
4. ¿Por qué elegirnos?: 3 puntos fuertes
5. Contacto: datos en tarjetas visuales
6. Footer con nombre y año 2025

REGLAS:
- Todo en un solo archivo HTML (CSS en <style>, JS mínimo)
- Responsive mobile-first
- Usa exactamente los colores dados
- Sin imágenes externas (usa emojis o SVG inline)
- Animaciones sutiles CSS
- Texto persuasivo para el rubro "${rubro}" en Chile
- Pega este HTML justo antes de </body>: ${whatsappBtn}
- Responde SOLO con el HTML completo, sin explicaciones ni markdown`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    let html = message.content.map(b => b.text || '').join('');
    html = html.replace(/^```html?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    // Descontar 1 crédito y devolver token actualizado
    const newToken = decrementCredits(creditData);

    return res.status(200).json({
      html,
      newToken,
      creditsLeft: creditData.credits - 1
    });

  } catch (err) {
    console.error('Error Anthropic:', err);
    return res.status(500).json({ error: 'Error al generar la página. Intenta nuevamente.' });
  }
}
