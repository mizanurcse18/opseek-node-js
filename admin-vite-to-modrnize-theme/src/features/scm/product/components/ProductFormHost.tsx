import { ProductForm, type ProductFormProps } from './ProductForm';
import { getProductFormDefaults, type ProductFormVariant } from './productForm.shared';

type ProductFormHostProps = ProductFormProps & {
  /** `modal` = table + ProductModal; `tree` = tree panel (category locked, company from toolbar). */
  variant: ProductFormVariant;
};

/**
 * Shared entry point for the product form on both ProductPage views.
 * All product fields, validation, save, images, and ledgers live in ProductForm.tsx only.
 */
export function ProductFormHost({ variant, formId, ...props }: ProductFormHostProps) {
  const defaults = getProductFormDefaults(variant);
  return (
    <ProductForm
      {...defaults}
      {...props}
      formId={formId ?? defaults.formId}
    />
  );
}
