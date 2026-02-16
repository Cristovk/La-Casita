export type FieldType = 'number' | 'text' | 'date' | 'datetime' | 'select' | 'boolean';

export interface ValidationRules {
  min?: number;
  max?: number;
  regex?: string;
  options?: string[];
}

export interface FieldDefinition {
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

export interface SubcategorySchema {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  ownership_type: 'personal' | 'shared' | 'both';
  fields: FieldDefinition[];
  is_active: boolean;
}

export interface RecordData {
  id: string;
  household_id: string;
  user_id: string;
  subcategory_id: string;
  data: Record<string, any>;
  recorded_at: string;
  notes?: string;
  created_at: string;
}
