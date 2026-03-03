# 🚀 Guía de Deploy para La-Casita Bot

## Opción 1: Railway (RECOMENDADA - Más Fácil)

Railway es la opción más sencilla para dejar el bot corriendo 24/7 sin administrar servidores.

### Qué estás deployando (importante para entender Railway)
Este proyecto es un **worker** (un proceso que corre continuamente). No es una API HTTP expuesta por un puerto. En Railway normalmente esto se configura como *Worker service*.

### Paso 0: Prerrequisitos
Antes de tocar Railway:
- El repo está en GitHub.
- El archivo `.env` **NO** está commiteado (solo `.env.example`).
- El comando local funciona: `bun run start`.

### Paso 1: Preparar GitHub ✅
Decide qué rama deployar (recomendación: `main` para producción, `dev` para pruebas).

```bash
# Confirma que .env no se irá a GitHub
git status

# Sube tu rama (ejemplo con dev)
git push origin dev
```

### Paso 2: Crear el proyecto en Railway
1. Ve a https://railway.app
2. Login con GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Selecciona el repositorio `La-Casita`
5. Elige la rama (por ejemplo `dev`)

### Paso 3: Configurar el servicio como Worker (si Railway te pide puerto)
En Railway, si ves algo relacionado a "Networking" o te pide exponer un puerto:
- Asegúrate de que el servicio sea **Worker** (no Web Service).
- Un bot con *polling* no necesita dominio/URL pública.

### Paso 4: Variables de entorno (se guardan en Railway, no en GitHub)
En el proyecto → "Variables": agrega (una por una) estas keys:

```
BOT_TOKEN=<tu_token_de_telegram>
SUPABASE_URL=<tu_url_de_supabase>
SUPABASE_ANON_KEY=<tu_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<tu_service_role_key>
NODE_ENV=production
LOG_LEVEL=info
```

Reglas rápidas:
- No uses comillas.
- Evita espacios al final.
- `SUPABASE_SERVICE_ROLE_KEY` es sensible: solo en servidor.

### Paso 5: Comandos de build y start
Railway usará Nixpacks para instalar dependencias.
- **Build**: `bun install` (o equivalente)
- **Start**: `bun run start`

Con el `railway.json` del repo, dejamos explícito el `startCommand`.

### Paso 6: Deploy y verificación
1. Ve a "Deployments" o "Logs"
2. Verifica que no haya errores de:
   - Variables faltantes (`BOT_TOKEN`, `SUPABASE_URL`, etc.)
   - Permisos de Supabase (service key / RLS)

### Paso 7: Probar en Telegram
1. Abre Telegram
2. Entra a tu bot
3. Envía `/start`

Si no responde:
- Revisa "Logs" en Railway (deberías ver el bot iniciando y luego manejando updates).
- Confirma que el token corresponde al bot correcto.

### Paso 8: Auto-deploy (recomendado)
Activa auto-deploy para que cada `git push` a la rama elegida dispare un redeploy.

---

## Opción 2: Render (Alternativa Simple)

Render es parecido a Railway pero con plan gratuito limitado.

### Paso 1: Crear Servicio
1. Ve a https://render.com
2. Haz login con GitHub
3. Click en "New +" → "Web Service"
4. Conecta tu repositorio de GitHub
5. Selecciona "La-Casita"

### Paso 2: Configurar
- **Name:** la-casita-bot
- **Environment:** Node (aunque usa Bun)
- **Build Command:** `bun install`
- **Start Command:** `bun start`
- **Plan:** Free (o Starter si quieres mejor uptime)

### Paso 3: Variables de Entorno
En Render:
1. Environment → Add Environment Variable
2. Agrega las mismas variables que en Railway

---

## Opción 3: Fly.io (Mejor Performance)

Más potente pero requiere CLI.

### Paso 1: Instalar Fly
```bash
# Windows
iwr https://fly.io/install.ps1 -useb | iex

# O descargar desde https://fly.io/docs/getting-started/installing-flyctl/
```

### Paso 2: Login y Deploy
```bash
# Login
flyctl auth login

# Ir al directorio del proyecto
cd C:\Users\User\Dev\Personal\La-Casita

# Crear app
flyctl apps create la-casita-bot

# Crear fly.toml
flyctl launch

# Deploy
flyctl deploy
```

