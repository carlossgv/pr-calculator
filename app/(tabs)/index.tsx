import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList } from 'react-native';

function calculatePercentages(weight: number) {
  const percentages = [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45];
  return percentages.map((percentage) => ({
    label: `${(percentage * 100).toFixed(0)}%`,
    value: Math.round(weight * percentage).toString(),
  }));
}

export default function PRPage() {
  const [weight, setWeight] = useState(0);
  const [unit, setUnit] = useState('kg');
  const [percentages, setPercentages] = useState(calculatePercentages(0));

  function handleWeightChange(input: string) {
    const parsedWeight = parseFloat(input) || 0;
    setWeight(parsedWeight);
    setPercentages(calculatePercentages(parsedWeight));
  }

  function toggleUnit() {
    if (unit === 'kg') {
      const convertedWeight = weight * 2.20462; // Convert kg to lbs
      setUnit('lbs');
      setWeight(parseFloat(convertedWeight.toFixed(2)));
      setPercentages(calculatePercentages(convertedWeight));
    } else {
      const convertedWeight = weight / 2.20462; // Convert lbs to kg
      setUnit('kg');
      setWeight(parseFloat(convertedWeight.toFixed(2)));
      setPercentages(calculatePercentages(convertedWeight));
    }
  }

  function renderPercentage({ item, index }: {
    item: { label: string; value: string };
    index: number;
  }) {
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10, // Adjusted to remove margin and make rows compact
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
});
