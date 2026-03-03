# 🚂 Checklist paso a paso: Deploy en Railway

## Pre-Deploy (En tu máquina)

### ☑️ Paso 1: Verifica que todo funcione localmente
```bash
# En C:\Users\User\Dev\Personal\La-Casita
bun install
bun run start
```
Envía `/start` a tu bot en Telegram. Debe responder.

### ☑️ Paso 2: Verifica que .env no esté en git
```bash
git status
```
**NO debe aparecer `.env`** en los archivos staged o unstaged.
Solo `.env.example` es permitido.

### ☑️ Paso 3: Sube cambios a GitHub
```bash
git add .
git commit -m "chore: preparar para deploy en Railway"
git push origin dev  # o main, según tu preferencia
```

---

## Railway Setup (En railway.app)

### ☑️ Paso 4: Crear cuenta en Railway
1. Ve a https://railway.app
2. Haz click en "Start a New Project"
3. Login con GitHub (autoriza Railway)

### ☑️ Paso 5: Crear proyecto desde GitHub
1. En Railway Dashboard: "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Busca y selecciona `La-Casita`
4. Selecciona la rama (ej: `dev`)
5. Click "Deploy"

*Railway ahora estará compilando tu proyecto...*

### ☑️ Paso 6: Configurar variables de entorno
**IMPORTANTE:** Las variables se configuran **en Railway**, no en GitHub.

Mientras Railway compila, prepara tus valores:

1. **BOT_TOKEN**: 
   - Abre Telegram
   - Busca @BotFather
   - Envía: `/mybots`
   - Selecciona tu bot
   - Click "API Token"
   - Copia el token

2. **SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY**:
   - Ve a https://app.supabase.com
   - Selecciona tu proyecto "la-casita"
   - Settings → API
   - Copia los valores

### ☑️ Paso 7: Agregar variables a Railway
En Railway Dashboard, en tu proyecto:
1. Haz click en la pestaña "Variables"
2. Agrega cada variable:

```
KEY: BOT_TOKEN
VALUE: (tu_token_de_telegram)
[Add Variable]

KEY: SUPABASE_URL
VALUE: (tu_url)
[Add Variable]

KEY: SUPABASE_ANON_KEY
VALUE: (tu_key)
[Add Variable]

KEY: SUPABASE_SERVICE_ROLE_KEY
VALUE: (tu_service_role_key)
[Add Variable]

KEY: NODE_ENV
VALUE: production
[Add Variable]

KEY: LOG_LEVEL
VALUE: info
[Add Variable]
```

**Reglas importantes:**
- ❌ No uses comillas ("" o '')
- ❌ No dejes espacios al final
- ❌ No uses más de una línea

### ☑️ Paso 8: Revisar Deploy
Una vez agregadas las variables, Railway automáticamente redeploy.

Ve a la pestaña "Deployments":
- Verde ✅ = Deploy exitoso
- Rojo ❌ = Error (revisa logs)

Si hay error, haz click en el deployment y revisa "Logs".

### ☑️ Paso 9: Monitorear logs
En la pestaña "Logs", deberías ver algo como:

```
[info] Starting La-Casita Bot...
[info] Bot connected to Telegram
[info] Connected to Supabase
```

Si no ves esto:
- Scroll hacia arriba en los logs
- Busca mensajes rojo/error
- Verifica variables de entorno

### ☑️ Paso 10: Probar en Telegram
1. Abre Telegram
2. Busca tu bot
3. Envía `/start`

Si **responde**: ✅ ¡DEPLOY EXITOSO!
Si **no responde**: 
- Espera 30 segundos y reintenta
- Revisa logs en Railway
- Verifica que BOT_TOKEN sea correcto

---

## Troubleshooting Rápido

### El bot no responde después del deploy

**Posibilidad 1: Error en el código**
- Railway logs mostrarán el error
- Ejemplo: `ReferenceError: BOT_TOKEN is undefined`
- Solución: Revisa que la variable esté en Railway

**Posibilidad 2: Token incorrecto**
- Ve a @BotFather en Telegram
- Copia el token nuevamente
- Actualiza en Railway
- Railway redeploy automáticamente

**Posibilidad 3: Supabase no accesible**
- Verifica SUPABASE_URL sea correcta (sin trailing slash)
- Verifica SUPABASE_ANON_KEY no esté vacía
- En Railway logs, busca errores de conexión

**Posibilidad 4: El proceso se detiene**
- En Railway, deberías ver el servicio "Running"
- Si dice "Crashed" o "Stopped":
  - Haz click en el servicio
  - Ve a "Logs"
  - Busca el error
  - Posiblemente error en RLS de Supabase

---

## Después del Deploy

### ☑️ Auto-deploy desde GitHub (Recomendado)

Para que cada `git push` dispare un deploy automático:
1. En Railway, va a estar ya activo por defecto
2. Verifica en Settings → "Auto-deploy"
3. Selecciona la rama (ej: `dev`)
4. Ahora cada push deployará automáticamente

### ☑️ Monitoreo continuo

Recomendación: cada vez que hagas cambios:
1. Haz commit y push a GitHub
2. En Railway, verifica que el deploy sea verde
3. Prueba en Telegram

---

## Costo en Railway

**Buenas noticias:** 
- $5 de crédito inicial gratis
- Un bot small cuesta ~$0.10/día (~$3/mes)
- **Con el crédito inicial alcanza para ~50 días**

---

## Referencias rápidas

- 📖 Docs de Railway: https://docs.railway.app
- 🆘 GitHub de Railway: https://github.com/railwayapp
- 💬 Discord de Railway: https://discord.gg/railway

---

## ¡Listo! 🎉

Si llegaste hasta aquí y todo funciona, tu bot está en producción 24/7.

Próximos pasos opcionales:
- Agregar custom domain si lo necesitas
- Configurar alertas si algo falla
- Revisar costos en "Usage"
