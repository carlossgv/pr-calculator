import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { KG_TO_LBS, LBS_TO_KG } from '@/constants/Units';

function calculatePercentages(weight: number) {
  const percentages = [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45];
  return percentages.map((percentage) => ({
    label: `${(percentage * 100).toFixed(0)}%`,
    value: Math.round(weight * percentage).toString(),
  }));
}

export default function PRPage() {
  const router = useRouter();
  const { name: movementName, pr: initialWeight } = useLocalSearchParams();
  const [weight, setWeight] = useState<number>(Number(initialWeight) || 0);
  const [unit, setUnit] = useState<'kg' | 'lbs'>('lbs');
  const [percentages, setPercentages] = useState(calculatePercentages(weight));

  useEffect(() => {
    setPercentages(calculatePercentages(weight));
    console.debug('important weight:', weight);
    console.debug('name:', movementName);
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
    } else {
      const convertedWeight = weight * LBS_TO_KG;
      setUnit('kg');
      setWeight(parseFloat(convertedWeight.toFixed(2)));
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
      {movementName && (
        <Text style={styles.title}>{movementName}</Text>
      )}

      {/* Toggle Row */}
      <View style={styles.row}>
        <Button
          title="Kg"
          onPress={toggleUnit}
          color={unit === 'kg' ? '#6200EE' : '#B0BEC5'}
        />
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(weight)}
          onChangeText={handleWeightChange}
        />
        <Button
          title="Lbs"
          onPress={toggleUnit}
          color={unit === 'lbs' ? '#6200EE' : '#B0BEC5'}
        />
      </View>

      {/* Percentages Table */}
      <FlatList
        data={percentages}
        keyExtractor={(item) => item.label}
        renderItem={renderPercentage}
      />

      {/* Edit Button */}
      {movementName && (
        <TouchableOpacity style={styles.editButton} onPress={handleEditMovement}>
          <Text style={styles.editButtonText}>Edit Movement</Text>
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
    marginBottom: 20,
    color: '#6200EE',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#B0BEC5',
    borderRadius: 5,
    padding: 10,
    width: 100,
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 16,
  },
  editButton: {
    marginTop: 20,
    paddingVertical: 15,
    backgroundColor: '#6200EE',
    borderRadius: 5,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
