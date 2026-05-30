/* =============================================
   LANDING IA — public/js/app.js
   Lógica del frontend: créditos, modal, generación
   ============================================= */

let generatedHTML = '';
let selectedEstilo = 'Moderno';
let selectedPlan = 'basico';
let creditToken = null;   // JWT con créditos
let creditCount = 0;

/* ─── Al cargar la página ─── */
document.addEventListener('DOMContentLoaded', () => {
  cargarCreditos();
  leerTokenDesdeURL();
});

/* ─── Leer token si vuelve de Mercado Pago ─── */
function leerTokenDesdeURL() {
  const hash = window.location.hash;
  if (!hash.includes('token=')) return;

  const params = new URLSearchParams(hash.replace('#', ''));
  const token = params.get('token');
  const creditos = parseInt(params.get('creditos') || '0');

  if (token) {
    // Sumar a créditos existentes si ya tenía
    const prevCount = parseInt(localStorage.getItem('landing_credits') || '0');
    creditToken = token;
    creditCount = creditos + prevCount;
    guardarCreditos();
    window.location.hash = '';
    mostrarNotificacion(`✅ ¡Pago exitoso! Tienes ${creditCount} créditos disponibles.`);
  }
}

/* ─── Guardar / cargar créditos en localStorage ─── */
function guardarCreditos() {
  if (creditToken) localStorage.setItem('landing_token', creditToken);
  localStorage.setItem('landing_credits', String(creditCount));
  actualizarBarraCreditos();
}

function cargarCreditos() {
  creditToken = localStorage.getItem('landing_token') || null;
  creditCount = parseInt(localStorage.getItem('landing_credits') || '0');
  actualizarBarraCreditos();
}

function actualizarBarraCreditos() {
  const display = document.getElementById('creditsDisplay');
  const num = document.getElementById('creditsNum');
  if (!display || !num) return;

  if (creditCount > 0) {
    display.style.display = 'flex';
    num.textContent = creditCount;
    display.className = 'credits-count' + (creditCount <= 2 ? ' low' : '');
  } else if (creditToken !== null) {
    display.style.display = 'flex';
    num.textContent = '0';
    display.className = 'credits-count empty';
  } else {
    display.style.display = 'none';
  }
}

/* ─── Modal de compra ─── */
function abrirModal() {
  document.getElementById('modalOverlay').classList.add('open');
}

function cerrarModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function cerrarModalFuera(e) {
  if (e.target === document.getElementById('modalOverlay')) cerrarModal();
}

function selectPlan(el, plan) {
  document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedPlan = plan;
}

async function iniciarPago() {
  const email = document.getElementById('modalEmail').value.trim();
  if (!email || !email.includes('@')) {
    alert('Por favor ingresa un correo válido para enviarte el acceso.');
    return;
  }

  const btn = document.getElementById('btnPagar');
  btn.disabled = true;
  btn.textContent = 'Redirigiendo...';

  try {
    const res = await fetch('/api/crear-pago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: selectedPlan, email })
    });

    const data = await res.json();
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    } else {
      throw new Error(data.error || 'Error al crear el pago');
    }
  } catch (err) {
    alert('Error: ' + err.message);
    btn.disabled = false;
    btn.textContent = 'Pagar con Mercado Pago';
  }
}

/* ─── Estilo visual ─── */
function selectPill(el) {
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  selectedEstilo = el.textContent.replace(/[✨💎⬜🎨🏢🌸🔥]/gu, '').trim();
}

/* ─── Animación pasos de carga ─── */
function animateLoadingSteps() {
  const steps = ['ls1', 'ls2', 'ls3', 'ls4'];
  const delays = [0, 4000, 8000, 12000];
  steps.forEach((id, i) => {
    setTimeout(() => {
      if (i > 0) {
        const prev = document.getElementById(steps[i - 1]);
        if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
      }
      const el = document.getElementById(id);
      if (el) { el.classList.add('active'); el.textContent = el.textContent.replace('○', '→'); }
    }, delays[i]);
  });
}

function resetLoadingSteps() {
  const labels = ['Analizando tu negocio', 'Diseñando el layout', 'Escribiendo el contenido', 'Aplicando colores y estilo'];
  ['ls1','ls2','ls3','ls4'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) {
      el.className = 'lstep' + (i === 0 ? ' active' : '');
      el.textContent = (i === 0 ? '→ ' : '○ ') + labels[i];
    }
  });
}

