/**
 * SearchParams: parámetros de query usados por helpers HTTP.
 * - Valores admitidos: string | number | boolean | null | undefined
 * - Se omiten entries con `undefined` o `null` antes de serializar.
 */
export type SearchParams = Record<
  string,
  string | number | boolean | null | undefined
>;