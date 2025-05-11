import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons'; // For icons
import { convertToKg, convertToLbs, getAllMovements } from '@/utils/movements.utils';
import { getUser } from '@/utils/user.utils';
import { useFocusEffect } from '@react-navigation/native'; // To handle screen focus
import { Movement, } from '@/types/movements.type';
import filesystemClient from '@/utils/filesystem.client'; // Import the updated filesystem client
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FILE_NAME } from '@/constants/Files';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { User } from '@/types/user.type';

type MovementListData = {
  name: string;
  pr: number;
}

export default function MovementsList() {
  const router = useRouter();
  const [movements, setMovements] = useState<MovementListData[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<MovementListData[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(''); // State for search query
  const [user, setUser] = useState<User>({ gender: 'M', preferences: { weightUnit: 'lb' } });
  const [isExpanded, setIsExpanded] = useState(false); // State to toggle button visibility
  const animation = useRef(new Animated.Value(0)).current; // Animation state for smooth transitions
  const [titleTapCount, setTitleTapCount] = useState(0); // Counter for title taps
  const tapTimeout = useRef<NodeJS.Timeout | null>(null); // Reference to the timeout for resets

  // Re-fetch movements and user preferences when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      async function fetchData() {
        try {
          const [storedMovements, user] = await Promise.all([getAllMovements(), getUser()]);
          console.debug('Fetched movements:', JSON.stringify(storedMovements, null, 2));
          const movementListData: MovementListData[] = storedMovements.map((movement) => ({ name: movement.name, pr: movement.data[0].weight }));
          console.debug('Fetched PRs:', movementListData);
          console.debug('Fetched user:', user);
          user && setUser(user);
          setMovements(adjustMovementsToUnit(movementListData, user?.preferences.weightUnit || 'lb', true));
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }

      // Collapse the buttons when returning to the screen
      setIsExpanded(false);
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();

      fetchData();
    }, [])
  );

  function handleSearch(query: string) {
    setSearchQuery(query);
    const lowercasedQuery = query.toLowerCase();
    const filtered = movements.filter((movement) =>
      movement.name.toLowerCase().includes(lowercasedQuery)
    );
    setFilteredMovements(filtered);
  }

  function adjustMovementsToUnit(movements: MovementListData[], weightUnit: 'kg' | 'lb', initialLoad = false) {
    if (weightUnit === 'lb') {
      if (initialLoad) {
        return movements
      }
      // Convert lbs to kg (1 lb = 0.453592 kg)
      return movements.map((movement) => ({
        ...movement,
        pr: convertToLbs(movement.pr), // Convert to lbs
      }));
    } else {
      if (initialLoad) {
        return movements.map((movement) => ({
          ...movement,
          pr: convertToKg(movement.pr),
        }))
      }
      // Convert kg to lbs (1 kg = 2.20462 lbs)
      return movements.map((movement) => ({
        ...movement,
        pr: convertToKg(movement.pr), // Convert to kg
      }));
    }
  }

  function goToPRPage(movementName: string) {
    collapseButtons(); // Collapse buttons before navigation
    router.push({ pathname: '/pr-details', params: { name: movementName } });
  }

  function goToAddMovement() {
    collapseButtons(); // Collapse buttons before navigation
    router.push('/create-edit-movement'); // Navigate to the add/edit movement screen
  }

  function goToQuickCalc() {
    collapseButtons(); // Collapse buttons before navigation
    router.push({ pathname: '/pr-details', params: { quickCalc: "true" } });
  }

  function goToUserPreferences() {
    collapseButtons(); // Collapse buttons before navigation
    router.push('/user-preferences'); // Navigate to the user preferences screen
  }

  async function clearStorage() {
    try {
      await AsyncStorage.clear();
      Alert.alert('Success', 'Storage has been cleared.');

      // Re-fetch and update the movements
      const updatedMovements = await getAllMovements();
      const listData: MovementListData[] = updatedMovements.map((movement) => ({ name: movement.name, pr: movement.data[0].weight }));
      setMovements(adjustMovementsToUnit(listData, user.preferences.weightUnit));
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
      Alert.alert('Error', 'Failed to clear storage.');
    }
  }

  async function exportDataAsJSON() {
    if (movements.length === 0) {
      Alert.alert('No Data', 'There are no movements to export.');
      return;
    }

    try {
      // Use the filesystem client to write and share the JSON file
      const fileUri = await filesystemClient.writeJSON(FILE_NAME, movements);
      await filesystemClient.shareFile(fileUri);
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', (error as any).message ?? 'Failed to export data.');
    }
  }

  async function loadJSONData() {
    try {
      // Open the file picker to select a JSON file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json', // Only allow JSON files
      });

      // Check if the user canceled the document picker
      if (result.canceled) {
        console.log('User canceled the file picker.');
        return;
      }

      // If the result is a success, get the file URI from the first asset
      const fileUri = result.assets[0].uri;

      // Read the JSON file content
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      const parsedData: unknown = JSON.parse(fileContent);

      // Validate that the parsed data matches the `Movement[]` type
      if (!Array.isArray(parsedData) || !parsedData.every(validateMovement)) {
        Alert.alert('Invalid Data', 'The selected JSON file does not match the expected format.');
        return;
      }

      Alert.alert(
        'Warning',
        'Loading this JSON will overwrite the current movement list. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Load',
            style: 'destructive',
            onPress: async () => {
              // Save the valid data to Async Storage
              await filesystemClient.loadJSONToAsyncStorage(fileUri);
              const updatedMovements = await getAllMovements();
              const listData: MovementListData[] = updatedMovements.map((movement) => ({ name: movement.name, pr: movement.data[0].weight }));
              setMovements(adjustMovementsToUnit(listData, user.preferences.weightUnit));
              Alert.alert('Success', 'Movements have been successfully loaded.');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error loading JSON data:', error);
      Alert.alert('Error', 'Failed to load JSON data.');
    }
  }

  // Validate that an object matches the Movement type
  function validateMovement(data: any): data is Movement {
    return (
      typeof data.name === 'string' &&
      typeof data.pr === 'number' &&
      typeof data.date === 'string'
    );
  }

  function toggleButtons() {
    const targetValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);
    Animated.timing(animation, {
      toValue: targetValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }

  function collapseButtons() {
    if (isExpanded) {
      setIsExpanded(false);
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }

  function handleTitlePress() {
    // Increment the title tap count
    setTitleTapCount((prevCount) => prevCount + 1);

    // If the titleTapCount reaches 7, show confirmation alert
    if (titleTapCount + 1 === 7) {
      setTitleTapCount(0); // Reset the counter
      Alert.alert(
        'Confirm Cache Clear',
        'Are you sure you want to clear all data? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', style: 'destructive', onPress: clearStorage },
        ]
      );
      return;
    }

    // Reset the counter if no further taps within 1.5 seconds
    if (tapTimeout.current) {
      clearTimeout(tapTimeout.current);
    }
    tapTimeout.current = setTimeout(() => {
      setTitleTapCount(0); // Reset the counter after timeout
    }, 1500);
  }

  function toggleWeightUnit() {
    const newWeightUnit = user.preferences.weightUnit === 'lb' ? 'kg' : 'lb';
    setUser({ ...user, preferences: { ...user.preferences, weightUnit: newWeightUnit } });
    setMovements(adjustMovementsToUnit(movements, newWeightUnit));
    setFilteredMovements(adjustMovementsToUnit(filteredMovements, newWeightUnit));
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <TouchableWithoutFeedback onPress={collapseButtons}>
        <View style={[styles.container, styles.contentWrapper]}>
          {/* Title with hidden functionality */}
          <Pressable onPress={handleTitlePress} android_ripple={{ color: 'transparent' }}>
            <Text style={styles.header}>Calculame Este</Text>
          </Pressable>

          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={24} color="#B0BEC5" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search movements..."
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>
            {/* Toggle Weight Unit Button */}
            <TouchableOpacity style={styles.unitToggleButton} onPress={toggleWeightUnit}>
              <Text style={styles.unitToggleText}>
                {user.preferences.weightUnit === 'lb' ? 'KG' : 'LB'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Movement List */}
          <FlatList
            data={filteredMovements.length ? filteredMovements : movements}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <Pressable
                style={styles.movementRow}
                onPress={() => goToPRPage(item.name)}
                android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
              >
                <Text style={styles.movementName}>{item.name}</Text>
                <Text style={styles.prValue}>
                  {item.pr} {user.preferences.weightUnit}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No movements found. Add a new one!</Text>
            }
          />
          {/* Collapsible Buttons */}
          <View style={styles.collapsibleContainer}>
            {isExpanded && (
              <Animated.View style={styles.collapsibleButtons}>
                {/* <TouchableOpacity */}
                {/*   style={[styles.collapsibleButton, styles.loadButton]} */}
                {/*   onPress={loadJSONData} */}
                {/* > */}
                {/*   <MaterialIcons name="file-upload" size={28} color="white" /> */}
                {/* </TouchableOpacity> */}
                {/* <TouchableOpacity */}
                {/*   style={[styles.collapsibleButton, styles.exportButton]} */}
                {/*   onPress={exportDataAsJSON} */}
                {/* > */}
                {/*   <MaterialIcons name="file-download" size={28} color="white" /> */}
                {/* </TouchableOpacity> */}
                <TouchableOpacity
                  style={[styles.collapsibleButton, styles.quickCalcButton]}
                  onPress={goToQuickCalc}
                >
                  <MaterialIcons name="calculate" size={28} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.collapsibleButton, styles.addMovementButton]}
                  onPress={goToAddMovement}
                >
                  <MaterialIcons name="add" size={28} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.collapsibleButton, styles.preferencesButton]}
                  onPress={goToUserPreferences}
                >
                  <MaterialIcons name="settings" size={28} color="white" />
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Main Button */}
            <TouchableOpacity style={styles.mainButton} onPress={toggleButtons}>
              <MaterialIcons name={isExpanded ? 'close' : 'menu'} size={32} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 20,
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
  collapsibleContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'center',
  },
  mainButton: {
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
  collapsibleButtons: {
    position: 'absolute',
    bottom: 80, // Ensure buttons expand upwards
    alignItems: 'center',
  },
  collapsibleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  loadButton: {
    backgroundColor: '#FF5722', // Orange-red
  },
  exportButton: {
    backgroundColor: '#4CAF50', // Green
  },
  quickCalcButton: {
    backgroundColor: '#FF9800', // Orange
  },
  addMovementButton: {
    backgroundColor: '#2196F3', // Blue
  },
  preferencesButton: {
    backgroundColor: '#9C27B0', // Purple
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Takes up available space
    borderWidth: 1,
    borderColor: '#B0BEC5',
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  searchIcon: {
    marginRight: 5,
  },
  searchInput: {
    flex: 1, // Takes up the remaining space in the search bar
    fontSize: 16,
    paddingVertical: 10,
  },
  unitToggleButton: {
    marginLeft: 10, // Space between the search bar and the button
    backgroundColor: '#6200EE',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  unitToggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
