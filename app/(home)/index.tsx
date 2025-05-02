import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons'; // For icons
import { getAllMovements } from '@/utils/movements.utils';
import { useFocusEffect } from '@react-navigation/native'; // To handle screen focus
import { Movement } from '@/types/movements.type';
import storageClient from '@/utils/async-storage.client';

export default function MovementsList() {
  const router = useRouter();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [titleTapCount, setTitleTapCount] = useState<number>(0);

  // Re-fetch movements when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      async function fetchMovements() {
        const storedMovements = await getAllMovements();
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
    router.push({ pathname: '/pr-details', params: { quickCalc: "true" } });
  }

  async function clearStorage() {
    try {
      await storageClient.clear();
      Alert.alert('Success', 'Storage has been cleared.');

      // Re-fetch and update the movements
      const updatedMovements = await getAllMovements();
      setMovements(updatedMovements); // Update the state to reflect the cleared storage
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
      Alert.alert('Error', 'Failed to clear storage.');
    }
  }

  function handleTitlePress() {
    setTitleTapCount((prevCount) => prevCount + 1);

    if (titleTapCount + 1 === 7) {
      setTitleTapCount(0); // Reset the counter
      Alert.alert(
        'Confirm Action',
        'Are you sure you want to clear all data? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', style: 'destructive', onPress: clearStorage },
        ]
      );
    }
  }

  return (
    <View style={styles.container}>
      {/* Title with hidden functionality */}
      <Pressable
        onPress={handleTitlePress}
        android_ripple={{ color: 'transparent' }}
      >
        <Text style={styles.header}>Calculame Este</Text>
      </Pressable>
      <FlatList
        data={movements}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <Pressable
            style={styles.movementRow}
            onPress={() => goToPRPage(item)}
            android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
          >
            <Text style={styles.movementName}>{item.name}</Text>
            <Text style={styles.prValue}>{item.pr} lbs</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No movements found. Add a new one!</Text>
        }
      />
      {/* Quick Calc Button */}
      <Pressable style={styles.quickCalcButton} onPress={goToQuickCalc}>
        <MaterialIcons name="calculate" size={28} color="white" />
      </Pressable>
      {/* Add Movement Button */}
      <Pressable style={styles.floatingButton} onPress={goToAddMovement}>
        <MaterialIcons name="add" size={32} color="white" />
      </Pressable>
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
