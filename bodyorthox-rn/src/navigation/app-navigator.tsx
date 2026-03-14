import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { Colors } from '../shared/design-system/colors';

// Screens
import { BiometricLockScreen } from '../shared/components/biometric-lock-screen-screen';
import { PatientsScreen } from '../features/patients/screens/patients-screen';
import { CreatePatientScreen } from '../features/patients/screens/create-patient-screen';
import { PatientDetailScreen } from '../features/patients/screens/patient-detail-screen';
import { CaptureScreen } from '../features/capture/screens/capture-screen';
import { ResultsScreen } from '../features/results/screens/results-screen';
import { ReplayScreen } from '../features/results/screens/replay-screen';
import { PatientTimelineScreen } from '../features/patients/screens/patient-timeline-screen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: Colors.backgroundCard },
  headerTintColor: Colors.textPrimary,
  headerTitleStyle: { color: Colors.textPrimary },
  contentStyle: { backgroundColor: Colors.background },
} as const;

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={screenOptions} initialRouteName="Lock">
      <Stack.Screen
        name="Lock"
        component={BiometricLockScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Patients"
        component={PatientsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreatePatient"
        component={CreatePatientScreen}
        options={{ title: 'Nouveau patient' }}
      />
      <Stack.Screen
        name="PatientDetail"
        component={PatientDetailScreen}
        options={{ title: 'Patient' }}
      />
      <Stack.Screen
        name="Capture"
        component={CaptureScreen}
        options={{
          headerShown: false,
          orientation: Platform.OS !== 'web' ? 'portrait' : undefined,
        }}
      />
      <Stack.Screen
        name="Results"
        component={ResultsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Replay"
        component={ReplayScreen}
        options={{ title: 'Relecture experte' }}
      />
      <Stack.Screen
        name="Timeline"
        component={PatientTimelineScreen}
        options={{ title: 'Progression clinique' }}
      />
    </Stack.Navigator>
  );
}
