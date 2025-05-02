import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

type Movement = {
  name: string;
  pr: number;
};

const DEFAULT_MOVEMENTS: Movement[] = [
  { name: 'Squat', pr: 315 },
  { name: 'Bench Press', pr: 225 },
  { name: 'Deadlift', pr: 405 },
];

export default function MovementsList() {
  const router = useRouter();
  const [movements] = useState<Movement[]>(DEFAULT_MOVEMENTS);

  function goToPRPage(movement: Movement) {
    router.push({ pathname: '/pr-details', params: { weight: movement.pr } });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Weightlifting Movements</Text>
      <FlatList
        data={movements}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.movementRow} onPress={() => goToPRPage(item)}>
            <Text style={styles.movementName}>{item.name}</Text>
            <Text style={styles.prValue}>{item.pr} lbs</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  movementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#fff',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  movementName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  prValue: {
    fontSize: 16,
    color: '#6200EE',
  },
});
