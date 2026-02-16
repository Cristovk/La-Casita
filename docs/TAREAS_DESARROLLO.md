# TAREAS_DESARROLLO.md

**Plan de Trabajo Detallado para LaCasita Bot**

---

## 📋 Índice

1. [Fase 0: Setup Inicial del Proyecto](#fase-0-setup-inicial-del-proyecto)
2. [Fase 1: Base de Datos (Migraciones SQL)](#fase-1-base-de-datos-migraciones-sql)
3. [Fase 2: Servicios Base](#fase-2-servicios-base)
4. [Fase 3: Middleware y Manejo de Errores](#fase-3-middleware-y-manejo-de-errores)
5. [Fase 4: Comandos Básicos](#fase-4-comandos-básicos)
6. [Fase 5: Flujo de Registro (Presión Arterial)](#fase-5-flujo-de-registro-presión-arterial)
7. [Fase 6: Comandos Adicionales MVP](#fase-6-comandos-adicionales-mvp)
8. [Fase 7: Testing y Ajustes](#fase-7-testing-y-ajustes)
9. [Fase 8: Despliegue](#fase-8-despliegue)

---

## 🎯 FASE 0: Setup Inicial del Proyecto

### 👤 Responsabilidad del Desarrollador

- [ ] **0.1** Crear cuenta en [Supabase](https://supabase.com)
  - Crear nuevo proyecto llamado "LaCasita"
  - Región: South America (São Paulo) - más cercana a Chile
  - Anotar credenciales:
    - `SUPABASE_URL`: https://[project-id].supabase.co
    - `SUPABASE_ANON_KEY`: (encontrar en Settings > API)
    - **IMPORTANTE**: NO usar `service_role_key`, solo `anon_key`

- [ ] **0.2** Crear bot en Telegram
  - Abrir chat con [@BotFather](https://t.me/BotFather)
  - Ejecutar `/newbot`
  - Nombre del bot: "LaCasita"
  - Username: `LaCasitaBot` (o variante disponible)
  - Anotar `BOT_TOKEN`
  - Configurar comandos con `/setcommands`:
    ```
    start - Iniciar o crear hogar
    registrar - Registrar datos de salud
    ultimos - Ver últimos registros
    invitar - Generar código de invitación
    mihogar - Ver información del hogar
    ayuda - Ver comandos disponibles
    cancelar - Cancelar operación actual
    ```

- [ ] **0.3** Crear repositorio GitHub
  - Nombre: `LaCasita`
  - Inicializar con README.md
  - Clonar localmente
  - Crear estructura de carpetas base:
    ```
    LaCasita/
    ├── supabase/
    │   ├── migrations/
    │   └── seed.sql
    └── telegram-bot/
        └── src/
    ```

### 🤖 Solicitar a la IA

#### **Prompt 0.1: Estructura TypeScript Completa**

```
Necesito la estructura completa de un proyecto TypeScript para un bot de Telegram con Supabase.

Requisitos:

1. **tsconfig.json** con configuración estricta:
   - strict: true
   - target: ES2022
   - module: NodeNext
   - moduleResolution: NodeNext
   - esModuleInterop: true
   - outDir: dist
   - rootDir: src
   - resolveJsonModule: true
   - skipLibCheck: true

2. **package.json** con:
   - name: "lacasita-bot"
   - version: "1.0.0"
   - type: "module"
   - Dependencias:
     * telegraf: ^4.16.0
     * @supabase/supabase-js: ^2.39.0
     * zod: ^3.22.0
     * pino: ^8.17.0
     * pino-pretty: ^10.3.0
     * moment-timezone: ^0.5.44
     * dotenv: ^16.3.1
   - DevDependencias:
     * @types/node: ^20.10.0
     * typescript: ^5.3.0
     * nodemon: ^3.0.0
     * ts-node: ^10.9.0
   - Scripts:
     * dev: "nodemon --exec ts-node --esm src/bot.ts"
     * build: "tsc"
     * start: "node dist/bot.js"
     * lint: "tsc --noEmit"

3. **Estructura de carpetas completa**:
   ```
   telegram-bot/
   ├── src/
   │   ├── types/
   │   │   ├── context.ts
   │   │   ├── subcategory.ts
   │   │   └── session.ts
   │   ├── utils/
   │   │   ├── logger.ts
   │   │   ├── dateUtils.ts
   │   │   └── parsers/
   │   │       └── index.ts
   │   ├── services/
   │   │   ├── supabase.ts
   │   │   ├── dynamicValidator.ts
   │   │   └── sessionStore.ts
   │   ├── middleware/
   │   │   ├── auth.ts
   │   │   ├── logger.ts
   │   │   └── commandInterceptor.ts
   │   ├── handlers/
   │   │   └── errorHandler.ts
   │   ├── commands/
   │   │   ├── start.ts
   │   │   ├── register.ts
   │   │   ├── latest.ts
   │   │   ├── invite.ts
   │   │   ├── myHousehold.ts
   │   │   ├── help.ts
   │   │   └── cancel.ts
   │   ├── flows/
   │   │   └── presionFlow.ts
   │   └── bot.ts
   ├── .env.example
   ├── .gitignore
   ├── package.json
   ├── tsconfig.json
   └── README.md
   ```

4. **.env.example** con todas las variables necesarias:
   ```
   BOT_TOKEN=
   SUPABASE_URL=
   SUPABASE_ANON_KEY=
   NODE_ENV=development
   LOG_LEVEL=debug
   ```

5. **.gitignore** para Node.js + TypeScript (incluir: node_modules/, dist/, .env, *.log)

6. **README.md** básico con:
   - Descripción del proyecto
   - Requisitos (Node.js 22+)
   - Instrucciones de instalación
   - Variables de entorno
   - Comandos disponibles (dev, build, start)

Generar todos los archivos con contenido base. Los archivos TypeScript deben tener comentarios explicativos y exports/imports correctos para ESM.
```

#### **Prompt 0.2: Tipos Globales TypeScript**

```
Crear los archivos de tipos TypeScript para el proyecto LaCasita:

1. **src/types/context.ts**: Extender el contexto de Telegraf
   ```typescript
   import { Context, Scenes } from 'telegraf';
   import { SupabaseClient } from '@supabase/supabase-js';
   import { Logger } from 'pino';

   interface SessionData {
     // Definir estructura completa de sesión
     currentScene?: string;
     step?: number;
     tempData?: {
       subcategoryId?: string;
       recordData?: Record<string, any>;
       inviteCode?: string;
       householdName?: string;
     };
   }

   interface UserState {
     id: string;
     telegram_id: string;
     first_name: string;
     last_name?: string;
     role: 'admin' | 'member';
     household_id: string;
     household_name: string;
   }

   interface MyContext extends Context {
     session: SessionData;
     state: {
       user?: UserState;
     };
     supabase: SupabaseClient;
     log: Logger;
     scene: Scenes.SceneContextScene<MyContext>;
   }

   export { MyContext, SessionData, UserState };
   ```

2. **src/types/subcategory.ts**: Interfaces para esquemas dinámicos
   ```typescript
   type FieldType = 'number' | 'text' | 'date' | 'datetime' | 'select' | 'boolean';

   interface ValidationRules {
     min?: number;
     max?: number;
     regex?: string;
     options?: string[];
   }

   interface FieldDefinition {
     id: string;
     subcategory_id: string;
     field_name: string;
     field_type: FieldType;
     is_required: boolean;
     validation_rules?: ValidationRules;
     unit?: string;
     default_value?: string;
     display_order: number;
   }

   interface SubcategorySchema {
     id: string;
     name: string;
     slug: string;
     icon?: string;
     ownership_type: 'personal' | 'shared' | 'both';
     fields: FieldDefinition[];
     is_active: boolean;
   }

   interface RecordData {
     id: string;
     household_id: string;
     user_id: string;
     subcategory_id: string;
     data: Record<string, any>;
     recorded_at: string;
     notes?: string;
     created_at: string;
   }

   export {
     FieldType,
     ValidationRules,
     FieldDefinition,
     SubcategorySchema,
     RecordData
   };
   ```

3. **src/types/session.ts**: Interfaz detallada para datos de sesión
   ```typescript
   interface PresionData {
     sistolica?: number;
     diastolica?: number;
     pulso?: number;
     en_ayunas?: boolean;
     brazo?: 'izquierdo' | 'derecho';
   }

   interface SessionTempData {
     // Para flujo de registro
     subcategoryId?: string;
     subcategorySlug?: string;
     recordData?: Record<string, any>;
     currentField?: string;
     fieldIndex?: number;
     
     // Para flujo de invitación
     inviteCode?: string;
     
     // Para flujo de creación de hogar
     householdName?: string;
     
     // Datos específicos de presión
     presion?: PresionData;
   }

   interface SessionData {
     currentScene?: string;
     step?: number;
     tempData?: SessionTempData;
   }

   export { SessionData, SessionTempData, PresionData };
   ```

Asegúrate de que todos los archivos usen ESM (import/export) y sean compatibles con TypeScript strict mode.
```

---

## 🗄️ FASE 1: Base de Datos (Migraciones SQL)

### 🤖 Solicitar a la IA

#### **Prompt 1.1: Migración Inicial - Extensiones y Households**

```
Crear migración SQL para inicializar la base de datos de LaCasita.

Archivo: supabase/migrations/20260213000001_initial_setup.sql

Contenido:
1. Habilitar extensiones necesarias:
   - uuid-ossp (para UUIDs)
   - pg_trgm (para búsquedas de texto)

2. Crear tabla 'households':
   - id (UUID, PK, default uuid_generate_v4())
   - name (TEXT, NOT NULL)
   - timezone (TEXT, DEFAULT 'America/Santiago')
   - created_at (TIMESTAMPTZ, DEFAULT NOW())
   - updated_at (TIMESTAMPTZ, DEFAULT NOW())

3. Crear trigger para updated_at automático

4. Comentarios SQL explicativos en cada sección

Formato: SQL bien formateado, con comentarios, usando convenciones PostgreSQL.
```

#### **Prompt 1.2: Migración Users**

```
Crear migración SQL para tabla 'users'.

Archivo: supabase/migrations/20260213000002_create_users.sql

Contenido:
1. Crear tabla 'users':
   - id (UUID, PK, default uuid_generate_v4())
   - household_id (UUID, NOT NULL, FK a households ON DELETE CASCADE)
   - telegram_id (TEXT, UNIQUE, NOT NULL)
   - telegram_username (TEXT, nullable)
   - first_name (TEXT, nullable)
   - last_name (TEXT, nullable)
   - role (TEXT, DEFAULT 'member', CHECK role IN ('admin', 'member'))
   - created_at (TIMESTAMPTZ, DEFAULT NOW())
   - updated_at (TIMESTAMPTZ, DEFAULT NOW())

2. Índices:
   - idx_users_telegram_id (telegram_id)
   - idx_users_household (household_id)

3. Trigger para updated_at

4. Comentarios explicando que telegram_id es la clave de autenticación
```

#### **Prompt 1.3: Migración Household Invites**

```
Crear migración SQL para tabla 'household_invites'.

Archivo: supabase/migrations/20260213000003_create_household_invites.sql

Contenido:
1. Crear tabla 'household_invites':
   - id (UUID, PK)
   - household_id (UUID, NOT NULL, FK a households ON DELETE CASCADE)
   - invite_code (TEXT, UNIQUE, NOT NULL)
   - created_by (UUID, nullable, FK a users)
   - expires_at (TIMESTAMPTZ, NOT NULL)
   - used_by (UUID, nullable, FK a users)
   - used_at (TIMESTAMPTZ, nullable)
   - created_at (TIMESTAMPTZ, DEFAULT NOW())

2. Índices:
   - idx_invites_code (invite_code)
   - idx_invites_household (household_id)

3. Comentarios explicando el flujo de invitación (válido 7 días, uso único)
```

#### **Prompt 1.4: Migración Categories**

```
Crear migración SQL para tabla 'categories'.

Archivo: supabase/migrations/20260213000004_create_categories.sql

Contenido:
1. Crear tabla 'categories':
   - id (UUID, PK)
   - household_id (UUID, nullable, FK a households ON DELETE CASCADE)
     * NULL = categoría global (sistema)
     * UUID = categoría personalizada de un hogar
   - name (TEXT, NOT NULL)
   - slug (TEXT, NOT NULL)
   - icon (TEXT, nullable) - emoji o código de icono
   - is_active (BOOLEAN, DEFAULT true)
   - created_at (TIMESTAMPTZ, DEFAULT NOW())

2. Índice único compuesto:
   - idx_categories_slug_unique ON (COALESCE(household_id::text, 'global'), slug)

3. Comentarios explicando categorías globales vs. personalizadas
```

#### **Prompt 1.5: Migración Subcategories**

```
Crear migración SQL para tabla 'subcategories'.

Archivo: supabase/migrations/20260213000005_create_subcategories.sql

Contenido:
1. Crear tabla 'subcategories':
   - id (UUID, PK)
   - category_id (UUID, NOT NULL, FK a categories ON DELETE CASCADE)
   - name (TEXT, NOT NULL)
   - slug (TEXT, NOT NULL)
   - icon (TEXT, nullable)
   - ownership_type (TEXT, DEFAULT 'personal', CHECK ownership_type IN ('personal', 'shared', 'both'))
   - data_schema (JSONB, nullable) - esquema legacy para compatibilidad
   - is_active (BOOLEAN, DEFAULT true)
   - created_at (TIMESTAMPTZ, DEFAULT NOW())

2. Índices:
   - idx_subcategories_category (category_id)
   - idx_subcategories_slug (slug)

3. Comentarios explicando ownership_type:
   - 'personal': solo el usuario que crea el registro
   - 'shared': todos los miembros del hogar pueden ver/editar
   - 'both': permite ambos modos
```

#### **Prompt 1.6: Migración Subcategory Fields**

```
Crear migración SQL para tabla 'subcategory_fields'.

Archivo: supabase/migrations/20260213000006_create_subcategory_fields.sql

Contenido:
1. Crear tabla 'subcategory_fields':
   - id (UUID, PK)
   - subcategory_id (UUID, NOT NULL, FK a subcategories ON DELETE CASCADE)
   - field_name (TEXT, NOT NULL) - nombre del campo en el objeto data
   - field_type (TEXT, NOT NULL, CHECK field_type IN ('number', 'text', 'date', 'datetime', 'select', 'boolean'))
   - is_required (BOOLEAN, DEFAULT false)
   - validation_rules (JSONB, nullable) - {min, max, regex, options}
   - unit (TEXT, nullable) - ej: 'mmHg', 'mg/dL', 'kg'
   - default_value (TEXT, nullable)
   - display_order (INTEGER, DEFAULT 0)
   - created_at (TIMESTAMPTZ, DEFAULT NOW())

2. Índices:
   - idx_fields_subcategory (subcategory_id)
   - idx_fields_order (subcategory_id, display_order)

3. Comentarios explicando cada field_type y estructura de validation_rules:
   ```json
   {
     "min": 60,
     "max": 250,
     "regex": "^[0-9]+$",
     "options": ["opcion1", "opcion2"]
   }
   ```
```

#### **Prompt 1.7: Migración Tags**

```
Crear migración SQL para tabla 'tags'.

Archivo: supabase/migrations/20260213000007_create_tags.sql

Contenido:
1. Crear tabla 'tags':
   - id (UUID, PK)
   - household_id (UUID, nullable, FK a households ON DELETE CASCADE)
     * NULL = tag global (sistema)
     * UUID = tag personalizado de un hogar
   - name (TEXT, NOT NULL)
   - color (TEXT, nullable) - código hex o nombre de color
   - created_at (TIMESTAMPTZ, DEFAULT NOW())

2. Índice único compuesto para evitar duplicados:
   - idx_tags_household_name_unique ON (COALESCE(household_id::text, 'global'), name)

3. Comentarios explicando tags globales (sugeridos) vs. personalizados
```

#### **Prompt 1.8: Migración Records**

```
Crear migración SQL para tabla 'records' (tabla principal de datos).

Archivo: supabase/migrations/20260213000008_create_records.sql

Contenido:
1. Crear tabla 'records':
   - id (UUID, PK)
   - household_id (UUID, NOT NULL, FK a households ON DELETE CASCADE)
   - user_id (UUID, NOT NULL, FK a users ON DELETE CASCADE)
   - subcategory_id (UUID, NOT NULL, FK a subcategories ON DELETE CASCADE)
   - data (JSONB, NOT NULL) - datos validados dinámicamente
   - recorded_at (TIMESTAMPTZ, DEFAULT NOW()) - fecha/hora del evento
   - notes (TEXT, nullable) - notas adicionales del usuario
   - created_at (TIMESTAMPTZ, DEFAULT NOW())
   - updated_at (TIMESTAMPTZ, DEFAULT NOW())

2. Índices para optimizar consultas:
   - idx_records_household (household_id)
   - idx_records_user (user_id)
   - idx_records_subcategory (subcategory_id)
   - idx_records_date (recorded_at DESC)
   - idx_records_data (data) USING GIN - para búsquedas en JSONB

3. Trigger para updated_at

4. Comentarios explicando que 'data' se valida en la aplicación con esquemas dinámicos
```

#### **Prompt 1.9: Migración Record Tags (Relación M:N)**

```
Crear migración SQL para tabla 'record_tags' (relación muchos a muchos).

Archivo: supabase/migrations/20260213000009_create_record_tags.sql

Contenido:
1. Crear tabla 'record_tags':
   - record_id (UUID, NOT NULL, FK a records ON DELETE CASCADE)
   - tag_id (UUID, NOT NULL, FK a tags ON DELETE CASCADE)
   - PRIMARY KEY (record_id, tag_id)

2. Índices:
   - idx_record_tags_record (record_id)
   - idx_record_tags_tag (tag_id)

3. Comentarios explicando la relación muchos a muchos
```

#### **Prompt 1.10: Migración User Balances**

```
Crear migración SQL para tabla 'user_balances' (finanzas).

Archivo: supabase/migrations/20260213000010_create_user_balances.sql

Contenido:
1. Crear tabla 'user_balances':
   - id (UUID, PK)
   - household_id (UUID, NOT NULL, FK a households ON DELETE CASCADE)
   - user_id (UUID, NOT NULL, FK a users ON DELETE CASCADE)
   - balance (DECIMAL(12,2), DEFAULT 0)
   - updated_at (TIMESTAMPTZ, DEFAULT NOW())

2. Constraint UNIQUE (household_id, user_id)

3. Índices:
   - idx_balances_household (household_id)
   - idx_balances_user (user_id)

4. Trigger para updated_at

5. Comentarios: "Balance positivo = otros deben al usuario, negativo = usuario debe"
```

#### **Prompt 1.11: Migración Expense Splits**

```
Crear migración SQL para tabla 'expense_splits' (división de gastos).

Archivo: supabase/migrations/20260213000011_create_expense_splits.sql

Contenido:
1. Crear tabla 'expense_splits':
   - id (UUID, PK)
   - record_id (UUID, NOT NULL, FK a records ON DELETE CASCADE)
   - user_id (UUID, NOT NULL, FK a users ON DELETE CASCADE)
   - amount (DECIMAL(10,2), NOT NULL) - monto que debe pagar
   - paid_amount (DECIMAL(10,2), DEFAULT 0) - monto ya pagado
   - created_at (TIMESTAMPTZ, DEFAULT NOW())

2. Índices:
   - idx_expense_splits_record (record_id)
   - idx_expense_splits_user (user_id)

3. Check constraint: paid_amount <= amount

4. Comentarios explicando el flujo de gastos compartidos
```

#### **Prompt 1.12: Migración Debts**

```
Crear migración SQL para tabla 'debts' (deudas entre usuarios).

Archivo: supabase/migrations/20260213000012_create_debts.sql

Contenido:
1. Crear tabla 'debts':
   - id (UUID, PK)
   - household_id (UUID, NOT NULL, FK a households ON DELETE CASCADE)
   - debtor_id (UUID, NOT NULL, FK a users) - quien debe
   - creditor_id (UUID, NOT NULL, FK a users) - a quien se debe
   - amount (DECIMAL(10,2), NOT NULL)
   - description (TEXT, nullable)
   - is_settled (BOOLEAN, DEFAULT false)
   - created_at (TIMESTAMPTZ, DEFAULT NOW())
   - settled_at (TIMESTAMPTZ, nullable)

2. Check constraint: debtor_id != creditor_id

3. Índices:
   - idx_debts_household (household_id)
   - idx_debts_debtor (debtor_id)
   - idx_debts_creditor (creditor_id)
   - idx_debts_unsettled (household_id) WHERE is_settled = false

4. Comentarios explicando simplificación de deudas
```

#### **Prompt 1.13: Migración Payments**

```
Crear migración SQL para tabla 'payments' (pagos de deudas).

Archivo: supabase/migrations/20260213000013_create_payments.sql

Contenido:
1. Crear tabla 'payments':
   - id (UUID, PK)
   - debt_id (UUID, NOT NULL, FK a debts ON DELETE CASCADE)
   - amount (DECIMAL(10,2), NOT NULL)
   - paid_at (TIMESTAMPTZ, DEFAULT NOW())
   - notes (TEXT, nullable)

2. Índices:
   - idx_payments_debt (debt_id)
   - idx_payments_date (paid_at DESC)

3. Comentarios explicando pagos parciales vs. completos
```

#### **Prompt 1.14: Migración Sessions**

```
Crear migración SQL para tabla 'sessions' (persistencia de sesiones del bot).

Archivo: supabase/migrations/20260213000014_create_sessions.sql

Contenido:
1. Crear tabla 'sessions':
   - key (TEXT, PK) - formato: "chat_id:user_id" de Telegraf
   - session (JSONB, NOT NULL) - datos completos de la sesión
   - expires_at (TIMESTAMPTZ, NOT NULL)
   - created_at (TIMESTAMPTZ, DEFAULT NOW())
   - updated_at (TIMESTAMPTZ, DEFAULT NOW())

2. Índices:
   - idx_sessions_expires (expires_at) - para limpieza automática

3. Trigger para updated_at

4. Comentarios explicando TTL de 24 horas y limpieza periódica
```

#### **Prompt 1.15: Función RPC set_telegram_id**

```
Crear migración SQL para función 'set_telegram_id'.

Archivo: supabase/migrations/20260213000015_create_set_telegram_id_function.sql

Contenido:
1. Crear función PostgreSQL:
   ```sql
   CREATE OR REPLACE FUNCTION set_telegram_id(telegram_id text)
   RETURNS void
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   BEGIN
     PERFORM set_config('app.telegram_id', telegram_id, false);
   END;
   $$;
   ```

2. Comentarios explicando:
   - Esta función se llama al inicio de cada request
   - Establece el contexto para las políticas RLS
   - SECURITY DEFINER permite que anon_key ejecute set_config
   - false = configuración persiste durante toda la transacción

3. Grant EXECUTE a anon (rol público)
```

#### **Prompt 1.16: Políticas RLS Completas**

```
Crear migración SQL con TODAS las políticas RLS usando telegram_id.

Archivo: supabase/migrations/20260213000016_create_rls_policies.sql

Contenido:

1. Habilitar RLS en todas las tablas:
   ```sql
   ALTER TABLE households ENABLE ROW LEVEL SECURITY;
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   -- ... etc para todas las tablas
   ```

2. Políticas para 'households':
   - SELECT: usuarios ven su propio hogar
   - INSERT: cualquiera puede crear hogar (para /start)
   - UPDATE: solo admins del hogar
   - DELETE: solo admins del hogar

3. Políticas para 'users':
   - SELECT: usuarios ven miembros de su hogar
   - INSERT: al crear hogar o unirse con código
   - UPDATE: usuarios pueden actualizar sus propios datos
   - DELETE: solo admins pueden eliminar usuarios

4. Políticas para 'records':
   - SELECT: usuarios ven registros de su hogar
   - INSERT: usuarios pueden insertar en su hogar
   - UPDATE: usuarios pueden actualizar sus propios registros
   - DELETE: usuarios pueden eliminar sus propios registros

5. Políticas para 'tags':
   - SELECT: todos ven tags globales + tags de su hogar
   - INSERT/UPDATE/DELETE: solo para tags del hogar (no globales)

6. Políticas para 'sessions':
   - Cada usuario solo ve/modifica sus propias sesiones
   - Usar telegram_id para identificar usuario

7. Políticas para tablas financieras (user_balances, expense_splits, debts, payments):
   - Solo usuarios del hogar correspondiente

8. Usar SIEMPRE: `current_setting('app.telegram_id', true)::text`

Ejemplo de política:
```sql
CREATE POLICY "Users can view their household records"
ON records FOR SELECT
USING (
  household_id IN (
    SELECT household_id FROM users 
    WHERE telegram_id = current_setting('app.telegram_id', true)::text
  )
);
```

Comentarios explicando el flujo completo de autenticación y RLS.
```

#### **Prompt 1.17: Seed Data Completo**

```
Crear archivo seed.sql con datos iniciales COMPLETOS para LaCasita.

Archivo: supabase/seed.sql

Contenido:

1. **Categorías Principales** (insertar con IDs fijos usando gen_random_uuid() documentado):
   - Salud (icon: 🏥, slug: salud, is_active: true)
   - Finanzas (icon: 💰, slug: finanzas, is_active: false)
   - Hogar (icon: 🏠, slug: hogar, is_active: false)
   - Educación (icon: 🎓, slug: educacion, is_active: false)
   - Vehículos (icon: 🚗, slug: vehiculos, is_active: false)

2. **Subcategorías de Salud** (TODAS activas):
   - Presión Arterial (icon: 💉)
   - Glucosa (icon: 🍬)
   - Peso y IMC (icon: ⚖️)
   - Medicamentos (icon: 💊)
   - Citas Médicas (icon: 🩺)
   - Síntomas (icon: 🤒)
   - Resultados de Exámenes (icon: 🧪)

3. **Subcategory_fields para Presión Arterial**:
   ```sql
   INSERT INTO subcategory_fields (subcategory_id, field_name, field_type, is_required, validation_rules, unit, display_order)
   VALUES
   ('[presion_id]', 'sistolica', 'number', true, '{"min": 60, "max": 250}'::jsonb, 'mmHg', 1),
   ('[presion_id]', 'diastolica', 'number', true, '{"min": 40, "max": 150}'::jsonb, 'mmHg', 2),
   ('[presion_id]', 'pulso', 'number', false, '{"min": 40, "max": 200}'::jsonb, 'bpm', 3),
   ('[presion_id]', 'en_ayunas', 'boolean', false, NULL, NULL, 4),
   ('[presion_id]', 'brazo', 'select', false, '{"options": ["izquierdo", "derecho"]}'::jsonb, NULL, 5);
   ```

4. **Subcategory_fields para Glucosa, Peso, Medicamentos, etc.**
   (Completar según el listado del documento LaCasita_PROJECT.md)

5. **Tags Globales** (household_id NULL):
   
   Para Presión Arterial:
   - mañana, tarde, noche
   - medicado, sin-medicacion
   - ejercicio, reposo
   - estrés, relajado
   
   Para Glucosa:
   - normal, alto, bajo
   - hipoglucemia, hiperglucemia
   
   Para Peso:
   - objetivo, progreso, estancado
   
   (Y así para cada subcategoría activa)

6. **Subcategorías de Finanzas** (todas con is_active: false):
   - Gastos Compartidos
   - Gastos Personales
   - Ingresos
   - Deudas
   - Presupuestos
   
   (Con sus respectivos fields definidos pero no activos)

7. **Subcategorías de Hogar, Educación, Vehículos** (todas inactivas)

IMPORTANTE:
- Usar comentarios SQL para separar claramente cada sección
- Documentar los IDs generados para referencias FK
- Incluir TODOS los campos de TODAS las subcategorías (incluso las inactivas)
- El archivo debe ser ejecutable directamente en Supabase SQL Editor

Organización sugerida:
```sql
-- ============================================
-- CATEGORÍAS PRINCIPALES
-- ============================================

-- ============================================
-- SUBCATEGORÍAS - SALUD (ACTIVAS)
-- ============================================

-- ============================================
-- FIELDS - PRESIÓN ARTERIAL
-- ============================================

-- ... etc
```
```

### 👤 Responsabilidad del Desarrollador

- [ ] **1.1** Ejecutar migraciones en orden
  - Abrir Supabase Dashboard > SQL Editor
  - Copiar contenido de cada migración generada por IA
  - Ejecutar en orden secuencial (001, 002, 003...)
  - Verificar que cada una ejecute sin errores
  - Revisar que las tablas se creen correctamente en Table Editor

- [ ] **1.2** Ejecutar seed.sql
  - Copiar contenido completo de seed.sql
  - Ejecutar en SQL Editor
  - Verificar en Table Editor que existan:
    - 5 categorías (solo Salud activa)
    - 7 subcategorías de Salud
    - ~30-40 tags globales
    - Múltiples subcategory_fields

- [ ] **1.3** Validar RLS
  - Intentar ejecutar: `SELECT * FROM users;` (debería fallar sin telegram_id)
  - Ejecutar: `SELECT set_telegram_id('test123'); SELECT * FROM users;` (debería funcionar)
  - Confirmar que las políticas están activas

---

## ⚙️ FASE 2: Servicios Base

### 🤖 Solicitar a la IA

#### **Prompt 2.1: Logger con Pino**

```
Crear archivo src/utils/logger.ts para configuración de Pino.

Requisitos:
1. Importar pino y pino-pretty
2. Detectar NODE_ENV:
   - development: usar pino-pretty con colorize
   - production: JSON estructurado (sin pretty)
3. Nivel de log desde LOG_LEVEL env var (default: 'info')
4. Base metadata: { env, bot: 'LaCasita' }
5. Exportar logger configurado
6. Comentarios explicando cada opción

Ejemplo de uso:
```typescript
import logger from './utils/logger.js';

logger.info({ userId: '123' }, 'User logged in');
logger.error({ error }, 'Database connection failed');
```

Formato ESM, TypeScript strict.
```

#### **Prompt 2.2: Utilidades de Fechas**

```
Crear archivo src/utils/dateUtils.ts con funciones para manejo de fechas con moment-timezone.

Funciones requeridas:

1. **formatDateForUser(utcDate, format?)**
   - Parámetros: Date | string, formato opcional (default: 'DD/MM/YYYY HH:mm')
   - Convierte fecha UTC a zona 'America/Santiago'
   - Retorna string formateado

2. **parseUserDate(input, format?)**
   - Parámetros: string, formato opcional (default: 'DD/MM/YYYY HH:mm')
   - Asume input en zona 'America/Santiago'
   - Retorna Date en UTC

3. **nowUTC()**
   - Sin parámetros
   - Retorna Date actual en UTC

4. **getLocalDateRange(date)**
   - Parámetro: string en formato 'DD/MM/YYYY'
   - Retorna { start: Date, end: Date }
   - start: inicio del día en zona local convertido a UTC
   - end: fin del día en zona local convertido a UTC
   - Útil para queries de "todos los registros del día X"

5. **isValidDate(input)**
   - Parámetro: string
   - Retorna boolean indicando si es fecha válida

Constante:
- TIMEZONE = 'America/Santiago'

Incluir JSDoc para cada función con ejemplos de uso.
TypeScript con tipos explícitos.
```

#### **Prompt 2.3: Cliente Supabase con telegram_id**

```
Crear archivo src/services/supabase.ts para manejo de cliente Supabase con autenticación personalizada.

Requisitos:

1. **Importar SupabaseClient y createClient**

2. **Variables de entorno**:
   - SUPABASE_URL (requerida)
   - SUPABASE_ANON_KEY (requerida)
   - Validar que existan al iniciar

3. **Función createSupabaseClient(telegramId?: string)**:
   ```typescript
   export async function createSupabaseClient(telegramId?: string): Promise<SupabaseClient> {
     const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
       auth: { persistSession: false }
     });

     if (telegramId) {
       // Ejecutar RPC set_telegram_id
       const { error } = await client.rpc('set_telegram_id', { 
         telegram_id: telegramId 
       });
       
       if (error) {
         logger.error({ error, telegramId }, 'Failed to set telegram_id');
         throw new Error('Authentication failed');
       }
     }

     return client;
   }
   ```

4. **Función getSupabaseForUser(telegramId: string)**:
   - Wrapper que siempre llama createSupabaseClient con telegramId
   - Incluye logging de contexto
   - Manejo de errores

5. **Helper queryWithLogging(client, operation, context?)**:
   - Ejecuta query
   - Logea resultado (éxito/error)
   - Retorna data + error

6. Tipos TypeScript completos
7. Comentarios explicando el flujo de RLS

Exportar: createSupabaseClient, getSupabaseForUser, queryWithLogging
```

#### **Prompt 2.4: Validador Dinámico con Zod**

```
Crear archivo src/services/dynamicValidator.ts para construcción dinámica de esquemas Zod.

Requisitos:

1. **Importar tipos** de src/types/subcategory.ts

2. **Función buildDynamicSchema(fields: FieldDefinition[])**:
   - Recibe array de FieldDefinition
   - Construye objeto Zod dinámicamente
   - Maneja cada tipo de campo:
     * number: z.number() con min/max si existe
     * text: z.string() con regex si existe
     * date: z.string().datetime() o custom parser
     * datetime: z.string().datetime()
     * select: z.enum() con options
     * boolean: z.boolean()
   - Aplica .optional() si is_required = false
   - Retorna z.ZodObject

3. **Función validateRecordData(fields, data)**:
   - Usa buildDynamicSchema
   - Ejecuta schema.safeParse(data)
   - Retorna { success: boolean, data?: any, errors?: ZodError }
   - Formatea errores de forma amigable

4. **Función getFieldsForSubcategory(supabase, subcategoryId)**:
   - Query a subcategory_fields
   - Ordena por display_order
   - Retorna FieldDefinition[]

5. **Helper formatValidationErrors(zodError)**:
   - Convierte ZodError a mensajes legibles en español
   - Retorna string[] con errores

Incluir ejemplos de uso en comentarios JSDoc.
TypeScript estricto con inferencia de tipos Zod.
```

#### **Prompt 2.5: SessionStore para Supabase**

```
Crear archivo src/services/sessionStore.ts con implementación de SessionStore para Telegraf.

Requisitos:

1. **Implementar interfaz SessionStore<SessionData>** de Telegraf

2. **Clase SupabaseSessionStore**:
   ```typescript
   import { SessionStore } from 'telegraf';
   import { SupabaseClient } from '@supabase/supabase-js';
   import logger from '../utils/logger.js';

   export class SupabaseSessionStore implements SessionStore<any> {
     private supabase: SupabaseClient;
     private ttl: number;
     private cleanupInterval: NodeJS.Timeout;

     constructor(supabase: SupabaseClient, ttlMs = 24 * 60 * 60 * 1000) {
       this.supabase = supabase;
       this.ttl = ttlMs;
       this.startCleanupInterval();
     }

     async get(key: string): Promise<any> {
       // Implementar: query sessions donde key = key y expires_at > now
       // Retornar session.session o undefined
     }

     async set(key: string, session: any): Promise<void> {
       // Implementar: upsert en sessions con expires_at = now + ttl
     }

     async delete(key: string): Promise<void> {
       // Implementar: delete de sessions donde key = key
     }

     private startCleanupInterval(): void {
       // Cada 1 hora: delete sessions donde expires_at < now
       // Guardar interval en this.cleanupInterval
     }

     destroy(): void {
       // Limpiar interval
       if (this.cleanupInterval) {
         clearInterval(this.cleanupInterval);
       }
     }
   }
   ```

3. Logging en cada operación (get, set, delete, cleanup)
4. Manejo de errores robusto
5. TypeScript con tipos genéricos

Exportar: SupabaseSessionStore (clase)
```

### 👤 Responsabilidad del Desarrollador

- [ ] **2.1** Verificar instalación de dependencias
  ```bash
  cd telegram-bot
  npm install
  ```

- [ ] **2.2** Configurar .env
  ```env
  BOT_TOKEN=tu_token_aqui
  SUPABASE_URL=https://xxx.supabase.co
  SUPABASE_ANON_KEY=tu_anon_key_aqui
  NODE_ENV=development
  LOG_LEVEL=debug
  ```

- [ ] **2.3** Compilar TypeScript
  ```bash
  npm run lint
  ```
  - Verificar que no haya errores de tipos

- [ ] **2.4** Probar logger
  ```bash
  node -e "import('./dist/utils/logger.js').then(m => m.default.info('Test'))"
  ```

---

## 🛡️ FASE 3: Middleware y Manejo de Errores

### 🤖 Solicitar a la IA

#### **Prompt 3.1: Middleware de Autenticación**

```
Crear archivo src/middleware/auth.ts para autenticación de usuarios.

Requisitos:

1. **Middleware authMiddleware(ctx, next)**:
   - Obtener telegram_id de ctx.from.id
   - Crear cliente Supabase con createSupabaseClient(telegramId)
   - Consultar usuario en tabla 'users' por telegram_id
   - Si existe:
     * Guardar en ctx.state.user (con household info)
     * Guardar cliente en ctx.supabase
   - Si NO existe:
     * Solo guardar cliente en ctx.supabase (para /start)
     * ctx.state.user = undefined
   - Llamar next()
   - Logging de autenticación (success/not registered)

2. **Middleware requireAuth(ctx, next)**:
   - Verificar que ctx.state.user exista
   - Si no existe: ctx.reply('Debes registrarte primero con /start')
   - Si existe: next()

3. **Middleware requireAdmin(ctx, next)**:
   - Verificar que ctx.state.user.role === 'admin'
   - Si no es admin: ctx.reply('Solo administradores pueden usar este comando')
   - Si es admin: next()

4. **Helper getUserHousehold(ctx)**:
   - Retorna información completa del hogar del usuario
   - Query join entre users y households

TypeScript con tipo MyContext importado de types/context.ts
Incluir logging en cada paso
Manejo de errores con try/catch
```

#### **Prompt 3.2: Middleware de Logging**

```
Crear archivo src/middleware/logger.ts para logging de requests.

Requisitos:

1. **Middleware loggerMiddleware(ctx, next)**:
   ```typescript
   export const loggerMiddleware: Middleware<MyContext> = async (ctx, next) => {
     const start = Date.now();
     const telegramId = ctx.from?.id?.toString();
     const username = ctx.from?.username;
     const chatId = ctx.chat?.id;
     const messageText = ctx.message?.text;
     const command = messageText?.split(' ')[0];

     // Crear child logger con contexto
     ctx.log = logger.child({
       telegramId,
       username,
       chatId,
       command
     });

     ctx.log.info({ messageText }, 'Incoming message');

     try {
       await next();
       const duration = Date.now() - start;
       ctx.log.info({ duration }, 'Request completed');
     } catch (error) {
       const duration = Date.now() - start;
       ctx.log.error({ error, duration }, 'Request failed');
       throw error; // Re-throw para que errorHandler lo capture
     }
   };
   ```

2. Tipos correctos para MyContext
3. Comentarios explicando el flujo

Exportar: loggerMiddleware
```

#### **Prompt 3.3: Interceptor de Comandos**

```
Crear archivo src/middleware/commandInterceptor.ts para detectar comandos durante escenas.

Requisitos:

1. **Middleware commandInterceptorMiddleware(ctx, next)**:
   - Detectar si ctx.message.text empieza con '/'
   - Si el usuario está en una escena (ctx.scene.current):
     * Logear cancelación automática
     * Limpiar sesión: ctx.session = {}
     * Salir de escena: await ctx.scene.leave()
     * Mostrar mensaje: "Operación anterior cancelada"
   - Continuar con next() (para que el comando se procese normalmente)

2. **Lista de comandos exentos** (que no cancelan escenas):
   - /cancelar (se maneja aparte)
   - /ayuda (puede mostrarse durante flujo)

3. Logging detallado
4. TypeScript con MyContext

Exportar: commandInterceptorMiddleware
```

#### **Prompt 3.4: Manejo Centralizado de Errores**

```
Crear archivo src/handlers/errorHandler.ts para manejo global de errores.

Requisitos:

1. **Función setupErrorHandlers(bot)**:
   ```typescript
   import { Telegraf } from 'telegraf';
   import { MyContext } from '../types/context.js';
   import logger from '../utils/logger.js';

   export function setupErrorHandlers(bot: Telegraf<MyContext>) {
     // Error handler de Telegraf
     bot.catch((err, ctx) => {
       const error = err as Error;
       
       ctx.log?.error({ 
         error: error.message, 
         stack: error.stack,
         update: ctx.update 
       }, 'Bot error occurred');

       // Responder al usuario de forma amigable
       ctx.reply(
         '😔 Ocurrió un error inesperado. Por favor intenta nuevamente.\n' +
         'Si el problema persiste, usa /ayuda para contactar soporte.'
       ).catch(e => {
         logger.error({ error: e }, 'Failed to send error message');
       });
     });

     // Errores no capturados de Node.js
     process.on('uncaughtException', (error) => {
       logger.fatal({ error }, 'Uncaught exception');
       process.exit(1);
     });

     process.on('unhandledRejection', (reason, promise) => {
       logger.error({ reason, promise }, 'Unhandled promise rejection');
     });

     // Graceful shutdown
     const gracefulShutdown = async (signal: string) => {
       logger.info({ signal }, 'Received shutdown signal');
       
       try {
         await bot.stop(signal);
         logger.info('Bot stopped gracefully');
         process.exit(0);
       } catch (error) {
         logger.error({ error }, 'Error during shutdown');
         process.exit(1);
       }
     };

     process.once('SIGINT', () => gracefulShutdown('SIGINT'));
     process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
   }
   ```

2. Tipos correctos
3. Comentarios explicando cada handler

Exportar: setupErrorHandlers
```

### 👤 Responsabilidad del Desarrollador

- [ ] **3.1** Compilar y verificar tipos
  ```bash
  npm run lint
  ```

- [ ] **3.2** Revisar que todos los middlewares exporten correctamente

---

## 📱 FASE 4: Comandos Básicos

### 🤖 Solicitar a la IA

#### **Prompt 4.1: Comando /start**

```
Crear archivo src/commands/start.ts para el comando inicial.

Flujo completo:

1. **Si el usuario ya está registrado** (ctx.state.user existe):
   - Mostrar menú principal con botones inline:
     * "📝 Registrar datos" → callback: 'menu_register'
     * "📊 Ver últimos registros" → callback: 'menu_latest'
     * "👥 Mi hogar" → callback: 'menu_household'
     * "❓ Ayuda" → callback: 'menu_help'

2. **Si el usuario NO está registrado**:
   - Mostrar mensaje de bienvenida
   - Preguntar si quiere crear hogar o unirse a uno existente
   - Botones inline:
     * "🏠 Crear nuevo hogar" → callback: 'create_household'
     * "🔑 Tengo un código de invitación" → callback: 'join_household'

3. **Callback 'create_household'**:
   - Pedir nombre del hogar
   - Guardar en ctx.session.tempData.householdName
   - Esperar respuesta con scene o listener

4. **Callback 'join_household'**:
   - Pedir código de invitación
   - Guardar en ctx.session.tempData.inviteCode
   - Esperar código

5. **Procesar creación de hogar**:
   - Insertar en 'households' (name, timezone)
   - Insertar usuario en 'users' (household_id, telegram_id, role: 'admin', first_name, last_name)
   - Responder: "¡Bienvenido! Tu hogar '[nombre]' ha sido creado. Usa /invitar para agregar miembros."
   - Mostrar menú principal

6. **Procesar código de invitación**:
   - Validar código en 'household_invites':
     * Existe y no usado
     * No expirado (expires_at > now)
   - Si válido:
     * Actualizar invite (used_by, used_at)
     * Crear usuario con role 'member'
     * Responder: "¡Te has unido al hogar '[nombre]'!"
   - Si inválido:
     * Responder: "Código inválido o expirado. Solicita uno nuevo."

TypeScript con MyContext
Logging en cada paso
Manejo de errores completo
Usar getSupabaseForUser del servicio supabase
```

#### **Prompt 4.2: Comando /cancelar**

```
Crear archivo src/commands/cancel.ts para cancelar operaciones.

Requisitos:

1. **Comando handler**:
   ```typescript
   export async function cancelCommand(ctx: MyContext) {
     if (ctx.scene.current) {
       ctx.log.info({ scene: ctx.scene.current }, 'User cancelled scene');
       await ctx.scene.leave();
     }

     // Limpiar sesión
     ctx.session = {};

     await ctx.reply(
       '❌ Operación cancelada.\n\n' +
       '¿En qué puedo ayudarte?',
       Markup.inlineKeyboard([
         [Markup.button.callback('📝 Registrar', 'menu_register')],
         [Markup.button.callback('📊 Ver registros', 'menu_latest')],
         [Markup.button.callback('❓ Ayuda', 'menu_help')]
       ])
     );
   }
   ```

2. Importar Markup de 'telegraf'
3. TypeScript con tipos correctos
4. Comentarios explicando uso

Exportar: cancelCommand
```

#### **Prompt 4.3: Comando /ayuda**

```
Crear archivo src/commands/help.ts con información de comandos.

Requisitos:

1. **Mensaje de ayuda completo**:
   ```
   📖 *Comandos Disponibles*

   🏠 *General*
   /start - Iniciar o ver menú principal
   /mihogar - Ver información de tu hogar
   /ayuda - Mostrar esta ayuda

   📝 *Registro de Datos*
   /registrar - Registrar datos de salud
   /ultimos - Ver últimos 10 registros

   👥 *Gestión de Hogar*
   /invitar - Generar código de invitación (solo admins)

   ⚙️ *Utilidades*
   /cancelar - Cancelar operación actual

   ℹ️ *Consejos*
   • Puedes cancelar cualquier operación con /cancelar
   • Los datos se guardan automáticamente
   • Todos los miembros del hogar pueden ver los registros compartidos

   ¿Necesitas más ayuda? Escribe a @soporte_lacasita
   ```

2. Usar parseMode: 'Markdown'
3. Botón inline para volver al menú
4. TypeScript con MyContext

Exportar: helpCommand
```

#### **Prompt 4.4: Comando /mihogar**

```
Crear archivo src/commands/myHousehold.ts para ver información del hogar.

Requisitos:

1. **Verificar autenticación** con requireAuth middleware

2. **Obtener información**:
   - Household name, created_at
   - Lista de miembros (con roles)
   - Total de registros del hogar
   - Último registro creado

3. **Formatear mensaje**:
   ```
   🏠 *[Nombre del Hogar]*

   👥 *Miembros* (3)
   • Juan Pérez (Admin) ⭐
   • María González (Miembro)
   • Pedro Sánchez (Miembro)

   📊 *Estadísticas*
   • Total de registros: 45
   • Último registro: 13/02/2026 14:30

   🔗 Usa /invitar para agregar más miembros
   ```

4. Usar formatDateForUser para fechas
5. Botones inline: "Invitar", "Ver registros", "Volver"
6. TypeScript con MyContext

Exportar: myHouseholdCommand
```

### 👤 Responsabilidad del Desarrollador

- [ ] **4.1** Compilar comandos
  ```bash
  npm run build
  ```

- [ ] **4.2** Crear archivo bot.ts básico para probar:
  ```typescript
  import { Telegraf } from 'telegraf';
  import { startCommand } from './commands/start.js';
  // ... imports

  const bot = new Telegraf(process.env.BOT_TOKEN!);

  bot.start(startCommand);
  bot.command('ayuda', helpCommand);
  bot.command('cancelar', cancelCommand);

  bot.launch();
  ```

- [ ] **4.3** Probar comandos básicos
  - Iniciar bot: `npm run dev`
  - Enviar `/start` en Telegram
  - Verificar respuesta
  - Probar flujo de creación de hogar

---

## 🩺 FASE 5: Flujo de Registro (Presión Arterial)

### 🤖 Solicitar a la IA

#### **Prompt 5.1: Parser de Presión Arterial**

```
Crear archivo src/utils/parsers/presion.ts para parsear formato "120/80".

Requisitos:

1. **Función parsePresionInput(input: string)**:
   - Regex para detectar formato: /^(\d{2,3})\/(\d{2,3})$/
   - Extraer sistólica y diastólica
   - Validar rangos:
     * Sistólica: 60-250
     * Diastólica: 40-150
   - Retornar: { sistolica: number, diastolica: number } | null

2. **Función isPresionFormat(input: string)**:
   - Retorna boolean si input coincide con formato

3. **Ejemplos en JSDoc**:
   - "120/80" → { sistolica: 120, diastolica: 80 }
   - "90/60" → { sistolica: 90, diastolica: 60 }
   - "300/40" → null (fuera de rango)
   - "120-80" → null (formato incorrecto)

TypeScript con tipos explícitos
Unit tests inline en comentarios

Exportar: parsePresionInput, isPresionFormat
```

#### **Prompt 5.2: Flujo Completo de Registro de Presión**

```
Crear archivo src/flows/presionFlow.ts con el flujo completo de registro de presión arterial usando Telegraf Scenes.

Requisitos:

1. **Importaciones necesarias**:
   - Scenes, Markup de 'telegraf'
   - MyContext de types/context.ts
   - Servicios: supabase, dynamicValidator
   - Utils: parsePresionInput, formatDateForUser, nowUTC
   - Logger

2. **Scene: 'PRESION_FLOW'**:
   
   **Step 0: Entrada al flujo**
   - Mensaje: "📊 Registro de Presión Arterial\n\nPuedes ingresar:"
   - Opciones con botones inline:
     * "Formato rápido (ej: 120/80)" → callback: 'presion_quick'
     * "Paso a paso" → callback: 'presion_step'
     * "Cancelar" → volver al menú

   **Step 1a: Formato rápido**
   - Pedir: "Ingresa tu presión (ejemplo: 120/80):"
   - Esperar input
   - Validar con parsePresionInput
   - Si válido:
     * Guardar en session.tempData.presion
     * Ir a Step 2 (pulso)
   - Si inválido:
     * Mostrar error con ejemplos
     * Reintentar

   **Step 1b: Paso a paso - Sistólica**
   - Pedir: "Presión sistólica (máxima): 60-250 mmHg"
   - Validar número en rango
   - Guardar en session.tempData.presion.sistolica
   - Siguiente: Diastólica

   **Step 1c: Paso a paso - Diastólica**
   - Pedir: "Presión diastólica (mínima): 40-150 mmHg"
   - Validar número en rango
   - Guardar en session.tempData.presion.diastolica
   - Siguiente: Pulso

   **Step 2: Pulso (opcional)**
   - Pedir: "¿Pulso? (40-200 bpm, o /omitir)"
   - Botones: "Omitir" → callback: 'skip_pulso'
   - Si ingresa número:
     * Validar 40-200
     * Guardar en session.tempData.presion.pulso
   - Siguiente: En ayunas

   **Step 3: En ayunas (opcional)**
   - Pedir: "¿Medición en ayunas?"
   - Botones inline:
     * "Sí" → true
     * "No" → false
     * "Omitir" → null
   - Guardar en session.tempData.presion.en_ayunas
   - Siguiente: Brazo

   **Step 4: Brazo (opcional)**
   - Pedir: "¿En qué brazo te tomaste la presión?"
   - Botones:
     * "Izquierdo"
     * "Derecho"
     * "Omitir"
   - Guardar en session.tempData.presion.brazo
   - Siguiente: Confirmación

   **Step 5: Confirmación**
   - Mostrar resumen:
     ```
     📋 Resumen del Registro

     🩸 Presión: 120/80 mmHg
     💓 Pulso: 72 bpm
     🍽️ En ayunas: Sí
     💪 Brazo: Izquierdo

     ¿Confirmas el registro?
     ```
   - Botones:
     * "✅ Confirmar" → guardar
     * "❌ Cancelar" → limpiar y salir

   **Step 6: Guardar en BD**
   - Obtener subcategory_id de 'presion-arterial'
   - Construir objeto data con validación dinámica
   - Insertar en 'records':
     ```typescript
     {
       household_id: ctx.state.user.household_id,
       user_id: ctx.state.user.id,
       subcategory_id: '[presion_id]',
       data: {
         sistolica: 120,
         diastolica: 80,
         pulso: 72,
         en_ayunas: true,
         brazo: 'izquierdo'
       },
       recorded_at: nowUTC()
     }
     ```
   - Responder: "✅ Presión registrada correctamente"
   - Salir de escena
   - Mostrar menú principal

3. **Manejo de errores**:
   - Try/catch en cada step
   - Logging detallado
   - Mensajes de error amigables

4. **Validación dinámica**:
   - Usar getFieldsForSubcategory + buildDynamicSchema
   - Validar antes de guardar
   - Mostrar errores de validación

TypeScript completo con tipos de Scene
Comentarios explicando cada paso
Usar await/async correctamente
```

#### **Prompt 5.3: Comando /registrar**

```
Crear archivo src/commands/register.ts para iniciar flujo de registro.

Requisitos:

1. **Verificar autenticación** con requireAuth

2. **Obtener subcategorías activas** de Salud:
   - Query: subcategories WHERE category.slug = 'salud' AND is_active = true
   - Ordenar alfabéticamente

3. **Mostrar opciones con botones inline**:
   ```
   📝 ¿Qué deseas registrar?

   [Botón: 💉 Presión Arterial] callback: 'register_presion-arterial'
   [Botón: 🍬 Glucosa] callback: 'register_glucosa'
   [Botón: ⚖️ Peso y IMC] callback: 'register_peso-imc'
   ... (dinámicamente según subcategorías activas)
   [Botón: ❌ Cancelar]
   ```

4. **Callback handlers**:
   - 'register_presion-arterial' → ctx.scene.enter('PRESION_FLOW')
   - Otros → "Próximamente disponible" (placeholder)

5. Logging de selección
6. TypeScript con MyContext

Exportar: registerCommand, registerCallbacks
```

### 👤 Responsabilidad del Desarrollador

- [ ] **5.1** Integrar scene en bot.ts:
  ```typescript
  import { Stage } from 'telegraf';
  import { presionFlow } from './flows/presionFlow.js';

  const stage = new Stage([presionFlow]);
  bot.use(session());
  bot.use(stage.middleware());
  ```

- [ ] **5.2** Probar flujo completo:
  - `/registrar`
  - Seleccionar "Presión Arterial"
  - Probar formato rápido: "120/80"
  - Completar campos opcionales
  - Confirmar y guardar

- [ ] **5.3** Verificar en Supabase:
  - Abrir Table Editor > records
  - Confirmar que se guardó el registro
  - Verificar que data JSONB contiene los campos correctos
  - Verificar recorded_at en UTC

- [ ] **5.4** Probar validaciones:
  - Ingresar "300/80" (fuera de rango)
  - Verificar mensaje de error
  - Ingresar "120-80" (formato incorrecto)
  - Verificar que detecta el error

---

## 📊 FASE 6: Comandos Adicionales MVP

### 🤖 Solicitar a la IA

#### **Prompt 6.1: Comando /ultimos**

```
Crear archivo src/commands/latest.ts para ver últimos registros.

Requisitos:

1. **Verificar autenticación** con requireAuth

2. **Query últimos 10 registros del hogar**:
   - JOIN: records + subcategories + users
   - Filtrar por household_id
   - Ordenar por recorded_at DESC
   - Limit 10

3. **Formatear mensaje**:
   ```
   📊 *Últimos Registros*

   💉 *Presión Arterial* - Juan
   📅 13/02/2026 14:30
   🩸 120/80 mmHg | 💓 72 bpm

   🍬 *Glucosa* - María
   📅 13/02/2026 08:15
   📊 95 mg/dL (ayunas)

   ⚖️ *Peso* - Juan
   📅 12/02/2026 07:00
   ⚖️ 75.5 kg | 📏 IMC: 24.8

   ... (hasta 10)
   ```

4. **Si no hay registros**:
   - Mensaje: "No hay registros aún. Usa /registrar para crear uno."

5. **Botones inline**:
   - "Registrar nuevo" → /registrar
   - "Filtrar por categoría" → (futuro)
   - "Volver al menú"

6. Usar formatDateForUser para fechas
7. Usar íconos de subcategorías
8. Mostrar nombre del usuario que registró
9. TypeScript con MyContext

Exportar: latestCommand
```

#### **Prompt 6.2: Comando /invitar**

```
Crear archivo src/commands/invite.ts para generar códigos de invitación.

Requisitos:

1. **Verificar autenticación** y **rol admin**:
   - Usar requireAuth + requireAdmin middlewares

2. **Generar código único**:
   - 6 caracteres alfanuméricos (mayúsculas)
   - Verificar que no exista en BD
   - Función: generateInviteCode()

3. **Insertar en household_invites**:
   ```typescript
   {
     household_id: ctx.state.user.household_id,
     invite_code: 'ABC123',
     created_by: ctx.state.user.id,
     expires_at: nowUTC() + 7 días
   }
   ```

4. **Responder con código**:
   ```
   🔑 *Código de Invitación Generado*

   `ABC123`

   📋 Comparte este código con quien quieras invitar a tu hogar.

   ⏰ *Válido por 7 días*
   ✅ *Uso único*

   La persona debe:
   1. Iniciar conversación con @LaCasitaBot
   2. Usar /start
   3. Seleccionar "Tengo un código"
   4. Ingresar: ABC123

   💡 Puedes generar más códigos cuando quieras.
   ```

5. Usar parseMode: 'Markdown'
6. Código en formato monospace
7. Logging de creación
8. TypeScript con MyContext

Exportar: inviteCommand
```

### 👤 Responsabilidad del Desarrollador

- [ ] **6.1** Integrar comandos en bot.ts:
  ```typescript
  bot.command('ultimos', latestCommand);
  bot.command('invitar', inviteCommand);
  ```

- [ ] **6.2** Probar /ultimos:
  - Registrar 2-3 presiones
  - Ejecutar /ultimos
  - Verificar formato y fechas

- [ ] **6.3** Probar /invitar:
  - Usuario admin ejecuta /invitar
  - Copiar código generado
  - Abrir nuevo chat con bot (otro teléfono/cuenta)
  - /start → "Tengo código" → pegar código
  - Verificar que se une al hogar

- [ ] **6.4** Probar permisos:
  - Usuario member intenta /invitar
  - Verificar mensaje de error

---

## 🧪 FASE 7: Testing y Ajustes

### 👤 Responsabilidad del Desarrollador

- [ ] **7.1** Testing de flujos completos:
  - [ ] Crear hogar nuevo
  - [ ] Generar invitación
  - [ ] Unirse con código
  - [ ] Registrar presión (formato rápido)
  - [ ] Registrar presión (paso a paso)
  - [ ] Ver últimos registros
  - [ ] Cancelar operación con /cancelar
  - [ ] Ver información del hogar

- [ ] **7.2** Testing de validaciones:
  - [ ] Presión fuera de rango
  - [ ] Formato incorrecto "120-80"
  - [ ] Pulso fuera de rango
  - [ ] Código de invitación inválido
  - [ ] Código expirado (cambiar manualmente expires_at)

- [ ] **7.3** Testing de RLS:
  - [ ] Usuario de hogar A no ve registros de hogar B
  - [ ] Usuario de hogar A no puede invitar a hogar B
  - [ ] Verificar aislamiento completo

- [ ] **7.4** Testing de sesiones:
  - [ ] Iniciar flujo de registro
  - [ ] Reiniciar bot (Ctrl+C y npm run dev)
  - [ ] Verificar que la sesión persiste
  - [ ] Continuar flujo desde donde quedó

- [ ] **7.5** Revisar logs:
  - [ ] Verificar que cada operación tenga logs
  - [ ] Confirmar contexto (telegram_id, command)
  - [ ] Revisar errores capturados

- [ ] **7.6** Ajustes de UX:
  - [ ] Textos claros y concisos
  - [ ] Emojis apropiados
  - [ ] Botones bien etiquetados
  - [ ] Mensajes de error amigables

- [ ] **7.7** Optimizaciones:
  - [ ] Reducir queries duplicadas
  - [ ] Cachear subcategorías activas
  - [ ] Índices en BD adecuados

---

## 🚀 FASE 8: Despliegue

### 👤 Responsabilidad del Desarrollador

- [ ] **8.1** Preparar para producción:
  - [ ] Cambiar NODE_ENV=production en .env
  - [ ] Cambiar LOG_LEVEL=info
  - [ ] Compilar: `npm run build`
  - [ ] Probar build: `npm start`

- [ ] **8.2** Elegir plataforma de hosting:
  - **Opción A: Railway**
    - Crear cuenta en [Railway.app](https://railway.app)
    - Conectar repositorio GitHub
    - Configurar variables de entorno
    - Deploy automático en cada push
  
  - **Opción B: Render**
    - Crear cuenta en [Render.com](https://render.com)
    - New > Web Service
    - Conectar repo
    - Build command: `npm run build`
    - Start command: `npm start`
  
  - **Opción C: VPS (DigitalOcean, Linode)**
    - Instalar Node.js 22
    - Clonar repositorio
    - Instalar dependencias
    - Configurar PM2 para keep-alive
    - Configurar nginx como reverse proxy (opcional)

- [ ] **8.3** Configurar variables de entorno en plataforma:
  ```
  BOT_TOKEN=producción_token
  SUPABASE_URL=https://xxx.supabase.co
  SUPABASE_ANON_KEY=producción_key
  NODE_ENV=production
  LOG_LEVEL=info
  ```

- [ ] **8.4** Configurar webhook (producción):
  ```typescript
  if (process.env.NODE_ENV === 'production') {
    bot.launch({
      webhook: {
        domain: process.env.WEBHOOK_DOMAIN,
        port: Number(process.env.PORT) || 3000
      }
    });
  } else {
    bot.launch(); // Polling para desarrollo
  }
  ```

- [ ] **8.5** Configurar monitoring:
  - [ ] Logs centralizados (Papertrail, Logtail)
  - [ ] Uptime monitoring (UptimeRobot)
  - [ ] Error tracking (Sentry - opcional)

- [ ] **8.6** Backup de BD:
  - [ ] Configurar backups automáticos en Supabase (Settings > Database > Backups)
  - [ ] Exportar migrations y seed.sql a repositorio

- [ ] **8.7** Documentación final:
  - [ ] Actualizar README.md con instrucciones de deploy
  - [ ] Documentar variables de entorno
  - [ ] Crear CHANGELOG.md
  - [ ] Agregar badge de estado en README

- [ ] **8.8** Testing en producción:
  - [ ] Crear hogar de prueba
  - [ ] Ejecutar todos los flujos
  - [ ] Verificar logs en plataforma
  - [ ] Monitorear errores primeras 24h

---

## 📝 Checklist Final MVP

### Funcionalidades Core
- [x] Autenticación con telegram_id + RLS
- [x] Creación de hogares
- [x] Sistema de invitaciones
- [x] Registro de presión arterial (formato rápido y paso a paso)
- [x] Validación dinámica con Zod
- [x] Visualización de últimos registros
- [x] Sesiones persistentes
- [x] Logging con contexto
- [x] Manejo de fechas UTC/Chile
- [x] Manejo de errores robusto

### Seguridad
- [x] RLS activo en todas las tablas
- [x] Políticas probadas y validadas
- [x] Aislamiento entre hogares
- [x] Validación de inputs
- [x] Sanitización de datos

### Performance
- [x] Índices en BD optimizados
- [x] Queries eficientes
- [x] Sesiones con TTL y limpieza
- [x] Logging sin overhead

### UX
- [x] Mensajes claros y concisos
- [x] Botones inline intuitivos
- [x] Emojis apropiados
- [x] Manejo de errores amigable
- [x] Comando /cancelar funcional

### DevOps
- [x] Código en repositorio
- [x] Variables de entorno configuradas
- [x] Build exitoso
- [x] Deploy en producción
- [x] Monitoring activo

---

## 🎯 Próximos Pasos (Post-MVP)

### Fase 2: Expansión Salud (Semanas 3-6)
- [ ] Activar subcategoría Glucosa
- [ ] Activar subcategoría Peso/IMC (con cálculo automático)
- [ ] Activar subcategoría Medicamentos
- [ ] Activar subcategoría Citas Médicas (con recordatorios)
- [ ] Implementar comando `/estadisticas` con gráficos
- [ ] Exportación de datos (CSV/PDF)

### Fase 3: Finanzas (Semanas 7-12)
- [ ] Activar categoría Finanzas
- [ ] Gastos compartidos con división automática
- [ ] Sistema de balances
- [ ] Tracking de deudas
- [ ] Comando `/balance`
- [ ] Comando `/liquidar`

### Fase 4: Dashboard Web (Futuro)
- [ ] Next.js + Supabase
- [ ] Gráficos interactivos
- [ ] Sincronización en tiempo real
- [ ] PWA para móvil

---

**Última actualización**: 13 de Febrero, 2026  
**Versión del documento**: 1.0  
**Autor**: LaCasita Team