import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getUser, saveUser } from '@/utils/user.utils';
import { User } from '@/types/user.type';


export default function UserDefaultsForm() {
  const router = useRouter();
  const { gender: initialGender, weightUnit: initialWeightUnit } = useLocalSearchParams();
  const [gender, setGender] = useState<User['gender']>(initialGender as User['gender'] || 'M');
  const [weightUnit, setWeightUnit] = useState<User['preferences']['weightUnit']>(
    initialWeightUnit as User['preferences']['weightUnit'] || 'kg'
  );

  useEffect(() => {
      // Fetch user preferences (e.g., from an API or local storage)
      async function fetchUserPreferences() {
        const userPreferences = await getUser(); // Replace with actual API call or storage retrieval
        if (userPreferences) {
          setGender(userPreferences.gender)
          setWeightUnit(userPreferences.preferences.weightUnit);
        }
      }

      fetchUserPreferences();
  }, [initialGender, initialWeightUnit]);

  async function handleSave() {
    try {
      // Save the user preferences
      const user: User = {
        gender,
        preferences: {
          weightUnit,
        },
      };
      await saveUser(user);
      Alert.alert('Success', 'User defaults have been saved.');
      router.back();
    } catch (error) {
      console.error('Error saving user defaults:', error);
      Alert.alert('Error', 'Failed to save user defaults.');
    }
  }

  return (
    <View style={styles.container}>
      {/* Title Section */}
      <Text style={styles.title}>Edit User Defaults</Text>

      {/* Gender Picker */}
      <Text style={styles.label}>Gender</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={gender}
          style={styles.picker}
          onValueChange={(itemValue) => setGender(itemValue as User['gender'])}
        >
          <Picker.Item label="Male" value="M" />
          <Picker.Item label="Female" value="F" />
        </Picker>
      </View>

      {/* Weight Unit Picker */}
      <Text style={styles.label}>Weight Unit</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={weightUnit}
          style={styles.picker}
          onValueChange={(itemValue) =>
            setWeightUnit(itemValue as User['preferences']['weightUnit'])
          }
        >
          <Picker.Item label="Kilograms (kg)" value="kg" />
          <Picker.Item label="Pounds (lb)" value="lb" />
        </Picker>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.buttonText}>Save</Text>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#6200EE',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#B0BEC5',
    borderRadius: 5,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
    width: '100%',
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
});
