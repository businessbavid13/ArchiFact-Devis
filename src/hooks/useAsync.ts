import { useCallback, useEffect, useRef, useState } from 'react';

interface AsyncState<T> {
  loading: boolean;
  error: Error | null;
  data: T | null;
}

interface AsyncActions<T> {
  execute: (asyncFn: () => Promise<T>) => Promise<void>;
  reset: () => void;
  setData: (data: T) => void;
}

/**
 * Hook for managing asynchronous operations with loading and error states
 * Prepares components for backend API calls
 */
export function useAsync<T = null>(): [AsyncState<T>, AsyncActions<T>] {
  const [state, setState] = useState<AsyncState<T>>({
    loading: false,
    error: null,
    data: null,
  });

  const mountedRef = useRef<boolean>(true);

  // Cleanup on unmount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (asyncFn: () => Promise<T>) => {
      if (!mountedRef.current) return;

      setState({ loading: true, error: null, data: null });

      try {
        const result = await asyncFn();
        if (mountedRef.current) {
          setState({ loading: false, error: null, data: result });
        }
      } catch (error) {
        if (mountedRef.current) {
          setState({
            loading: false,
            error: error instanceof Error ? error : new Error(String(error)),
            data: null,
          });
        }
      }
    },
    [mountedRef]
  );

  const reset = useCallback(() => {
    if (mountedRef.current) {
      setState({ loading: false, error: null, data: null });
    }
  }, [mountedRef]);

  const setData = useCallback(
    (data: T) => {
      if (mountedRef.current) {
        setState({ loading: false, error: null, data });
      }
    },
    [mountedRef]
  );

  return [
    { loading: state.loading, error: state.error, data: state.data },
    { execute, reset, setData },
  ];
}
