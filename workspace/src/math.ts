export type DivisionResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

/**
 * Pure addition function
 */
export function add(a: number, b: number): number {
  return a + b;
}

/**
 * Safe division that returns an object describing success or error instead of throwing.
 */
export function safeDivide(a: number, b: number): DivisionResult {
  if (b === 0) {
    return { ok: false, error: "division by zero" };
  }
  return { ok: true, value: a / b };
}
