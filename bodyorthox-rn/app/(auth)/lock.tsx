import React from 'react';
import { router } from 'expo-router';
import { useBiometricAuth } from '../../src/core/auth/use-biometric-auth';
import { BiometricLockScreen } from '../../src/shared/components/biometric-lock-screen';

export default function LockScreen() {
  const { unlock, isAuthenticating, error } = useBiometricAuth();

  const handleUnlock = async () => {
    await unlock();
    router.replace('/(app)/patients');
  };

  return (
    <BiometricLockScreen
      onUnlock={handleUnlock}
      isAuthenticating={isAuthenticating}
      error={error}
    />
  );
}
