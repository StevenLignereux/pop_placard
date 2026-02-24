import { describe, it, expect } from 'vitest';
import { formatStockDisplay, cn } from './utils';

describe('formatStockDisplay', () => {
  it('formats stock correctly when no boxes per carton defined', () => {
    expect(formatStockDisplay(10, 0, 'boîte')).toBe('10 boîtes');
    expect(formatStockDisplay(1, 0, 'boîte')).toBe('1 boîte');
  });

  it('formats stock correctly when boxes per carton is 1', () => {
    expect(formatStockDisplay(10, 1, 'boîte')).toBe('10 boîtes');
  });

  it('formats stock correctly with cartons and loose units', () => {
    // 10 items, 4 per carton -> 2 cartons + 2 items
    expect(formatStockDisplay(10, 4, 'boîte')).toBe('2 cartons et 2 boîtes (10 boîtes au total)');
  });

  it('formats stock correctly with only cartons', () => {
    // 8 items, 4 per carton -> 2 cartons
    expect(formatStockDisplay(8, 4, 'boîte')).toBe('2 cartons (8 boîtes au total)');
  });

  it('formats stock correctly with only loose units', () => {
    // 3 items, 4 per carton -> 3 items
    expect(formatStockDisplay(3, 4, 'boîte')).toBe('3 boîtes (3 boîtes au total)');
  });

  it('formats zero stock correctly', () => {
    expect(formatStockDisplay(0, 4, 'boîte')).toBe('0 boîte (0 boîte au total)');
  });

  it('handles pluralization correctly', () => {
    expect(formatStockDisplay(5, 2, 'boîte')).toBe('2 cartons et 1 boîte (5 boîtes au total)');
    expect(formatStockDisplay(4, 2, 'boîte')).toBe('2 cartons (4 boîtes au total)');
  });
});

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3');
  });

  it('merges tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'p-4')).toBe('p-4');
  });
});