/* ─── Generar landing ─── */
async function generar() {
  const nombre = document.getElementById('nombre').value.trim();
  const rubro  = document.getElementById('rubro').value;

  if (!nombre || !rubro) {
    alert('Por favor ingresa el nombre y el rubro de tu negocio.');
    return;
  }

  // Verificar créditos
  if (!creditToken || creditCount <= 0) {
    mostrarNotificacion('⚡ Necesitas créditos para generar. ¡Compra un pack!', 'warn');
    abrirModal();
    return;
  }

  const btn = document.getElementById('btnGen');
  btn.disabled = true;
  document.getElementById('btnText').textContent = 'Generando...';
  document.getElementById('emptyState').style.display   = 'none';
  document.getElementById('previewFrame').style.display = 'none';
  document.getElementById('toolbarActions').style.display = 'none';
  document.getElementById('loadingState').style.display = 'flex';
  document.getElementById('previewLabel').textContent   = 'generando...';
  resetLoadingSteps();
  animateLoadingSteps();

  const body = {
    nombre, rubro,
    servicios: document.getElementById('servicios').value.trim(),
    telefono:  document.getElementById('telefono').value.trim(),
    email:     document.getElementById('email').value.trim(),
    ciudad:    document.getElementById('ciudad').value.trim(),
    estilo:    selectedEstilo,
    c1: document.getElementById('c1').value,
    c2: document.getElementById('c2').value,
    c3: document.getElementById('c3').value,
    c4: document.getElementById('c4').value,
  };

  try {
    const res = await fetch('/api/generar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${creditToken}`
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.needsRecharge) {
        mostrarNotificacion('⚡ Sin créditos. Compra un pack para continuar.', 'warn');
        abrirModal();
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
      return;
    }

    // Actualizar token y créditos
    if (data.newToken) {
      creditToken = data.newToken;
      creditCount = data.creditsLeft;
      guardarCreditos();
    }

    generatedHTML = data.html;
    document.getElementById('loadingState').style.display = 'none';
    const frame = document.getElementById('previewFrame');
    frame.style.display = 'block';
    frame.srcdoc = generatedHTML;
    document.getElementById('previewLabel').textContent = nombre.toLowerCase().replace(/\s+/g, '-') + '.cl';
    document.getElementById('toolbarActions').style.display = 'flex';
    mostrarNotificacion(`✅ Página generada. Te quedan ${creditCount} créditos.`);

  } catch (err) {
    document.getElementById('loadingState').innerHTML = `
      <div style="text-align:center;padding:2rem">
        <div style="font-size:40px;margin-bottom:12px">⚠️</div>
        <h3 style="color:#c62828;margin-bottom:8px">Error al generar</h3>
        <p style="color:#666;font-size:14px;max-width:300px;line-height:1.6">${err.message}</p>
        <button onclick="location.reload()" style="margin-top:16px;padding:10px 24px;background:#6C63FF;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600">Reintentar</button>
      </div>`;
  }

  btn.disabled = false;
  document.getElementById('btnText').textContent = '✦ Regenerar página';
}

/* ─── Descargar HTML ─── */
function descargar() {
  if (!generatedHTML) return;
  const nombre = document.getElementById('nombre').value.trim() || 'mi-negocio';
  const filename = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-') + '.html';
  const blob = new Blob([generatedHTML], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

/* ─── Copiar HTML ─── */
function copiarHTML() {
  if (!generatedHTML) return;
  navigator.clipboard.writeText(generatedHTML).then(() => {
    const btn = document.getElementById('btnCopy');
    btn.textContent = '✓ Copiado';
    setTimeout(() => { btn.textContent = '📋 Copiar código'; }, 2500);
  });
}

/* ─── Notificación toast ─── */
function mostrarNotificacion(msg, tipo = 'success') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
    background:${tipo === 'warn' ? '#e65100' : '#2e7d32'};color:#fff;
    padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;
    box-shadow:0 4px 20px rgba(0,0,0,0.2);z-index:9999;
    animation:fadeIn 0.3s ease;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
