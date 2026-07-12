import React, { useEffect } from "react";
import { Alert, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { BiometricLockScreen } from "./biometric-lock-screen";
import { useBiometricAuth } from "../../core/auth/use-biometric-auth";
import { useOnboardingStore } from "../../features/onboarding/store/onboarding-store";
import { useAuthStore } from "../../core/auth/auth-store";

type Nav = NativeStackNavigationProp<RootStackParamList, "Lock">;

function showLogoutConfirm(onConfirm: () => void) {
  const title = "Se déconnecter";
  const message =
    "Voulez-vous vous déconnecter ? Vous devrez ressaisir vos identifiants pour revenir.";
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: "Annuler", style: "cancel" },
      { text: "Se déconnecter", style: "destructive", onPress: onConfirm },
    ]);
  }
}

export function BiometricLockScreen_Screen() {
  const navigation = useNavigation<Nav>();
  const { unlock, isAuthenticating, error, isUnlocked } = useBiometricAuth();
  const isOnboardingCompleted = useOnboardingStore((s) => s.isCompleted);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (isUnlocked) {
      if (!isOnboardingCompleted) {
        navigation.replace("Onboarding");
      } else {
        navigation.replace("MainTabs", { screen: "AnalysesTab" });
      }
    }
  }, [isUnlocked, isOnboardingCompleted, navigation]);

  const handleUnlock = async () => {
    await unlock();
  };

  const handleLogout = () => {
    // Le lock étant sans issue de secours en cas d'échec biométrique répété,
    // ce lien reste le seul moyen de sortir de l'écran : toujours visible,
    // jamais désactivé. Après confirmation, le store passe isAuthenticated à
    // false et AppNavigator bascule automatiquement sur l'écran de connexion.
    showLogoutConfirm(() => {
      logout();
    });
  };

  return (
    <BiometricLockScreen
      onUnlock={handleUnlock}
      onLogout={handleLogout}
      isAuthenticating={isAuthenticating}
      error={error}
    />
  );
}

// Named export matching what app-navigator imports
export { BiometricLockScreen_Screen as BiometricLockScreen };
