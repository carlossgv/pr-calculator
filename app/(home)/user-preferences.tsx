import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@react-navigation/native'; // Import useTheme
import { getUser, saveUser } from '@/utils/user.utils';
import { User } from '@/types/user.type';
import { CustomTheme } from '@/constants/Colors';

export default function UserDefaultsForm() {
  const router = useRouter();
  const { colors } = useTheme() as CustomTheme
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
        setGender(userPreferences.gender);
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
    <View
      style={{
        flex: 1,
        padding: 20,
        backgroundColor: colors.background,
      }}
    >
      {/* Title Section */}
      <Text
        style={{
          fontSize: 28,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 20,
          color: colors.primaryText,
        }}
      >
        Edit User Defaults
      </Text>

      {/* Gender Picker */}
      <Text
        style={{
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: 10,
          color: colors.secondaryText,
        }}
      >
        Gender
      </Text>
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.borders,
          borderRadius: 5,
          marginBottom: 20,
          backgroundColor: colors.surface,
        }}
      >
        <Picker
          selectedValue={gender}
          style={{
            height: 50,
            width: '100%',
            color: colors.primaryText,
          }}
          onValueChange={(itemValue) => setGender(itemValue as User['gender'])}
          dropdownIconColor={colors.primaryText}
        >
          <Picker.Item label="Male" value="M" />
          <Picker.Item label="Female" value="F" />
        </Picker>
      </View>

      {/* Weight Unit Picker */}
      <Text
        style={{
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: 10,
          color: colors.secondaryText,
        }}
      >
        Weight Unit
      </Text>
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.borders,
          borderRadius: 5,
          marginBottom: 20,
          backgroundColor: colors.surface,
        }}
      >
        <Picker
          selectedValue={weightUnit}
          style={{
            height: 50,
            width: '100%',
            color: colors.primaryText,
          }}
          onValueChange={(itemValue) =>
            setWeightUnit(itemValue as User['preferences']['weightUnit'])
          }
        >
          <Picker.Item label="Kilograms (kg)" value="kg" />
          <Picker.Item label="Pounds (lb)" value="lb" />
        </Picker>
      </View>

      {/* Buttons */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 20,
        }}
      >
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
            Save
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
