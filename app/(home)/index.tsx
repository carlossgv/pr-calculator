import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons'; // For icons
import { getAllMovements } from '@/utils/movements.utils';
import { useFocusEffect } from '@react-navigation/native'; // To handle screen focus

type Movement = {
  name: string;
  pr: number;
};

export default function MovementsList() {
  const router = useRouter();
  const [movements, setMovements] = useState<Movement[]>([]);

  // Re-fetch movements when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      async function fetchMovements() {
        const storedMovements = await getAllMovements();
        console.debug('Stored Movements:', storedMovements);
        setMovements(storedMovements);
      }

      fetchMovements();
    }, [])
  );

  function goToPRPage(movement: Movement) {
    router.push({ pathname: '/pr-details', params: movement });
  }

  function goToAddMovement() {
    router.push('/create-edit-movement'); // Navigate to the add/edit movement screen
  }

  function goToQuickCalc() {
    router.push({ pathname: '/pr-details', params: { quickCalc: true } });
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
        ListEmptyComponent={
          <Text style={styles.emptyText}>No movements found. Add a new one!</Text>
        }
      />
      {/* Quick Calc Button */}
      <TouchableOpacity style={styles.quickCalcButton} onPress={goToQuickCalc}>
        <MaterialIcons name="calculate" size={28} color="white" />
      </TouchableOpacity>
      {/* Add Movement Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={goToAddMovement}>
        <MaterialIcons name="add" size={32} color="white" />
      </TouchableOpacity>
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
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#B0BEC5',
    marginTop: 20,
  },
  quickCalcButton: {
    position: 'absolute',
    bottom: 90, // Positioned above the "+" button
    right: 20,
    backgroundColor: '#FF9800', // Orange background for distinction
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});
