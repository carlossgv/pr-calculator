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
import { MaterialIcons } from '@expo/vector-icons';
import { getAllMovements } from '@/utils/movements.utils';
import { getUser } from '@/utils/user.utils';
import { useFocusEffect } from '@react-navigation/native';
import { Movement } from '@/types/movements.type';
import filesystemClient from '@/utils/filesystem.client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FILE_NAME } from '@/constants/Files';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { User } from '@/types/user.type';
import { useTheme } from 'react-native-paper';

export default function MovementsList() {
  const router = useRouter();
  const theme = useTheme();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<Movement[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [user, setUser] = useState<User>({ gender: 'M', preferences: { weightUnit: 'lb' } });
  const [isExpanded, setIsExpanded] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const [titleTapCount, setTitleTapCount] = useState(0);
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);

  const dynamicStyles = StyleSheet.create({
    movementRow: {
      backgroundColor: theme.colors.secondaryContainer,
    },
    movementName: {
      color: theme.colors.onPrimaryContainer,
    },
    prValue: {
      color: theme.colors.onSecondaryContainer,
    },
    searchContainer: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outline,
    },
    searchInput: {
      color: theme.colors.onSurface,
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
    },
    mainButton: {
      backgroundColor: theme.colors.primary,
    },
    loadButton: {
      backgroundColor: theme.colors.error,
    },
    exportButton: {
      backgroundColor: theme.colors.tertiary,
    },
    quickCalcButton: {
      backgroundColor: theme.colors.secondaryContainer,
    },
    addMovementButton: {
      backgroundColor: theme.colors.primaryContainer,
    },
    preferencesButton: {
      backgroundColor: theme.colors.secondary,
    },
  });

  useFocusEffect(
    React.useCallback(() => {
      async function fetchData() {
        try {
          const [storedMovements, user] = await Promise.all([getAllMovements(), getUser()]);
          setMovements(adjustMovementsToUnit(storedMovements, user?.preferences.weightUnit || 'lb', true));
          user && setUser(user);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }

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

  function adjustMovementsToUnit(movements: Movement[], weightUnit: 'kg' | 'lb', initialLoad = false) {
    if (weightUnit === 'kg') {
      return movements.map((movement) => ({
        ...movement,
        pr: Math.round(movement.pr * 0.453592 * 10) / 10,
      }));
    } else {
      if (initialLoad) {
        return movements.map((movement) => ({
          ...movement,
          pr: Math.round(movement.pr * 10) / 10,
        }));
      }
      return movements.map((movement) => ({
        ...movement,
        pr: Math.round(movement.pr * 2.20462 * 10) / 10,
      }));
    }
  }

  function goToPRPage(movement: Movement) {
    collapseButtons();
    router.push({ pathname: '/pr-details', params: movement });
  }

  function goToAddMovement() {
    collapseButtons();
    router.push('/create-edit-movement');
  }

  function goToQuickCalc() {
    collapseButtons();
    router.push({ pathname: '/pr-details', params: { quickCalc: "true" } });
  }

  function goToUserPreferences() {
    collapseButtons();
    router.push('/user-preferences');
  }

  async function clearStorage() {
    try {
      await AsyncStorage.clear();
      Alert.alert('Success', 'Storage has been cleared.');
      const updatedMovements = await getAllMovements();
      setMovements(adjustMovementsToUnit(updatedMovements, user.preferences.weightUnit));
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
      const fileUri = await filesystemClient.writeJSON(FILE_NAME, movements);
      await filesystemClient.shareFile(fileUri);
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', (error as any).message ?? 'Failed to export data.');
    }
  }

  async function loadJSONData() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      const parsedData: unknown = JSON.parse(fileContent);

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
              await filesystemClient.loadJSONToAsyncStorage(fileUri);
              const updatedMovements = await getAllMovements();
              setMovements(adjustMovementsToUnit(updatedMovements, user.preferences.weightUnit));
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
    setTitleTapCount((prevCount) => prevCount + 1);

    if (titleTapCount + 1 === 7) {
      setTitleTapCount(0);
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

    if (tapTimeout.current) {
      clearTimeout(tapTimeout.current);
    }
    tapTimeout.current = setTimeout(() => {
      setTitleTapCount(0);
    }, 1500);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <TouchableWithoutFeedback onPress={collapseButtons}>
        <View style={[styles.container, styles.contentWrapper, { backgroundColor: theme.colors.background }]}>
          <Pressable onPress={handleTitlePress}>
            <Text style={[styles.header, { color: theme.colors.primary }]}>Calculame Este</Text>
          </Pressable>

          <View style={[styles.searchContainer, dynamicStyles.searchContainer]}>
            <MaterialIcons name="search" size={24} color={theme.colors.onSurface} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, dynamicStyles.searchInput]}
              placeholder="Search movements..."
              placeholderTextColor={theme.colors.onSurface}
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>

          <FlatList
            data={filteredMovements.length ? filteredMovements : movements}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.movementRow, dynamicStyles.movementRow]}
                onPress={() => goToPRPage(item)}
              >
                <Text style={[styles.movementName, dynamicStyles.movementName]}>{item.name}</Text>
                <Text style={[styles.prValue, dynamicStyles.prValue]}>
                  {item.pr} {user.preferences.weightUnit}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={[styles.emptyText, dynamicStyles.emptyText]}>No movements found. Add a new one!</Text>
            }
          />

          <View style={styles.collapsibleContainer}>
            {isExpanded && (
              <Animated.View style={styles.collapsibleButtons}>
                {/* <TouchableOpacity */}
                {/*   style={[styles.collapsibleButton, dynamicStyles.loadButton]} */}
                {/*   onPress={loadJSONData} */}
                {/* > */}
                {/*   <MaterialIcons name="file-upload" size={28} color="white" /> */}
                {/* </TouchableOpacity> */}
                {/* <TouchableOpacity */}
                {/*   style={[styles.collapsibleButton, dynamicStyles.exportButton]} */}
                {/*   onPress={exportDataAsJSON} */}
                {/* > */}
                {/*   <MaterialIcons name="file-download" size={28} color="white" /> */}
                {/* </TouchableOpacity> */}
                <TouchableOpacity
                  style={[styles.collapsibleButton, dynamicStyles.quickCalcButton]}
                  onPress={goToQuickCalc}
                >
                  <MaterialIcons name="calculate" size={28} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.collapsibleButton, dynamicStyles.addMovementButton]}
                  onPress={goToAddMovement}
                >
                  <MaterialIcons name="add" size={28} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.collapsibleButton, dynamicStyles.preferencesButton]}
                  onPress={goToUserPreferences}
                >
                  <MaterialIcons name="settings" size={28} color="white" />
                </TouchableOpacity>
              </Animated.View>
            )}

            <TouchableOpacity style={[styles.mainButton, dynamicStyles.mainButton]} onPress={toggleButtons}>
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
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  collapsibleContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'center',
  },
  mainButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  collapsibleButtons: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  collapsibleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
});
