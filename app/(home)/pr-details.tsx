import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons'; // For the pencil icon
import { useFocusEffect } from '@react-navigation/native'; // To handle screen focus
import { KG_TO_LBS, LBS_TO_KG } from '@/constants/Units';
import { getAllMovements } from '@/utils/movements.utils';

function calculatePercentages(weight: number) {
  const percentages = [1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4];
  return percentages.map((percentage) => ({
    label: `${(percentage * 100).toFixed(0)}%`,
    value: Math.round(weight * percentage).toString(),
  }));
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

export default function PRPage() {
  const router = useRouter();
  const { name: movementName, pr: initialWeight, quickCalc = false, date } = useLocalSearchParams();
  const [weight, setWeight] = useState<number>(Number(initialWeight) || 0);
  const [unit, setUnit] = useState<'kg' | 'lbs'>('lbs');
  const [percentages, setPercentages] = useState(calculatePercentages(weight));

  // Re-fetch the movement details when the page gains focus
  useFocusEffect(
    React.useCallback(() => {
      async function fetchMovement() {
        const movements = await getAllMovements();
        const movement = movements.find((item) => item.name === movementName);
        if (movement) {
          setWeight(movement.pr);
        }
      }

      if (!quickCalc && movementName) {
        fetchMovement();
      }
    }, [movementName, quickCalc])
  );

  useEffect(() => {
    setPercentages(calculatePercentages(weight));
  }, [weight]);

  function handleWeightChange(input: string) {
    const parsedWeight = parseFloat(input) || 0;
    setWeight(parsedWeight);
  }

  function toggleUnit() {
    if (unit === 'kg') {
      const convertedWeight = weight * KG_TO_LBS;
      setUnit('lbs');
      setWeight(parseFloat(convertedWeight.toFixed(2)));
      setPercentages(calculatePercentages(convertedWeight));
    } else {
      const convertedWeight = weight * LBS_TO_KG;
      setUnit('kg');
      setWeight(parseFloat(convertedWeight.toFixed(2)));
      setPercentages(calculatePercentages(convertedWeight));
    }
  }

  function handleEditMovement() {
    router.push({
      pathname: '/create-edit-movement',
      params: { name: movementName as string, pr: String(weight) },
    });
  }

  function renderPercentage({ item, index }: { item: { label: string; value: string }; index: number }) {
    const backgroundColor = index % 2 === 0 ? '#FFFFFF' : '#F5F5DC'; // White for even rows, beige for odd rows
    return (
      <View style={[styles.row, { backgroundColor }]}>
        <Text style={styles.label}>{item.label}</Text>
        <Text style={styles.value}>{item.value} {unit}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>{quickCalc ? 'Quick Percentage Calculator' : movementName}</Text>

      {/* Date Display */}
      {!quickCalc && date && (
        <Text style={styles.date}>Updated on {formatDate(date as string)}</Text> // TODO: check this cast to string
      )}

      {/* Personal Record */}
      <View style={styles.personalRecordContainer}>
        {quickCalc ? (
          // Editable TextInput for quickCalc mode
          <TextInput
            style={styles.personalRecordInput}
            keyboardType="numeric"
            value={String(weight)}
            onChangeText={handleWeightChange}
          />
        ) : (
          // Static display for normal mode
          <Text style={styles.personalRecord}>Personal Record: {weight}</Text>
        )}
        <TouchableOpacity style={styles.unitButton} onPress={toggleUnit}>
          <Text style={styles.unitButtonText}>{unit.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {/* Percentages Table */}
      <FlatList
        data={percentages}
        keyExtractor={(item) => item.label}
        renderItem={({ item, index }) => {
          // Inject the "Weight:" row as the first item in the table
          if (index === 0) {
            return renderPercentage({ item: { label: '100%', value: String(weight) }, index });
          }
          return renderPercentage({ item, index });
        }}
      />

      {/* Edit Floating Button */}
      {!quickCalc && movementName && (
        <TouchableOpacity style={styles.floatingButton} onPress={handleEditMovement}>
          <MaterialIcons name="edit" size={28} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#6200EE',
  },
  date: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    color: '#888888',
  },
  personalRecordContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  personalRecord: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  personalRecordInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    borderWidth: 1,
    borderColor: '#B0BEC5',
    borderRadius: 5,
    padding: 5,
    width: 120,
    textAlign: 'center',
  },
  unitButton: {
    marginLeft: 10,
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: '#6200EE',
    borderRadius: 5,
  },
  unitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 16,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6200EE',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
