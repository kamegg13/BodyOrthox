import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { Colors } from '../../src/shared/design-system/colors';
import { AppConfiguration } from '../../src/core/config/app-config';

export default function AppLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function initDb() {
      try {
        const { createDatabase } = Platform.OS === 'web'
          ? require('../../src/core/database/database.web')
          : require('../../src/core/database/database.native');

        const db = createDatabase(AppConfiguration.databaseName);
        await db.initialize();

        const { SqlitePatientRepository } = require('../../src/features/patients/data/sqlite-patient-repository');
        const { SqliteAnalysisRepository } = require('../../src/features/capture/data/sqlite-analysis-repository');
        const { usePatientsStore } = require('../../src/features/patients/store/patients-store');
        const { useCaptureStore } = require('../../src/features/capture/store/capture-store');

        usePatientsStore.getState().setRepository(new SqlitePatientRepository(db));
        useCaptureStore.getState().setRepository(new SqliteAnalysisRepository(db));

        setDbReady(true);
      } catch (error) {
        console.error('DB init failed:', error);
        setDbReady(true); // Continue anyway
      }
    }

    initDb();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.backgroundCard },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { color: Colors.textPrimary },
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="patients/index" options={{ title: 'Patients', headerShown: false }} />
      <Stack.Screen name="patients/create" options={{ title: 'Nouveau patient', headerShown: true }} />
      <Stack.Screen name="patients/[patientId]/index" options={{ title: 'Patient', headerShown: true }} />
      <Stack.Screen
        name="patients/[patientId]/capture"
        options={{ title: 'Capture', headerShown: false, orientation: 'portrait' }}
      />
      <Stack.Screen
        name="patients/[patientId]/analyses/[analysisId]/index"
        options={{ title: 'Résultats', headerShown: false }}
      />
      <Stack.Screen
        name="patients/[patientId]/analyses/[analysisId]/replay"
        options={{ title: 'Relecture', headerShown: true }}
      />
      <Stack.Screen
        name="patients/[patientId]/timeline"
        options={{ title: 'Progression', headerShown: true }}
      />
    </Stack>
  );
}
