-- ============================================
-- CATEGORÍAS PRINCIPALES
-- ============================================
-- IDs fijos para referencia
-- Salud: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
-- Finanzas: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
-- Hogar: cccccccc-cccc-cccc-cccc-cccccccccccc
-- Educación: dddddddd-dddd-dddd-dddd-dddddddddddd
-- Vehículos: eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee

INSERT INTO categories (id, household_id, name, slug, icon, is_active) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, 'Salud', 'salud', '🏥', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, 'Finanzas', 'finanzas', '💰', false),
('cccccccc-cccc-cccc-cccc-cccccccccccc', NULL, 'Hogar', 'hogar', '🏠', false),
('dddddddd-dddd-dddd-dddd-dddddddddddd', NULL, 'Educación', 'educacion', '🎓', false),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NULL, 'Vehículos', 'vehiculos', '🚗', false)
ON CONFLICT DO NOTHING;

-- ============================================
-- SUBCATEGORÍAS - SALUD (ACTIVAS)
-- ============================================
-- Presión: a1111111-1111-1111-1111-111111111111
INSERT INTO subcategories (id, category_id, name, slug, icon, ownership_type, is_active) VALUES
('a1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Presión Arterial', 'presion-arterial', '💉', 'personal', true),
('a2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Glucosa', 'glucosa', '🍬', 'personal', true),
('a3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Peso y IMC', 'peso-imc', '⚖️', 'personal', true),
('a4444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Medicamentos', 'medicamentos', '💊', 'personal', true),
('a5555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Citas Médicas', 'citas-medicas', '🩺', 'personal', true),
('a6666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Síntomas', 'sintomas', '🤒', 'personal', true),
('a7777777-7777-7777-7777-777777777777', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Exámenes', 'examenes', '🧪', 'personal', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- FIELDS - PRESIÓN ARTERIAL
-- ============================================
INSERT INTO subcategory_fields (subcategory_id, field_name, field_type, is_required, validation_rules, unit, display_order) VALUES
('a1111111-1111-1111-1111-111111111111', 'sistolica', 'number', true, '{"min": 60, "max": 250}'::jsonb, 'mmHg', 1),
('a1111111-1111-1111-1111-111111111111', 'diastolica', 'number', true, '{"min": 40, "max": 150}'::jsonb, 'mmHg', 2),
('a1111111-1111-1111-1111-111111111111', 'pulso', 'number', false, '{"min": 40, "max": 200}'::jsonb, 'bpm', 3),
('a1111111-1111-1111-1111-111111111111', 'en_ayunas', 'boolean', false, NULL, NULL, 4),
('a1111111-1111-1111-1111-111111111111', 'brazo', 'select', false, '{"options": ["izquierdo", "derecho"]}'::jsonb, NULL, 5);

-- ============================================
-- FIELDS - GLUCOSA
-- ============================================
INSERT INTO subcategory_fields (subcategory_id, field_name, field_type, is_required, validation_rules, unit, display_order) VALUES
('a2222222-2222-2222-2222-222222222222', 'nivel', 'number', true, '{"min": 40, "max": 500}'::jsonb, 'mg/dL', 1),
('a2222222-2222-2222-2222-222222222222', 'momento', 'select', true, '{"options": ["ayunas", "preprandial", "postprandial", "nocturno"]}'::jsonb, NULL, 2),
('a2222222-2222-2222-2222-222222222222', 'tipo_comida', 'select', false, '{"options": ["desayuno", "almuerzo", "cena", "snack"]}'::jsonb, NULL, 3);

-- ============================================
-- TAGS GLOBALES
-- ============================================
INSERT INTO tags (household_id, name, color) VALUES
-- Presión
(NULL, 'mañana', '#FFD700'),
(NULL, 'tarde', '#FFA500'),
(NULL, 'noche', '#191970'),
(NULL, 'medicado', '#32CD32'),
(NULL, 'ejercicio', '#FF4500'),
(NULL, 'estrés', '#FF0000'),
-- Glucosa
(NULL, 'normal', '#008000'),
(NULL, 'alto', '#FF0000'),
(NULL, 'bajo', '#FFFF00'),
(NULL, 'hipoglucemia', '#8B0000'),
-- General
(NULL, 'urgente', '#FF0000'),
(NULL, 'control', '#0000FF')
ON CONFLICT DO NOTHING;
