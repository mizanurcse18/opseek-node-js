import type { ProductFormProps } from './ProductForm';

/** Form id used by table view modal (header submit button targets this). */
export const PRODUCT_FORM_ID_MODAL = 'product-form';

/** Form id used by tree view panel (external save button targets this). */
export const PRODUCT_FORM_ID_TREE = 'product-tree-product-form';

export type ProductFormVariant = 'modal' | 'tree';

/** Single source of truth for per-page ProductForm behavior. */
export function getProductFormDefaults(variant: ProductFormVariant): Pick<
  ProductFormProps,
  'formId' | 'readonlyCategory' | 'showCompanySelector' | 'compactLayout'
> {
  if (variant === 'tree') {
    return {
      formId: PRODUCT_FORM_ID_TREE,
      readonlyCategory: true,
      showCompanySelector: false,
      /** Stack fields + media below lg; side-by-side form + media at lg+ (tree detail panel). */
      compactLayout: true,
    };
  }
  return {
    formId: PRODUCT_FORM_ID_MODAL,
    readonlyCategory: false,
    showCompanySelector: true,
    compactLayout: false,
  };
}
