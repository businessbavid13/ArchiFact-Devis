import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AuthProvider, useAuth, AuthScreen } from './auth';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, isLoading, sendOtp, verifyOtp, signInWithGoogle } = useAuth();

  // Loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // Not logged in → show auth screen
  if (!user) {
    return (
      <AuthScreen
        onSendOtp={sendOtp}
        onVerifyOtp={verifyOtp}
        onSignInWithGoogle={signInWithGoogle}
      />
    );
  }

  // Logged in → show app with router
  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
