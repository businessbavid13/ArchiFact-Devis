import { useState, useEffect } from 'react';

/**
 * Generic hook for state persisted to localStorage.
 * Used as the foundation for all data hooks (Repository Pattern - local stage).
 */
export function usePersistedState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

/**
 * Variant for numeric values stored as strings.
 */
export function usePersistedNumber(key: string, initialValue: number): [number, React.Dispatch<React.SetStateAction<number>>] {
  const [value, setValue] = useState<number>(() => {
    const saved = localStorage.getItem(key);
    return saved !== null ? parseInt(saved, 10) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, value.toString());
  }, [key, value]);

  return [value, setValue];
}
