import { CompanySettings } from '../types';
import { usePersistedState } from './usePersistedState';
import { INITIAL_SETTINGS } from '../data/mockData';

export function useSettings() {
  const [settings, setSettings] = usePersistedState<CompanySettings>('df_settings', INITIAL_SETTINGS);

  const updateSettings = (newVals: Partial<CompanySettings>) => {
    setSettings((prev) => ({ ...prev, ...newVals }));
  };

  return {
    settings,
    updateSettings,
  };
}
