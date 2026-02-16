import { z } from 'zod';
import type { FieldDefinition } from '../types/subcategory.js';

export function buildDynamicSchema(fields: FieldDefinition[]) {
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

export function validateRecordData(fields: FieldDefinition[], data: any) {
  const schema = buildDynamicSchema(fields);
  return schema.safeParse(data);
}

export function formatValidationErrors(error: z.ZodError): string[] {
  // @ts-ignore - ZodError should have errors, but TS is complaining
  return error.errors.map((err: any) => {
    return `${err.path.join('.')}: ${err.message}`;
  });
}
