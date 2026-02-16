# LaCasita_PROJECT.md

**Sistema Multi-tenant de Gestión Familiar vía Telegram Bot**

---

## 📋 Índice

1. [Visión del Proyecto](#visión-del-proyecto)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura y Seguridad](#arquitectura-y-seguridad)
4. [Modelo de Datos](#modelo-de-datos)
5. [Validación Dinámica](#validación-dinámica)
6. [Manejo de Sesiones](#manejo-de-sesiones)
7. [Logging y Observabilidad](#logging-y-observabilidad)
8. [Gestión de Fechas y Zonas Horarias](#gestión-de-fechas-y-zonas-horarias)
9. [Estructura del Proyecto](#estructura-del-proyecto)
10. [Categorías y Subcategorías](#categorías-y-subcategorías)
11. [Flujos de Usuario](#flujos-de-usuario)
12. [Decisiones Técnicas Clave](#decisiones-técnicas-clave)
13. [Roadmap](#roadmap)

---

## 🎯 Visión del Proyecto

**LaCasita** es un sistema multi-tenant diseñado para facilitar la gestión de datos familiares a través de Telegram. Permite a múltiples hogares/familias gestionar información crítica de forma independiente y segura en áreas como:

- 🏥 **Salud**: Registro de presión arterial, glucosa, medicamentos, citas médicas
- 💰 **Finanzas**: Gastos compartidos, balances, deudas, pagos
- 🏠 **Hogar**: Mantenimiento, facturas, inventario
- 🎓 **Educación**: Tareas, eventos escolares, notas
- 🚗 **Vehículos**: Mantenimiento, seguros, multas

Cada hogar opera de forma completamente aislada, con sus propios usuarios, datos y configuraciones.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|------------|---------|
| **Backend & BD** | Supabase (PostgreSQL) | 15+ |
| **Bot Framework** | Telegraf | 4.x |
| **Runtime** | Node.js | 22+ LTS |
| **Lenguaje** | TypeScript | 5.x (strict mode) |
| **Validación** | Zod | Latest |
| **Logging** | Pino | Latest |
| **Fechas** | moment-timezone | Latest |
| **Gestión de Paquetes** | Bun | Latest |

---

## 🔐 Arquitectura y Seguridad

### Modelo de Autenticación

**NO utilizamos Supabase Auth**. La autenticación se basa en el `telegram_id` único de cada usuario, aprovechando las políticas RLS (Row Level Security) de PostgreSQL.

#### Flujo de Autenticación

```typescript
// 1. El bot recibe un mensaje de Telegram
bot.on('message', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  
  // 2. Crear cliente Supabase con telegram_id en headers
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        'X-Telegram-ID': telegramId
      }
    }
  });
  
  // 3. Ejecutar set_telegram_id() antes de cada operación
  await supabase.rpc('set_telegram_id', { telegram_id: telegramId });
  
  // 4. Ahora todas las queries respetan RLS automáticamente
  const { data } = await supabase.from('records').select('*');
});
```

#### Función PostgreSQL para Contexto

```sql
CREATE OR REPLACE FUNCTION set_telegram_id(telegram_id text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.telegram_id', telegram_id, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Políticas RLS (Ejemplos)

```sql
-- Política para tabla 'users'
CREATE POLICY "Users can only see themselves"
ON users FOR SELECT
USING (telegram_id = current_setting('app.telegram_id', true)::text);

-- Política para tabla 'records'
CREATE POLICY "Users can only see records from their household"
ON records FOR SELECT
USING (
  household_id IN (
    SELECT household_id FROM users 
    WHERE telegram_id = current_setting('app.telegram_id', true)::text
  )
);

-- Política para inserción de records
CREATE POLICY "Users can insert records to their household"
ON records FOR INSERT
WITH CHECK (
  household_id IN (
    SELECT household_id FROM users 
    WHERE telegram_id = current_setting('app.telegram_id', true)::text
  )
);
```

### Principios de Seguridad

- ✅ El bot usa **anon_key** (sin privilegios especiales)
- ✅ RLS garantiza aislamiento total entre hogares
- ✅ Cada request incluye `X-Telegram-ID` header
- ✅ Sin tokens JWT ni gestión de contraseñas
- ✅ Aprovechamos la autenticación de Telegram (OAuth implícito)

---

## 📊 Model de Datos

### Relación Multi-tenant

**Regla fundamental**: Cada usuario pertenece a **UN SOLO** hogar (relación 1:1).

### Diagrama de Relaciones

```
households (1) ──< (N) users
                │
                ├──< (N) categories
                │         └──< (N) subcategories
                │                   └──< (N) subcategory_fields
                │
                ├──< (N) tags
                │
                ├──< (N) records
                │         └──< (N) record_tags
                │
                ├──< (N) user_balances
                │
                └──< (N) household_invites
```

### Tablas Principales

#### 1. `households`
```sql
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  timezone TEXT DEFAULT 'America/Santiago',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Propósito**: Representa un hogar/familia. Todos los datos se agrupan bajo este concepto.

#### 2. `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  telegram_id TEXT UNIQUE NOT NULL,
  telegram_username TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_household ON users(household_id);
```

**Propósito**: Usuarios del sistema. Cada uno vinculado a un hogar.

#### 3. `household_invites`
```sql
CREATE TABLE household_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used_by UUID REFERENCES users(id),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invites_code ON household_invites(invite_code);
```

**Propósito**: Códigos de invitación para unirse a un hogar existente.

#### 4. `categories`
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_categories_slug ON categories(household_id, slug);
```

**Propósito**: Categorías principales (Salud, Finanzas, Hogar, etc.). Pueden ser globales (`household_id = NULL`) o por hogar.

#### 5. `subcategories`
```sql
CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  icon TEXT,
  ownership_type TEXT DEFAULT 'personal' CHECK (ownership_type IN ('personal', 'shared', 'both')),
  data_schema JSONB, -- Esquema legacy (opcional)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Propósito**: Subcategorías específicas (ej: Presión Arterial bajo Salud).

#### 6. `subcategory_fields`
```sql
CREATE TABLE subcategory_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('number', 'text', 'date', 'datetime', 'select', 'boolean')),
  is_required BOOLEAN DEFAULT false,
  validation_rules JSONB, -- {min, max, regex, options}
  unit TEXT,
  default_value TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fields_subcategory ON subcategory_fields(subcategory_id);
```

**Propósito**: Define los campos de cada subcategoría de forma granular (alternativa moderna a `data_schema`).

#### 7. `tags`
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_tags_household_name ON tags(COALESCE(household_id::text, 'global'), name);
```

**Propósito**: Tags para clasificar registros. Pueden ser globales o por hogar.

#### 8. `records`
```sql
CREATE TABLE records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  subcategory_id UUID NOT NULL REFERENCES subcategories(id),
  data JSONB NOT NULL, -- Datos validados dinámicamente
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_records_household ON records(household_id);
CREATE INDEX idx_records_user ON records(user_id);
CREATE INDEX idx_records_subcategory ON records(subcategory_id);
CREATE INDEX idx_records_date ON records(recorded_at DESC);
```

**Propósito**: Registros principales del sistema. El campo `data` almacena valores validados.

#### 9. `record_tags`
```sql
CREATE TABLE record_tags (
  record_id UUID REFERENCES records(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (record_id, tag_id)
);
```

**Propósito**: Relación muchos a muchos entre registros y tags.

#### 10. `sessions`
```sql
CREATE TABLE sessions (
  key TEXT PRIMARY KEY,
  session JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

**Propósito**: Almacena sesiones persistentes del bot (escenas, datos temporales).

#### 11. Tablas Financieras (Futuro)

```sql
-- Balances de usuarios
CREATE TABLE user_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  balance DECIMAL(12,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Divisiones de gastos
CREATE TABLE expense_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id UUID NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0
);

-- Deudas entre usuarios
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  debtor_id UUID NOT NULL REFERENCES users(id),
  creditor_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pagos de deudas
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debt_id UUID NOT NULL REFERENCES debts(id),
  amount DECIMAL(10,2) NOT NULL,
  paid_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ✅ Validación Dinámica

### Concepto

Los esquemas de validación se construyen **en runtime** desde la base de datos, permitiendo agregar nuevas categorías sin modificar código.

### Construcción de Esquema Zod Dinámico

```typescript
import { z } from 'zod';

interface FieldDefinition {
  field_name: string;
  field_type: 'number' | 'text' | 'date' | 'datetime' | 'select' | 'boolean';
  is_required: boolean;
  validation_rules?: {
    min?: number;
    max?: number;
    regex?: string;
    options?: string[];
  };
}

function buildDynamicSchema(fields: FieldDefinition[]) {
  const schemaShape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let validator: z.ZodTypeAny;

    switch (field.field_type) {
      case 'number':
        validator = z.number();
        if (field.validation_rules?.min !== undefined) {
          validator = (validator as z.ZodNumber).min(field.validation_rules.min);
        }
        if (field.validation_rules?.max !== undefined) {
          validator = (validator as z.ZodNumber).max(field.validation_rules.max);
        }
        break;

      case 'text':
        validator = z.string();
        if (field.validation_rules?.regex) {
          validator = (validator as z.ZodString).regex(
            new RegExp(field.validation_rules.regex)
          );
        }
        break;

      case 'date':
      case 'datetime':
        validator = z.string().datetime();
        break;

      case 'select':
        if (field.validation_rules?.options) {
          validator = z.enum(field.validation_rules.options as [string, ...string[]]);
        } else {
          validator = z.string();
        }
        break;

      case 'boolean':
        validator = z.boolean();
        break;

      default:
        validator = z.any();
    }

    schemaShape[field.field_name] = field.is_required 
      ? validator 
      : validator.optional();
  }

  return z.object(schemaShape);
}

// Uso
const fields = await supabase
  .from('subcategory_fields')
  .select('*')
  .eq('subcategory_id', subcategoryId);

const schema = buildDynamicSchema(fields.data);
const validData = schema.parse(userInput); // Type-safe!
```

### Tipos de Campo Soportados

| Tipo | Validaciones | Ejemplo |
|------|--------------|---------|
| `number` | min, max | Presión sistólica: 60-250 |
| `text` | regex, maxLength | Notas: max 500 chars |
| `date` | ISO 8601 | "2026-02-13" |
| `datetime` | ISO 8601 | "2026-02-13T10:30:00Z" |
| `select` | options | Tipo comida: ["desayuno", "almuerzo", "cena"] |
| `boolean` | - | ¿En ayunas?: true/false |

---

## 💾 Manejo de Sesiones

### SessionStore Personalizado

Las sesiones de Telegraf se persisten en Supabase para sobrevivir reinicios del bot.

```typescript
import { SessionStore } from 'telegraf';

class SupabaseSessionStore implements SessionStore<any> {
  private supabase: SupabaseClient;
  private ttl: number = 24 * 60 * 60 * 1000; // 24 horas

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.startCleanupInterval();
  }

  async get(key: string) {
    const { data } = await this.supabase
      .from('sessions')
      .select('session')
      .eq('key', key)
      .gt('expires_at', new Date().toISOString())
      .single();

    return data?.session || undefined;
  }

  async set(key: string, session: any) {
    const expires_at = new Date(Date.now() + this.ttl).toISOString();
    
    await this.supabase
      .from('sessions')
      .upsert({ key, session, expires_at });
  }

  async delete(key: string) {
    await this.supabase
      .from('sessions')
      .delete()
      .eq('key', key);
  }

  private startCleanupInterval() {
    setInterval(async () => {
      await this.supabase
        .from('sessions')
        .delete()
        .lt('expires_at', new Date().toISOString());
    }, 60 * 60 * 1000); // Cada hora
  }
}

// Uso en bot
const bot = new Telegraf(BOT_TOKEN);
bot.use(session({
  store: new SupabaseSessionStore(supabase)
}));
```

### Estructura de Sesión

```typescript
interface SessionData {
  scene?: string;
  step?: number;
  tempData?: {
    subcategoryId?: string;
    recordData?: Record<string, any>;
    inviteCode?: string;
  };
}
```

---

## 📝 Logging y Observabilidad

### Configuración de Pino

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV !== 'production' 
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  base: {
    env: process.env.NODE_ENV,
    bot: 'LaCasita'
  }
});

export default logger;
```

### Middleware de Logging

```typescript
import { Middleware } from 'telegraf';

export const loggerMiddleware: Middleware<MyContext> = async (ctx, next) => {
  const start = Date.now();
  const telegramId = ctx.from?.id?.toString();
  const command = ctx.message?.text?.split(' ')[0];

  // Crear child logger con contexto
  ctx.log = logger.child({
    telegramId,
    username: ctx.from?.username,
    chatId: ctx.chat?.id
  });

  ctx.log.info({ command }, 'Incoming message');

  try {
    await next();
    const duration = Date.now() - start;
    ctx.log.info({ duration }, 'Request completed');
  } catch (error) {
    const duration = Date.now() - start;
    ctx.log.error({ error, duration }, 'Request failed');
    throw error;
  }
};
```

### Niveles de Log

- **debug**: Detalles de validación, queries SQL
- **info**: Comandos ejecutados, operaciones exitosas
- **warn**: Validaciones fallidas, datos inesperados
- **error**: Excepciones, fallos de BD

---

## 📅 Gestión de Fechas y Zonas Horarias

### Principios

- **Almacenamiento**: Siempre UTC (`timestamptz` en PostgreSQL)
- **Visualización**: Conversión a `America/Santiago` (zona fija por ahora)
- **Librería**: `moment-timezone` para conversiones confiables

### Funciones Utilitarias

```typescript
import moment from 'moment-timezone';

const TIMEZONE = 'America/Santiago';

// Convertir fecha UTC a formato local para el usuario
export function formatDateForUser(utcDate: Date | string, format = 'DD/MM/YYYY HH:mm'): string {
  return moment(utcDate).tz(TIMEZONE).format(format);
}

// Parsear fecha ingresada por usuario (asume zona local)
export function parseUserDate(input: string): Date {
  return moment.tz(input, 'DD/MM/YYYY', TIMEZONE).toDate();
}

// Obtener timestamp UTC actual
export function nowUTC(): Date {
  return moment.utc().toDate();
}

// Obtener rango de fechas para consultas (inicio y fin del día en zona local)
export function getLocalDateRange(date: string): { start: Date; end: Date } {
  const start = moment.tz(date, 'DD/MM/YYYY', TIMEZONE).startOf('day').toDate();
  const end = moment.tz(date, 'DD/MM/YYYY', TIMEZONE).endOf('day').toDate();
  return { start, end };
}
```

### Ejemplo de Uso

```typescript
// Usuario ingresa: "13/02/2026"
const userInput = "13/02/2026 14:30";
const utcDate = parseUserDate(userInput); // Convierte a UTC

// Guardar en BD
await supabase.from('records').insert({
  recorded_at: utcDate.toISOString() // "2026-02-13T17:30:00.000Z"
});

// Mostrar al usuario
const { data } = await supabase.from('records').select('recorded_at').single();
ctx.reply(`Registrado el: ${formatDateForUser(data.recorded_at)}`);
// Output: "Registrado el: 13/02/2026 14:30"
```

---

## 📁 Estructura del Proyecto

```
LaCasita/
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_rls_policies.sql
│   │   ├── 003_add_categories.sql
│   │   └── 004_add_sessions_table.sql
│   └── seed.sql                        # Datos iniciales (categorías globales, tags)
│
├── telegram-bot/
│   ├── src/
│   │   ├── types/
│   │   │   ├── subcategory.ts          # Interfaces de subcategorías y campos
│   │   │   ├── session.ts              # Tipo SessionData
│   │   │   └── context.ts              # Contexto extendido de Telegraf (MyContext)
│   │   │
│   │   ├── utils/
│   │   │   ├── logger.ts               # Configuración de Pino
│   │   │   ├── dateUtils.ts            # Funciones moment-timezone
│   │   │   └── parsers/
│   │   │       ├── presion.ts          # Parser específico "120/80"
│   │   │       └── index.ts
│   │   │
│   │   ├── services/
│   │   │   ├── supabase.ts             # Factory de cliente con telegram_id
│   │   │   ├── dynamicValidator.ts     # Constructor de esquemas Zod
│   │   │   └── sessionStore.ts         # SessionStore para Supabase
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts                 # Middleware de autenticación
│   │   │   ├── logger.ts               # Middleware de logging
│   │   │   └── commandInterceptor.ts   # Intercepta comandos en escenas
│   │   │
│   │   ├── handlers/
│   │   │   └── errorHandler.ts         # Manejo centralizado de errores
│   │   │
│   │   ├── commands/
│   │   │   ├── start.ts                # /start - Crear hogar o mostrar menú
│   │   │   ├── register.ts             # /registrar - Iniciar flujo de registro
│   │   │   ├── latest.ts               # /ultimos - Ver últimos registros
│   │   │   ├── invite.ts               # /invitar - Generar código de invitación
│   │   │   ├── myHousehold.ts          # /mihogar - Info del hogar
│   │   │   ├── help.ts                 # /ayuda - Comandos disponibles
│   │   │   └── cancel.ts               # /cancelar - Salir de escena actual
│   │   │
│   │   ├── flows/
│   │   │   ├── presionFlow.ts          # Flujo completo de registro de presión
│   │   │   └── (otros flujos futuros)
│   │   │
│   │   └── bot.ts                      # Punto de entrada principal
│   │
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
└── README.md                            # Documentación general del proyecto
```

---

## 🏥 Categorías y Subcategorías

### Categoría: Salud 🏥

**MVP Activo** - Todas las subcategorías de Salud están disponibles desde el inicio.

#### 1. Presión Arterial 💉
- **Slug**: `presion-arterial`
- **Ownership**: Personal
- **Campos**:
  - `sistolica` (number, required): 60-250 mmHg
  - `diastolica` (number, required): 40-150 mmHg
  - `pulso` (number, optional): 40-200 bpm
  - `en_ayunas` (boolean, optional)
  - `brazo` (select, optional): ["izquierdo", "derecho"]
- **Tags sugeridos**: `mañana`, `tarde`, `noche`, `medicado`, `ejercicio`, `estrés`
- **Parser**: Acepta formato "120/80" además de inputs individuales

#### 2. Glucosa 🍬
- **Slug**: `glucosa`
- **Ownership**: Personal
- **Campos**:
  - `nivel` (number, required): 40-500 mg/dL
  - `momento` (select, required): ["ayunas", "preprandial", "postprandial", "nocturno"]
  - `tipo_comida` (select, optional): ["desayuno", "almuerzo", "cena", "snack"]
- **Tags sugeridos**: `normal`, `alto`, `bajo`, `hipoglucemia`, `hiperglucemia`

#### 3. Peso y IMC ⚖️
- **Slug**: `peso-imc`
- **Ownership**: Personal
- **Campos**:
  - `peso` (number, required): 20-300 kg
  - `altura` (number, optional): 50-250 cm (se guarda una vez)
  - `imc` (number, computed): Calculado automáticamente
  - `en_ayunas` (boolean, optional)
- **Tags sugeridos**: `objetivo`, `progreso`, `estancado`

#### 4. Medicamentos 💊
- **Slug**: `medicamentos`
- **Ownership**: Personal
- **Campos**:
  - `nombre` (text, required)
  - `dosis` (text, required): ej. "500mg"
  - `frecuencia` (text, required): ej. "cada 8 horas"
  - `via` (select, optional): ["oral", "inyectable", "tópica", "sublingual"]
  - `tomado` (boolean, required): Confirma si se tomó
- **Tags sugeridos**: `crónico`, `temporal`, `antibiótico`, `antiinflamatorio`

#### 5. Citas Médicas 🩺
- **Slug**: `citas-medicas`
- **Ownership**: Personal
- **Campos**:
  - `especialidad` (text, required)
  - `doctor` (text, optional)
  - `motivo` (text, required)
  - `fecha_hora` (datetime, required)
  - `centro` (text, optional)
  - `completada` (boolean, default: false)
- **Tags sugeridos**: `urgente`, `control`, `seguimiento`, `primera-vez`

#### 6. Síntomas 🤒
- **Slug**: `sintomas`
- **Ownership**: Personal
- **Campos**:
  - `sintoma` (text, required)
  - `intensidad` (select, required): ["leve", "moderada", "severa"]
  - `duracion` (text, optional): ej. "2 horas"
  - `ubicacion` (text, optional)
- **Tags sugeridos**: `dolor`, `fiebre`, `náusea`, `mareo`, `alergia`

#### 7. Resultados de Exámenes 🧪
- **Slug**: `examenes`
- **Ownership**: Personal
- **Campos**:
  - `tipo_examen` (text, required)
  - `parametro` (text, required): ej. "Hemoglobina"
  - `valor` (text, required)
  - `rango_normal` (text, optional)
  - `laboratorio` (text, optional)
- **Tags sugeridos**: `sangre`, `orina`, `imagen`, `normal`, `anormal`

---

### Categoría: Finanzas 💰

**Fase 3** - Activar después del MVP de Salud.

#### 1. Gastos Compartidos 🧾
- **Slug**: `gastos-compartidos`
- **Ownership**: Shared
- **Campos**:
  - `monto` (number, required): min 0
  - `descripcion` (text, required)
  - `categoria` (select, required): ["supermercado", "servicios", "transporte", "otros"]
  - `pagado_por` (user_select, required)
  - `dividir_entre` (user_multiselect, required)
- **Tags sugeridos**: `recurrente`, `urgente`, `planificado`

#### 2. Gastos Personales 💳
- **Slug**: `gastos-personales`
- **Ownership**: Personal
- **Campos**:
  - `monto` (number, required)
  - `descripcion` (text, required)
  - `categoria` (select, required): ["alimentación", "transporte", "entretenimiento", "salud", "educación", "otros"]
  - `metodo_pago` (select, optional): ["efectivo", "débito", "crédito", "transferencia"]
- **Tags sugeridos**: `necesario`, `capricho`, `inversión`

#### 3. Ingresos 💵
- **Slug**: `ingresos`
- **Ownership**: Personal
- **Campos**:
  - `monto` (number, required)
  - `fuente` (text, required): ej. "Sueldo", "Freelance"
  - `tipo` (select, required): ["sueldo", "bono", "venta", "inversión", "otro"]
  - `recurrente` (boolean, default: false)
- **Tags sugeridos**: `fijo`, `variable`, `extra`

#### 4. Deudas 📊
- **Slug**: `deudas`
- **Ownership**: Both
- **Campos**:
  - `acreedor` (text, required): Quién presta
  - `monto_total` (number, required)
  - `monto_pagado` (number, default: 0)
  - `fecha_vencimiento` (date, optional)
  - `notas` (text, optional)
- **Tags sugeridos**: `tarjeta`, `préstamo`, `familiar`, `bancario`

#### 5. Presupuestos 📈
- **Slug**: `presupuestos`
- **Ownership**: Shared
- **Campos**:
  - `categoria` (text, required)
  - `monto_limite` (number, required)
  - `periodo` (select, required): ["semanal", "mensual", "anual"]
  - `gasto_actual` (number, computed)
- **Tags sugeridos**: `ajustable`, `estricto`, `flexible`

---

### Categoría: Hogar 🏠

**Fase 4** - Expansión futura.

#### 1. Mantenimiento 🔧
- **Slug**: `mantenimiento`
- **Ownership**: Shared
- **Campos**:
  - `item` (text, required): ej. "Caldera", "Jardín"
  - `tipo` (select, required): ["reparación", "preventivo", "mejora"]
  - `costo` (number, optional)
  - `proveedor` (text, optional)
  - `proximo_mantenimiento` (date, optional)
- **Tags sugeridos**: `urgente`, `programado`, `garantía`

#### 2. Facturas y Servicios 💡
- **Slug**: `facturas`
- **Ownership**: Shared
- **Campos**:
  - `servicio` (select, required): ["luz", "agua", "gas", "internet", "teléfono", "otro"]
  - `monto` (number, required)
  - `periodo` (text, required): ej. "Enero 2026"
  - `fecha_vencimiento` (date, required)
  - `pagado` (boolean, default: false)
- **Tags sugeridos**: `vencido`, `pagado`, `dividido`

#### 3. Inventario 📦
- **Slug**: `inventario`
- **Ownership**: Shared
- **Campos**:
  - `item` (text, required)
  - `cantidad` (number, required)
  - `ubicacion` (text, optional): ej. "Despensa", "Baño"
  - `fecha_compra` (date, optional)
  - `fecha_vencimiento` (date, optional)
- **Tags sugeridos**: `urgente`, `agotado`, `stock-bajo`

---

### Categoría: Educación 🎓

**Futuro** - Para familias con hijos estudiando.

#### 1. Tareas y Proyectos 📚
- **Slug**: `tareas`
- **Ownership**: Personal
- **Campos**:
  - `asignatura` (text, required)
  - `descripcion` (text, required)
  - `fecha_entrega` (date, required)
  - `completada` (boolean, default: false)
  - `calificacion` (number, optional): 1-7
- **Tags sugeridos**: `urgente`, `grupal`, `examen`

#### 2. Eventos Escolares 🏫
- **Slug**: `eventos-escolares`
- **Ownership**: Shared
- **Campos**:
  - `evento` (text, required)
  - `fecha_hora` (datetime, required)
  - `lugar` (text, optional)
  - `requiere_asistencia` (boolean, default: false)
- **Tags sugeridos**: `reunión`, `acto`, `deportivo`, `cultural`

#### 3. Notas y Evaluaciones 📝
- **Slug**: `notas`
- **Ownership**: Personal
- **Campos**:
  - `asignatura` (text, required)
  - `tipo` (select, required): ["prueba", "trabajo", "examen", "participación"]
  - `calificacion` (number, required): 1-7
  - `ponderacion` (number, optional): %
- **Tags sugeridos**: `aprobado`, `reprobado`, `sobresaliente`

---

### Categoría: Vehículos 🚗

**Futuro** - Para hogares con uno o más vehículos.

#### 1. Mantenimiento Vehicular 🔧
- **Slug**: `mantenimiento-vehicular`
- **Ownership**: Shared
- **Campos**:
  - `vehiculo` (text, required): ej. "Toyota Corolla 2020"
  - `tipo` (select, required): ["cambio-aceite", "neumáticos", "frenos", "revisión-técnica", "otro"]
  - `kilometraje` (number, optional)
  - `costo` (number, optional)
  - `proximo_servicio` (date, optional)
- **Tags sugeridos**: `preventivo`, `correctivo`, `garantía`

#### 2. Combustible ⛽
- **Slug**: `combustible`
- **Ownership**: Personal
- **Campos**:
  - `vehiculo` (text, required)
  - `litros` (number, required)
  - `costo_total` (number, required)
  - `precio_litro` (number, computed)
  - `kilometraje` (number, optional)
- **Tags sugeridos**: `viaje`, `rutina`

#### 3. Seguros y Permisos 📄
- **Slug**: `seguros-vehiculos`
- **Ownership**: Shared
- **Campos**:
  - `vehiculo` (text, required)
  - `tipo` (select, required): ["seguro-obligatorio", "seguro-completo", "permiso-circulación", "revisión-técnica"]
  - `monto` (number, required)
  - `fecha_vencimiento` (date, required)
  - `renovado` (boolean, default: false)
- **Tags sugeridos**: `vencido`, `renovado`, `pendiente`

#### 4. Multas y Infracciones 🚦
- **Slug**: `multas`
- **Ownership**: Personal
- **Campos**:
  - `vehiculo` (text, required)
  - `tipo_infraccion` (text, required)
  - `monto` (number, required)
  - `fecha_infraccion` (date, required)
  - `pagada` (boolean, default: false)
- **Tags sugeridos**: `grave`, `leve`, `apelada`

---

## 🔄 Flujos de Usuario

### 1. Flujo de Creación de Hogar (/start)

```
Usuario: /start
Bot: ¿Eres nuevo usuario?
  ├─ [Crear Hogar] → Pide nombre del hogar
  │   └─ Crea household + user (admin)
  │       └─ "¡Bienvenido! Tu hogar 'X' ha sido creado"
  │
  └─ [Ya tengo código] → Pide código de invitación
      └─ Valida código
          ├─ Válido → Vincula usuario al hogar
          └─ Inválido → "Código no válido, intenta de nuevo"
```

### 2. Flujo de Invitación (/invitar)

```
Usuario: /invitar
Bot: Verifica que el usuario sea admin
  ├─ Es admin
  │   └─ Genera código único (6 caracteres)
  │       └─ Inserta en household_invites (válido 7 días)
  │           └─ "Comparte este código: ABC123"
  │
  └─ No es admin
      └─ "Solo administradores pueden invitar"
```

### 3. Flujo de Registro de Presión (/registrar presion)

```
Usuario: /registrar presion
Bot: Muestra opciones de entrada
  ├─ [Formato rápido: 120/80]
  │   └─ Parser extrae sistólica y diastólica
  │       └─ "¿Pulso? (opcional)" → guarda o continúa
  │
  └─ [Paso a paso]
      └─ "Sistólica?" → valida 60-250
          └─ "Diastólica?" → valida 40-150
              └─ "¿Pulso?" → valida 40-200 o skip
                  └─ "¿En ayunas?" → boolean
                      └─ "¿Brazo?" → select

Bot: Construye esquema Zod dinámico
  └─ Valida datos completos
      ├─ Válido → Inserta en records
      │   └─ "✅ Presión registrada: 120/80 mmHg"
      │
      └─ Inválido → Muestra errores
          └─ "Sistólica debe estar entre 60-250"
```

### 4. Flujo de Cancelación (/cancelar)

```
Usuario: /cancelar (durante cualquier escena)
Bot: Limpia sesión actual
  └─ "Operación cancelada. ¿En qué puedo ayudarte?"
      └─ Muestra menú principal
```

### 5. Flujo de Últimos Registros (/ultimos)

```
Usuario: /ultimos
Bot: Obtiene household_id del usuario
  └─ Query: últimos 5 registros de presión
      └─ Formatea con formatDateForUser()
          └─ Muestra lista:
              "📅 13/02/2026 14:30 - 120/80 mmHg (pulso: 72)"
              "📅 12/02/2026 08:15 - 115/75 mmHg"
```

---

## 🎯 Decisiones Técnicas Clave

| Aspecto | Decisión | Justificación |
|---------|----------|---------------|
| **Autenticación** | Basada en `telegram_id` + RLS | Evita complejidad de Supabase Auth, aprovecha RLS nativo, simplicidad operacional |
| **Validación** | Dinámica desde BD con Zod | Escalable: nuevas categorías sin desplegar código, type-safety en runtime |
| **Sesiones** | Persistentes en Supabase | Sobreviven a reinicios del bot, facilitan debugging, habilitan flujos largos |
| **Logging** | Pino con contexto estructurado | Trazabilidad completa, debugging eficiente, compatible con observabilidad moderna |
| **Fechas** | UTC + `moment-timezone` (Chile) | Consistencia en BD, facilita futuro multi-timezone, precisión en consultas temporales |
| **TypeScript** | Strict mode | Type safety máxima, prevención de errores, mejor DX |
| **Multi-tenancy** | 1 usuario = 1 hogar (1:1) | Simplifica lógica inicial, facilita onboarding, suficiente para MVP |
| **Esquema de datos** | `data` JSONB + validación dinámica | Flexibilidad para evolucionar campos sin migraciones, validación en app garantiza calidad |
| **Parsers personalizados** | Por subcategoría (ej: "120/80") | UX optimizada, reduce fricción en inputs frecuentes |
| **RLS** | Políticas por tabla + `telegram_id` | Seguridad en profundidad, imposible acceder datos de otros hogares |

---

## 🚀 Roadmap

### Fase 1: MVP - Salud/Presión (2 semanas) ✅

**Objetivo**: Sistema funcional end-to-end con una subcategoría completa.

- [x] Configuración de Supabase (BD, RLS, migraciones)
- [x] Bot básico con Telegraf + TypeScript
- [x] Autenticación vía `telegram_id`
- [x] Comandos: `/start`, `/registrar`, `/ultimos`, `/invitar`, `/cancelar`
- [x] Flujo completo de registro de presión arterial
- [x] Validación dinámica con Zod
- [x] Sesiones persistentes
- [x] Logging con Pino
- [x] Manejo de fechas UTC + Chile
- [x] Parser personalizado "120/80"
- [x] Sistema de tags básico

**Entregable**: Bot funcional que permite a múltiples hogares registrar presión arterial de forma aislada.

---

### Fase 2: Expansión Salud (3-4 semanas)

**Objetivo**: Activar todas las subcategorías de Salud.

- [ ] Subcategoría Glucosa (con momento de medición)
- [ ] Subcategoría Peso/IMC (cálculo automático)
- [ ] Subcategoría Medicamentos (recordatorios futuros)
- [ ] Subcategoría Citas Médicas (con notificaciones)
- [ ] Subcategoría Síntomas
- [ ] Subcategoría Resultados de Exámenes
- [ ] Comando `/estadisticas` (gráficos básicos)
- [ ] Exportación de datos (CSV/PDF)
- [ ] Mejoras en parsers (ej: "gluc: 95 mg/dL ayunas")

**Entregable**: Sistema de salud completo con 7 subcategorías activas.

---

### Fase 3: Finanzas y Gastos Compartidos (4-6 semanas)

**Objetivo**: Habilitar gestión financiera colaborativa.

- [ ] Activar categoría Finanzas
- [ ] Subcategoría Gastos Compartidos (división automática)
- [ ] Sistema de balances entre usuarios
- [ ] Subcategoría Deudas (tracking de préstamos)
- [ ] Subcategoría Pagos (liquidación de deudas)
- [ ] Comando `/balance` (estado de cuentas)
- [ ] Comando `/liquidar` (simplificación de deudas)
- [ ] Notificaciones de gastos pendientes
- [ ] Reportes mensuales automáticos

**Entregable**: Sistema financiero multi-usuario con división justa de gastos.

---

### Fase 4: Dashboard Web y Categorías Adicionales (futuro)

**Objetivo**: Expandir accesibilidad y funcionalidades.

- [ ] Dashboard web (Next.js + Supabase)
- [ ] Gráficos interactivos (Chart.js/Recharts)
- [ ] Activar categoría Hogar (Mantenimiento, Facturas, Inventario)
- [ ] Activar categoría Educación (opcional)
- [ ] Activar categoría Vehículos (opcional)
- [ ] Sistema de notificaciones push
- [ ] Integración con Google Calendar
- [ ] API pública para integraciones
- [ ] Multi-timezone (detectar por usuario)

**Entregable**: Plataforma completa con acceso web y móvil.

---

## 📄 Licencia

Este documento es parte del proyecto LaCasita y está protegido bajo [licencia a definir].

---

**Última actualización**: 13 de Febrero, 2026  
**Versión del documento**: 1.0  
**Mantenedores**: [Equipo LaCasita]