import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { saveMovement, deleteMovement } from '@/utils/movements.utils';
import { getUser } from '@/utils/user.utils';
import { MaterialIcons } from '@expo/vector-icons';
import { KG_TO_LBS } from '@/constants/Units';
import { User } from '@/types/user.type';
import { useTheme } from 'react-native-paper';

export default function MovementForm() {
  const router = useRouter();
  const theme = useTheme();
  const { name: initialName, pr: initialPR } = useLocalSearchParams();

  const [name, setName] = useState<string>(initialName as string || '');
  const [pr, setPR] = useState<string>(initialPR as string || '');
  const [unit, setUnit] = useState<User['preferences']['weightUnit']>('lb');

  useEffect(() => {
    async function fetchUserPreferences() {
      const user = await getUser();
      if (user?.preferences?.weightUnit) {
        setUnit(user.preferences.weightUnit);
      }
    }

    fetchUserPreferences();
    if (initialName) setName(initialName as string);
    if (initialPR) setPR(initialPR as string);
  }, [initialName, initialPR]);

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
    },
    title: {
      color: theme.colors.primary,
    },
    header: {
      color: theme.colors.onBackground,
    },
    nameInput: {
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      color: theme.colors.onSurface,
    },
    prInput: {
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      color: theme.colors.onSurface,
    },
    unitButton: {
      backgroundColor: theme.colors.primary,
    },
    unitButtonText: {
      color: theme.colors.onPrimary,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
    },
    cancelButton: {
      backgroundColor: theme.colors.secondary,
    },
    buttonText: {
      color: theme.colors.onPrimary,
    },
    trashButton: {
      backgroundColor: theme.colors.error,
    },
  });

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Error', 'Movement name is required.');
      return;
    }
    if (!pr || isNaN(Number(pr))) {
      Alert.alert('Error', `Please provide a valid PR value in ${unit}.`);
      return;
    }

    const prInLbs = unit === 'kg' ? Number(pr) * KG_TO_LBS : Number(pr);

    if (initialName && initialName !== name) {
      await deleteMovement(initialName as string);
    }

    await saveMovement({ name, pr: prInLbs, date: new Date().toISOString() });
    router.replace({ pathname: '/pr-details', params: { name, pr: prInLbs } });
  }

  async function handleDelete() {
    if (!initialName) {
      Alert.alert('Error', 'Cannot delete a movement that has not been created.');
      return;
    }

    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete the movement "${initialName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMovement(initialName as string);
            router.navigate('/(home)');
          },
        },
      ]
    );
  }

  function toggleUnit() {
    if (unit === 'lb') {
      const converted = pr ? (Number(pr) / KG_TO_LBS).toFixed(2) : '';
      setPR(converted);
      setUnit('kg');
    } else {
      const converted = pr ? (Number(pr) * KG_TO_LBS).toFixed(2) : '';
      setPR(converted);
      setUnit('lb');
    }
  }

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {initialName && (
        <TouchableOpacity style={[styles.trashButton, dynamicStyles.trashButton]} onPress={handleDelete}>
          <MaterialIcons name="delete" size={20} color="white" />
        </TouchableOpacity>
      )}

      {initialName ? (
        <Text style={[styles.title, dynamicStyles.title]}>{initialName}</Text>
      ) : (
        <Text style={[styles.header, dynamicStyles.header]}>Create Movement</Text>
      )}

      <TextInput
        style={[styles.nameInput, dynamicStyles.nameInput]}
        placeholder="Movement Name"
        placeholderTextColor={theme.colors.onSurfaceVariant}
        value={name}
        onChangeText={setName}
      />

      <View style={styles.prInputContainer}>
        <TextInput
          style={[styles.prInput, dynamicStyles.prInput]}
          placeholder={`PR (${unit})`}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          keyboardType="numeric"
          value={pr}
          onChangeText={setPR}
        />
        <TouchableOpacity style={[styles.unitButton, dynamicStyles.unitButton]} onPress={toggleUnit}>
          <Text style={[styles.unitButtonText, dynamicStyles.unitButtonText]}>{unit.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.saveButton, dynamicStyles.saveButton]} onPress={handleSave}>
          <Text style={[styles.buttonText, dynamicStyles.buttonText]}>
            {initialName ? 'Save Changes' : 'Create Movement'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.cancelButton, dynamicStyles.cancelButton]} onPress={() => router.back()}>
          <Text style={[styles.buttonText, dynamicStyles.buttonText]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  trashButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    fontSize: 18,
    textAlign: 'center',
  },
  prInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    fontSize: 16,
  },
  unitButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
  },
  unitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginLeft: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
