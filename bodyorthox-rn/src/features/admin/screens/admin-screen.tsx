import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { apiRequest } from '../../../core/api/api-client';
import { Card } from '../../../components/Card';
import { SectionLabel } from '../../../components/SectionLabel';
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from '../../../theme/tokens';

interface UserItem {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
}

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export function AdminScreen() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<UserItem[]>('/users');
      setUsers(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur chargement';
      showAlert('Erreur', msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const createPractitioner = async () => {
    if (!newEmail.trim() || !newPassword) return;
    setIsCreating(true);
    try {
      await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
        }),
      });
      setNewEmail('');
      setNewPassword('');
      await loadUsers();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur lors de la création';
      showAlert('Erreur', msg);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.ink} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Administration</Text>

      {/* Créer praticien */}
      <SectionLabel>NOUVEAU PRATICIEN</SectionLabel>
      <Card style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={newEmail}
          onChangeText={setNewEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={colors.textMuted}
          testID="admin-new-email"
        />
        <View style={styles.separator} />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholderTextColor={colors.textMuted}
          testID="admin-new-password"
        />
        <View style={styles.separator} />
        <TouchableOpacity
          style={[
            styles.button,
            (!newEmail.trim() || !newPassword || isCreating) && styles.buttonDisabled,
          ]}
          onPress={createPractitioner}
          disabled={!newEmail.trim() || !newPassword || isCreating}
          testID="admin-create-button"
        >
          {isCreating ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Créer le compte</Text>
          )}
        </TouchableOpacity>
      </Card>

      {/* Liste comptes */}
      <SectionLabel>{`COMPTES (${users.length})`}</SectionLabel>
      <Card style={styles.card}>
        {users.map((item, index) => (
          <React.Fragment key={item.id}>
            {index > 0 && <View style={styles.separator} />}
            <View style={styles.userRow}>
              <Text style={styles.userEmail}>{item.email}</Text>
              <Text style={styles.userMeta}>
                {item.role === 'admin' ? 'Administrateur' : 'Praticien'}
                {' · '}
                {item.isActive ? 'Actif' : 'Désactivé'}
              </Text>
            </View>
          </React.Fragment>
        ))}
        {users.length === 0 && (
          <Text style={styles.empty}>Aucun compte</Text>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.s16,
    paddingBottom: spacing.s28 * 2,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.s24,
  },
  card: {
    padding: spacing.s16,
    marginBottom: spacing.s16,
  },
  input: {
    fontFamily: fonts.sans,
    fontSize: fontSize.bodyLg,
    color: colors.textPrimary,
    paddingVertical: spacing.s10,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  button: {
    backgroundColor: colors.ink,
    borderRadius: radius.button,
    paddingVertical: spacing.s10,
    alignItems: 'center',
    marginTop: spacing.s10,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontFamily: fonts.sans,
    color: colors.textInverse,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.semiBold,
  },
  userRow: {
    paddingVertical: spacing.s10,
  },
  userEmail: {
    fontFamily: fonts.mono,
    fontSize: fontSize.bodyLg,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  userMeta: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    color: colors.textMuted,
    marginTop: 2,
  },
  empty: {
    fontFamily: fonts.sans,
    fontSize: fontSize.bodyLg,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.s16,
  },
});
