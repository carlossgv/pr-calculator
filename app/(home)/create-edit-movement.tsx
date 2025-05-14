import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@react-navigation/native'; // Import useTheme
import {
  addMovementData,
  createMovement,
  deleteMovement,
  deleteMovementData,
  getMovement,
} from '@/utils/movements.utils';
import { getUser } from '@/utils/user.utils'; // Import to fetch user preferences
import { MaterialIcons } from '@expo/vector-icons'; // For the trash icon
import { KG_TO_LBS } from '@/constants/Units';
import { User } from '@/types/user.type';
import { MovementData } from '@/types/movements.type';

export default function MovementForm() {
  const router = useRouter();
  const { colors } = useTheme(); // Access colors using useTheme
  const { name: initialName, pr: initialPR } = useLocalSearchParams();

  const [name, setName] = useState<string>(initialName as string || '');
  const [pr, setPR] = useState<string>(initialPR as string || '');
  const [unit, setUnit] = useState<User['preferences']['weightUnit']>('lb'); // Default unit is lbs
  const [movementData, setMovementData] = useState<MovementData[]>([]); // Holds the list of weights

  useEffect(() => {
    async function fetchData() {
      const user = await getUser();
      if (user?.preferences?.weightUnit) {
        setUnit(user.preferences.weightUnit); // Set default unit based on user preferences
      }

      if (initialName) {
        const movement = await getMovement(initialName as string);
        if (movement) {
          setMovementData(movement.data);
        }
      }
    }

    fetchData();

    if (initialName) {
      setName(initialName as string);
    }
    if (initialPR) {
      setPR(initialPR as string);
    }
  }, [initialName, initialPR]);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Error', 'Movement name is required.');
      return;
    }

    if (!pr || isNaN(Number(pr))) {
      Alert.alert('Error', `Please provide a valid PR value in ${unit}.`);
      return;
    }

    // Convert to lbs if the current unit is kg
    const prInLbs = unit === 'kg' ? Number(pr) * KG_TO_LBS : Number(pr);

    if (initialName) {
      await addMovementData(initialName as string, {
        weight: prInLbs,
        reps: 1,
        set: 0,
        date: new Date().toISOString(),
      });
    } else {
      await createMovement({
        name,
        data: [
          {
            date: new Date().toISOString(),
            weight: prInLbs,
            reps: 1,
            set: 0,
          },
        ],
      });
    }
    router.replace({ pathname: '/pr-details', params: { name, pr: prInLbs } });
  }

  async function handleDeleteRecord(index: number) {
    const record = movementData[index];
    await deleteMovementData(name, record.date);
    setMovementData((prevData) => prevData.filter((_, i) => i !== index));
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
      // Convert lbs to kg
      const convertedPR = pr ? (Number(pr) / KG_TO_LBS).toFixed(2) : '';
      setPR(convertedPR);
      setUnit('kg');
    } else {
      // Convert kg to lbs
      const convertedPR = pr ? (Number(pr) * KG_TO_LBS).toFixed(2) : '';
      setPR(convertedPR);
      setUnit('lb');
    }
  }

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        backgroundColor: colors.background,
      }}
    >
      {/* Trash Icon Button */}
      {initialName && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            backgroundColor: colors.error,
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1,
          }}
          onPress={handleDelete}
        >
          <MaterialIcons name="delete" size={20} color={colors.surface} />
        </TouchableOpacity>
      )}

      {/* Title Section */}
      {initialName ? (
        <Text
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 20,
            color: colors.primaryText,
          }}
        >
          Add new weight
        </Text>
      ) : (
        <Text
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 20,
            color: colors.primaryText,
          }}
        >
          Create Movement
        </Text>
      )}

      {/* Movement Name Input */}
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: colors.borders,
          borderRadius: 5,
          padding: 10,
          marginBottom: 20,
          backgroundColor: colors.surface,
          fontSize: 18,
          textAlign: 'center',
          color: colors.primaryText,
        }}
        placeholder="Movement Name"
        placeholderTextColor={colors.secondaryText}
        value={name}
        onChangeText={setName}
        editable={!initialName} // Disable input if initialName is set
      />

      {/* PR Input and Unit Button */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: colors.borders,
            borderRadius: 5,
            padding: 10,
            backgroundColor: colors.surface,
            marginRight: 10,
            fontSize: 16,
            color: colors.primaryText,
          }}
          placeholder={`PR (${unit})`}
          placeholderTextColor={colors.secondaryText}
          keyboardType="numeric"
          value={pr}
          onChangeText={setPR}
        />
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 15,
            paddingVertical: 10,
            borderRadius: 5,
            justifyContent: 'center',
            alignItems: 'center',
            height: 50, // Match the height of the PR input field
          }}
          onPress={toggleUnit}
        >
          <Text
            style={{
              color: colors.onPrimaryText,
              fontSize: 16,
              fontWeight: 'bold',
            }}
          >
            {unit.toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* List of Weights */}
      <FlatList
        data={movementData}
        keyExtractor={(item, index) => `${item.date}-${index}`}
        renderItem={({ item, index }) => (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 10,
              borderWidth: 1,
              borderColor: colors.borders,
              borderRadius: 5,
              marginBottom: 10,
              backgroundColor: colors.surface,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: colors.primaryText,
              }}
            >
              {`${item.weight} ${unit.toUpperCase()} on ${new Date(
                item.date
              ).toLocaleDateString()}`}
            </Text>
            <TouchableOpacity onPress={() => handleDeleteRecord(index)}>
              <MaterialIcons name="delete" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.primary,
            paddingVertical: 15,
            borderRadius: 5,
            alignItems: 'center',
            marginRight: 10,
          }}
          onPress={handleSave}
        >
          <Text
            style={{
              color: colors.onPrimaryText,
              fontSize: 16,
              fontWeight: 'bold',
            }}
          >
            {initialName ? 'Save Changes' : 'Create Movement'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.borders,
            paddingVertical: 15,
            borderRadius: 5,
            alignItems: 'center',
            marginLeft: 10,
          }}
          onPress={() => router.back()}
        >
          <Text
            style={{
              color: colors.primaryText,
              fontSize: 16,
              fontWeight: 'bold',
            }}
          >
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
