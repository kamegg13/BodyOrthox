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
import { Colors } from '../../../shared/design-system/colors';
import { Spacing, BorderRadius } from '../../../shared/design-system/spacing';
import { FontSize, FontWeight } from '../../../shared/design-system/typography';
import { CardShadow } from '../../../shared/design-system/card-styles';

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
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Administration</Text>

      {/* Créer praticien */}
      <Text style={styles.sectionTitle}>NOUVEAU PRATICIEN</Text>
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={newEmail}
          onChangeText={setNewEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={Colors.textSecondary}
          testID="admin-new-email"
        />
        <View style={styles.separator} />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholderTextColor={Colors.textSecondary}
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
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Créer le compte</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Liste comptes */}
      <Text style={styles.sectionTitle}>COMPTES ({users.length})</Text>
      <View style={styles.card}>
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  card: {
    ...CardShadow,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  input: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
  },
  userRow: {
    paddingVertical: Spacing.sm,
  },
  userEmail: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  userMeta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
  empty: {
    fontSize: FontSize.md,
    color: Colors.textDisabled,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
});
