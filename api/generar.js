// api/generar.js
const Anthropic = require('@anthropic-ai/sdk');
const { verifyToken, decrementCredits } = require('./_credits.js');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODO_TEST = false;

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const {
    nombre, rubro, tipoPagina, descripcion,
    telefono, email, ciudad, horario, redesSociales,
    estilo, c1, c2, c3, c4,
    productos, faq, imagenes
  } = req.body;

  if (!nombre || !rubro) return res.status(400).json({ error: 'Nombre y rubro son obligatorios' });

  const authHeader = req.headers.authorization;
  let creditData = null;

  if (!MODO_TEST) {
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Sin autorización. Compra créditos primero.' });
    }
    const token = authHeader.split(' ')[1];
    creditData = verifyToken(token);
    if (!creditData) return res.status(401).json({ error: 'Token inválido o expirado.' });
    if (creditData.credits <= 0) return res.status(402).json({ error: 'Sin créditos.', needsRecharge: true });
  } else {
    creditData = { email: 'test@test.com', credits: 99 };
  }

  const tipos = tipoPagina || ['landing'];
  const seccionesList = [];

  if (tipos.includes('landing')) {
    seccionesList.push('- Navbar sticky con logo y menú (con hamburguesa en mobile)');
    seccionesList.push('- Hero section con título impactante, subtítulo y botón CTA');
    seccionesList.push('- Sección "Sobre nosotros"');
    seccionesList.push('- Sección de beneficios (3 puntos fuertes con íconos SVG)');
  }
  if (tipos.includes('servicios')) {
    seccionesList.push('- Sección de servicios con tarjetas visuales');
  }
  if (tipos.includes('productos') && productos?.length > 0) {
    seccionesList.push(`- Catálogo de productos con tarjetas:\n${productos.map((p,i) => `  ${i+1}. ${p.nombre} - $${p.precio} - ${p.descripcion}`).join('\n')}`);
  }
  if (tipos.includes('galeria')) {
    seccionesList.push('- Galería de fotos en grid responsive 3 columnas');
  }
  if (tipos.includes('contacto')) {
    seccionesList.push(`- Formulario de contacto (nombre, email, mensaje) con action="mailto:${email || ''}"`);
  }
  if (faq?.length > 0) {
    seccionesList.push(`- FAQ accordion:\n${faq.map(f => `  P: ${f.pregunta} R: ${f.respuesta}`).join('\n')}`);
  }
  seccionesList.push('- Footer con nombre, horario, redes y año 2025');

  // Imágenes en base64
  let imagenesPrompt = '';
  if (imagenes?.length > 0) {
    imagenesPrompt = `\nIMÁGENES DEL CLIENTE (úsalas directamente en los img src):\n` +
      imagenes.map((img, i) => `Imagen ${i+1} nombre="${img.nombre}": ${img.base64}`).join('\n');
  }

  const numLimpio = (telefono || '').replace(/[^0-9]/g, '');
  const whatsappBtn = numLimpio ? `<a href="https://wa.me/${numLimpio}" target="_blank" style="position:fixed;bottom:24px;right:24px;width:58px;height:58px;background:#25D366;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,0.45);text-decoration:none;z-index:9999;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>` : '';

  const prompt = `Eres un experto diseñador web. Crea una página web HTML completa, moderna y profesional.

NEGOCIO:
- Nombre: ${nombre}
- Rubro: ${rubro}
- Descripción: ${descripcion || 'Negocio local chileno'}
- WhatsApp: ${telefono || 'No indicado'}
- Email: ${email || 'No indicado'}
- Ciudad: ${ciudad || 'Chile'}
- Horario: ${horario || 'No indicado'}
- Redes sociales: ${redesSociales || 'No indicadas'}

TIPO: ${tipos.join(', ')}
SECCIONES:
${seccionesList.join('\n')}
${imagenesPrompt}

DISEÑO:
- Estilo: ${estilo || 'Moderno'}
- Color principal: ${c1 || '#6C63FF'}
- Color acento: ${c2 || '#FF6584'}
- Color fondo: ${c3 || '#FFFFFF'}
- Color texto: ${c4 || '#1a1a2e'}

REGLAS:
- Un solo archivo HTML con CSS y JS inline
- Responsive mobile-first con media queries
- Navbar con menú hamburguesa en mobile (JS puro)
- Sin imágenes externas — SVG inline o base64
- Texto en español chileno persuasivo para "${rubro}"
- Pega este código justo antes de </body>: ${whatsappBtn}
- RESPONDE SOLO CON EL HTML COMPLETO`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }]
    });

    let html = message.content.map(b => b.text || '').join('');
    html = html.replace(/^```html?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    if (!html || !html.includes('<')) throw new Error('Respuesta vacía');

    const newToken = MODO_TEST ? null : decrementCredits(creditData);
    return res.status(200).json({ html, newToken, creditsLeft: MODO_TEST ? 99 : creditData.credits - 1 });

  } catch (err) {
    console.error('Error Anthropic:', err);
    return res.status(500).json({ error: 'Error al generar la página. Intenta nuevamente.' });
  }
};
