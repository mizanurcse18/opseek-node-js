/**
 * Extracts unique, non-empty values from an array of objects based on a property key.
 * Used to power autocomplete suggestions.
 */
export const getUniqueValues = <T, K extends keyof T>(
  data: T[],
  key: K
): string[] => {
  if (!Array.isArray(data)) return [];
  
  const values = data
    .map(item => String(item[key] || '').trim())
    .filter(val => val.length > 0);
    
  return Array.from(new Set(values));
};

/**
 * Common REST/API defaults for action types
 */
export const ACTION_TYPE_DEFAULTS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

/**
 * Common module names if applicable (optional seeding)
 */
export const COMMON_MODULES = ['auth', 'security', 'master', 'transaction', 'report'];
