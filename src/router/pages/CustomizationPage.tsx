import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomizationScreen } from '../../screens/Customization/CustomizationScreen';
import { useAppContext } from '../AppContext';

export function CustomizationPage() {
  const navigate = useNavigate();
  const ctx = useAppContext();

  return (
    <CustomizationScreen
      settings={ctx.settings}
      onUpdateSettings={ctx.updateSettings}
      onClose={() => navigate('/settings')}
    />
  );
}
