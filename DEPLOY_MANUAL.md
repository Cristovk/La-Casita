# 📋 Despliegue Manual de Migraciones - Supabase Dashboard

## Pasos Simples (3 minutos)

### 1. Abre Supabase Dashboard
- Ve a: https://app.supabase.com
- Selecciona tu proyecto `odezhzqvespzjfcyqvwv`

### 2. Ve a SQL Editor
- En el menú lateral izquierdo → **SQL Editor**
- Haz clic en **New Query**

### 3. Migración 1: Crear tabla presion_arterial_records
- Copia TODO el contenido de: `supabase/migrations/20260302000019_create_presion_arterial_records.sql`
- Pégalo en el editor
- Haz clic en **Run** (o Ctrl+Enter)
- Espera a que muestre ✅

### 4. Migración 2: Agregar RLS policies
- Copia TODO el contenido de: `supabase/migrations/20260302000020_add_rls_presion_arterial_records.sql`
- Pégalo en el editor
- Haz clic en **Run**
- Espera a que muestre ✅

### 5. Verifica en Table Editor
- Ve a **Table Editor** (menú lateral)
- Deberías ver una tabla nueva: `presion_arterial_records`
- Tiene columnas: `sistolica`, `diastolica`, `pulso`, `brazo`, `en_ayunas`, etc.

## ¡Listo!

Ahora reinicia el bot:
```bash
pnpm start
```

Prueba en Telegram:
- `/registrar` → Presión Arterial
- Ingresa datos
- `/debug` para ver que se guardó en la tabla nueva
