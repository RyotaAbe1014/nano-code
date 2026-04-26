import { describe, it, expect } from 'vitest';
import { add, divide } from '../src/math';

describe('math utilities', () => {
  it('adds two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('divides two numbers', () => {
    expect(divide(6, 3)).toEqual({ ok: true, value: 2 });
  });

  it('returns error on division by zero', () => {
    expect(divide(1, 0)).toEqual({ ok: false, error: 'division by zero' });
  });
});
