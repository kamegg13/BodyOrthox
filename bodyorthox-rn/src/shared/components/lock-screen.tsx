import React, { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { BiometricLockScreen } from "./biometric-lock-screen";
import { useBiometricAuth } from "../../core/auth/use-biometric-auth";
import { useOnboardingStore } from "../../features/onboarding/store/onboarding-store";

type Nav = NativeStackNavigationProp<RootStackParamList, "Lock">;

export function BiometricLockScreen_Screen() {
  const navigation = useNavigation<Nav>();
  const { unlock, isAuthenticating, error, isUnlocked } = useBiometricAuth();
  const isOnboardingCompleted = useOnboardingStore((s) => s.isCompleted);

  useEffect(() => {
    if (isUnlocked) {
      if (!isOnboardingCompleted) {
        navigation.replace("Onboarding");
      } else {
        navigation.replace("Patients");
      }
    }
  }, [isUnlocked, isOnboardingCompleted, navigation]);

  const handleUnlock = async () => {
    await unlock();
  };

  return (
    <BiometricLockScreen
      onUnlock={handleUnlock}
      isAuthenticating={isAuthenticating}
      error={error}
    />
  );
}

// Named export matching what app-navigator imports
export { BiometricLockScreen_Screen as BiometricLockScreen };
