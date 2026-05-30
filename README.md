# ✦ LandingIA — Generador de páginas web con IA

Genera landing pages profesionales con inteligencia artificial.
Sistema de créditos integrado con Mercado Pago.

---

## 📁 Estructura del proyecto

```
landingIA/
├── api/
│   ├── _credits.js       # Lógica de tokens JWT (créditos)
│   ├── generar.js        # Llama a Anthropic, consume 1 crédito
│   ├── crear-pago.js     # Crea preferencia de pago en Mercado Pago
│   └── pago-exitoso.js   # Webhook de retorno tras pago aprobado
├── public/
│   ├── index.html        # Frontend principal
│   ├── css/styles.css    # Estilos
│   └── js/app.js         # Lógica del frontend
├── vercel.json           # Configuración de rutas Vercel
├── package.json
└── .env.example          # Variables de entorno necesarias
```

---

## 🚀 Deploy en Vercel (paso a paso)

### 1. Instalar dependencias
```bash
npm install
npm install jsonwebtoken  # necesario para _credits.js
```

### 2. Subir a GitHub
```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/landingIA.git
git push -u origin main
```

### 3. Conectar con Vercel
1. Entra a https://vercel.com
2. Clic en "Add New Project"
3. Importa el repositorio de GitHub
4. En "Framework Preset" elige **Other**
5. Clic en "Deploy"

### 4. Configurar variables de entorno en Vercel
En tu proyecto de Vercel → Settings → Environment Variables, agrega:

| Variable | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | Tu API key de Anthropic |
| `MP_ACCESS_TOKEN` | Tu Access Token de Mercado Pago |
| `MP_PUBLIC_KEY` | Tu Public Key de Mercado Pago |
| `APP_URL` | La URL de tu app (ej: https://landing-ia.vercel.app) |
| `JWT_SECRET` | Cualquier string secreto largo (ej: mi_clave_super_secreta_2025) |

### 5. Redeploy
Después de agregar las variables, haz redeploy:
Vercel Dashboard → Tu proyecto → Deployments → "Redeploy"

---

## 🔑 Cómo obtener las API keys

### Anthropic (Claude)
1. Ve a https://console.anthropic.com
2. Settings → API Keys → Create Key
3. Copia la key (empieza con `sk-ant-`)

### Mercado Pago
1. Ve a https://www.mercadopago.cl/developers/panel
2. Crea una aplicación
3. En "Credenciales de producción" copia:
   - Access Token (empieza con `APP_USR-`)
   - Public Key (empieza con `APP_USR-`)

---

## 💰 Planes de créditos (puedes cambiarlos en crear-pago.js)

| Plan | Créditos | Precio CLP |
|---|---|---|
| Básico | 3 | $4.990 |
| Pro | 10 | $12.990 |
| Agencia | 30 | $29.990 |

---

## 🛠 Desarrollo local
```bash
npm install -g vercel
vercel dev
```
Esto levanta el proyecto en http://localhost:3000 con todas las API functions.
