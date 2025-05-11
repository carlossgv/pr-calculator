import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { addMovementData, createMovement, deleteMovement, deleteMovementData, getMovement } from '@/utils/movements.utils';
import { getUser } from '@/utils/user.utils'; // Import to fetch user preferences
import { MaterialIcons } from '@expo/vector-icons'; // For the trash icon
import { KG_TO_LBS } from '@/constants/Units';
import { User } from '@/types/user.type';
import { MovementData } from '@/types/movements.type';

export default function MovementForm() {
  const router = useRouter();
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

      console.debug('Fetched movement data:', movement);
      console.debug('Initial name in EDIT:', initialName);
      console.debug('Initial PR in CREATE:', initialPR);
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
      })

    } else {
      await createMovement({ name, data: [{ date: new Date().toISOString(), weight: prInLbs, reps: 1, set: 0 }] });
    }
    router.replace({ pathname: '/pr-details', params: { name, pr: prInLbs } });
  }

  async function handleDeleteRecord(index: number) {
    console.debug('Deleting record at index:', index);
    const record = movementData[index];
    console.debug('Record to delete:', record);
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
    <View style={styles.container}>
      {/* Trash Icon Button */}
      {initialName && (
        <TouchableOpacity style={styles.trashButton} onPress={handleDelete}>
          <MaterialIcons name="delete" size={20} color="white" />
        </TouchableOpacity>
      )}

      {/* Title Section */}
      {initialName ? (
        <Text style={styles.header}>Add new weight</Text>
      ) : (
        <Text style={styles.header}>Create Movement</Text>
      )}

      {/* Movement Name Input */}
      <TextInput
        style={styles.nameInput}
        placeholder="Movement Name"
        placeholderTextColor="#B0BEC5"
        value={name}
        onChangeText={setName}
        editable={!initialName} // Disable input if initialName is set
      />

      {/* PR Input and Unit Button */}
      <View style={styles.prInputContainer}>
        <TextInput
          style={styles.prInput}
          placeholder={`PR (${unit})`}
          placeholderTextColor="#B0BEC5"
          keyboardType="numeric"
          value={pr}
          onChangeText={setPR}
        />
        <TouchableOpacity style={styles.unitButton} onPress={toggleUnit}>
          <Text style={styles.unitButtonText}>{unit.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {/* List of Weights */}
      <FlatList
        data={movementData}
        keyExtractor={(item, index) => `${item.date}-${index}`}
        renderItem={({ item, index }) => (
          <View style={styles.record}>
            <Text style={styles.recordText}>
              {`${item.weight} ${unit.toUpperCase()} on ${new Date(item.date).toLocaleDateString()}`}
            </Text>
            <TouchableOpacity onPress={() => handleDeleteRecord(index)}>
              <MaterialIcons name="delete" size={20} color="red" />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.buttonText}>{initialName ? 'Save Changes' : 'Create Movement'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  trashButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'red',
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
    color: '#6200EE',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#B0BEC5',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
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
    borderColor: '#B0BEC5',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#fff',
    marginRight: 10,
    fontSize: 16,
  },
  unitButton: {
    backgroundColor: '#6200EE',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50, // Match the height of the PR input field
  },
  unitButtonText: {
    color: '#FFFFFF',
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
    backgroundColor: '#6200EE',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#B0BEC5',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginLeft: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  record: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  recordText: {
    fontSize: 16,
  },
});
