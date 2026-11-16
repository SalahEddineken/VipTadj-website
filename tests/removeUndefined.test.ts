import { describe, it, expect } from 'vitest';
import { removeUndefined } from '@/lib/data-provider/firestore-provider';

describe('removeUndefined utility for Firestore', () => {
  it('removes undefined fields from flat objects', () => {
    const input = {
      name: 'Salim',
      phone: '0658501459',
      secondaryPhone: undefined,
      notes: undefined,
    };
    const cleaned = removeUndefined(input);
    expect(cleaned).toEqual({
      name: 'Salim',
      phone: '0658501459',
    });
    expect('secondaryPhone' in cleaned).toBe(false);
    expect('notes' in cleaned).toBe(false);
  });

  it('removes undefined fields recursively from nested objects and arrays', () => {
    const input = {
      customer: {
        fullName: 'Salah eddine',
        secondaryPhone: undefined,
        address: 'Rue 1',
      },
      items: [
        { productId: 'p1', selectedColor: undefined, quantity: 2 },
        { productId: 'p2', selectedColor: 'Noir', quantity: 1 },
      ],
      notes: undefined,
    };
    const cleaned = removeUndefined(input);
    expect(cleaned).toEqual({
      customer: {
        fullName: 'Salah eddine',
        address: 'Rue 1',
      },
      items: [
        { productId: 'p1', quantity: 2 },
        { productId: 'p2', selectedColor: 'Noir', quantity: 1 },
      ],
    });
    expect('secondaryPhone' in cleaned.customer).toBe(false);
    expect('selectedColor' in cleaned.items[0]).toBe(false);
  });

  it('preserves null, 0, false, empty strings, and Date objects', () => {
    const date = new Date();
    const input = {
      discount: 0,
      inStock: false,
      emptyString: '',
      nullValue: null,
      date,
      badField: undefined,
    };
    const cleaned = removeUndefined(input);
    expect(cleaned).toEqual({
      discount: 0,
      inStock: false,
      emptyString: '',
      nullValue: null,
      date,
    });
    expect('badField' in cleaned).toBe(false);
  });
});
