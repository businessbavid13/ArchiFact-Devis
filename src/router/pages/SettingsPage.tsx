import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsScreen } from '../../screens/Settings/SettingsScreen';
import { useAppContext } from '../AppContext';
import { useAuth } from '../../auth';

export function SettingsPage() {
  const navigate = useNavigate();
  const ctx = useAppContext();
  const { signOut } = useAuth();

  return (
    <SettingsScreen
      settings={ctx.settings}
      creditsBalance={ctx.credits}
      onUpdateSettings={ctx.updateSettings}
      onOpenCustomization={() => navigate('/settings/customization')}
      onOpenCreditsStore={() => ctx.setIsCreditsModalOpen(true)}
      onSignOut={signOut}
    />
  );
}
