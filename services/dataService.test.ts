import { describe, it, expect } from 'vitest';
import { dataService } from './dataService';

describe('DataService Logic', () => {
  it('should always include MOSQUERA in plantIds even if empty', () => {
    // Fix: Removed unused @ts-expect-error and cast to any to access private method for testing
    const result = (dataService as any).cleanPlantIds([]);
    expect(result).toContain('MOSQUERA');
  });

  it('should normalize plant IDs to uppercase and trim spaces', () => {
    // Fix: Removed unused @ts-expect-error and cast to any to access private method for testing
    const result = (dataService as any).cleanPlantIds([' plt-cali ', 'mosquera']);
    expect(result).toEqual(['PLT-CALI', 'MOSQUERA']);
  });

  it('should handle undefined or null plantIds gracefully', () => {
    // Fix: Removed unused @ts-expect-error and cast to any to access private method for testing
    const result = (dataService as any).cleanPlantIds(undefined);
    expect(result).toEqual(['MOSQUERA']);
  });
});
