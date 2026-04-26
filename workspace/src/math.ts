export type DivideResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

export function add(a: number, b: number): number {
  return a + b;
}

export function divide(a: number, b: number): DivideResult {
  if (b === 0) {
    return { ok: false, error: 'division by zero' };
  }
  return { ok: true, value: a / b };
}