### Paso 3: Configurar Variables
```bash
flyctl secrets set \
  BOT_TOKEN=<token> \
  SUPABASE_URL=<url> \
  SUPABASE_ANON_KEY=<key> \
  SUPABASE_SERVICE_ROLE_KEY=<key> \
  NODE_ENV=production \
  LOG_LEVEL=info
```

---

## Opción 4: Self-hosted en VPS (DigitalOcean, Linode, etc.)

Máximo control pero requiere mantenimiento.

### Paso 1: Crear VPS
- DigitalOcean: Droplet con Ubuntu 22.04 (~$5/mes)
- Linode: Instancia con Ubuntu (~$5/mes)
- AWS EC2: t3.micro free tier

### Paso 2: Conectar por SSH
```bash
ssh root@<ip_del_servidor>
```

### Paso 3: Instalar Bun
```bash
# En el servidor
curl -fsSL https://bun.sh/install | bash
```

### Paso 4: Clonar Repositorio
```bash
git clone https://github.com/tuusuario/La-Casita.git
cd La-Casita
```

### Paso 5: Configurar Variables
```bash
# Crear archivo .env en el servidor
nano .env

# Pegar:
BOT_TOKEN=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NODE_ENV=production
LOG_LEVEL=info

# Ctrl+O, Enter, Ctrl+X
```

### Paso 6: Instalar Dependencias
```bash
bun install
```

### Paso 7: Ejecutar con PM2 (Process Manager)
```bash
# Instalar PM2
npm install -g pm2

# Crear archivo ecosystem.config.js
nano ecosystem.config.js

# Contenido:
module.exports = {
  apps: [{
    name: 'la-casita-bot',
    script: './index.ts',
    interpreter: 'bun',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};

# Ctrl+O, Enter, Ctrl+X

# Iniciar con PM2
pm2 start ecosystem.config.js
pm2 save  # Para auto-iniciar en reboots
pm2 startup  # Para auto-iniciar en reboots
```

### Paso 8: Monitorear
```bash
pm2 logs la-casita-bot  # Ver logs
pm2 status              # Estado
pm2 restart all         # Reiniciar
```

---

## 🔐 Dónde Obtener tus Variables de Entorno

### BOT_TOKEN
1. Abre Telegram
2. Busca @BotFather
3. Envía `/mybots`
4. Selecciona tu bot
5. Click en "API Token"
6. Copia el token

### SUPABASE_URL y KEYS
1. Ve a https://app.supabase.com
2. Selecciona tu proyecto "la-casita"
3. Settings → API
4. Copia:
   - **Project URL** → SUPABASE_URL
   - **anon key** → SUPABASE_ANON_KEY
   - **service_role key** → SUPABASE_SERVICE_ROLE_KEY

---

## ✅ Verificar que Funciona

Después de deployar:

1. Abre Telegram
2. Busca tu bot
3. Envía `/start`
4. Si recibes respuesta, ¡funciona! ✨

Si no funciona, revisa:
- Variables de entorno correctas
- Token de Telegram válido
- Supabase conectado
- Logs de la plataforma

---

## 🆘 Troubleshooting

### El bot no responde
```
1. Revisa los logs en la plataforma
2. Verifica que BOT_TOKEN sea correcto
3. Verifica que Supabase sea accesible
4. Reinicia el servicio
```

### Error de variables de entorno
```
1. Copia exactamente los valores de Supabase
2. No incluyas espacios en blanco
3. No uses comillas en los valores
```

### Puerto ocupado (si usas VPS)
```bash
# Ver qué está usando el puerto
lsof -i :3000

# Matar el proceso
kill -9 <PID>
```

---

## 💡 Recomendación Final

Para empezar: **Usa Railway**
- ✅ Más fácil
- ✅ Integración con GitHub perfecta
- ✅ Variables de entorno seguras
- ✅ Free tier generoso
- ✅ Deploy en segundos

Si quieres mejor uptime: **Usa Fly.io**
- ✅ Mejor performance
- ✅ Distribuido globalmente
- ✅ Precio justo

Si quieres máximo control: **VPS + PM2**
- ✅ Control total
- ✅ Sin límites
- ✅ Requiere mantenimiento
