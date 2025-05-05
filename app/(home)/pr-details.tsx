import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { KG_TO_LBS, LBS_TO_KG } from '@/constants/Units';
import { getUser } from '@/utils/user.utils';
import { getAllMovements } from '@/utils/movements.utils';

function calculatePercentages(weight: number) {
  const percentages = [1.25, 1.2, 1.15, 1.1, 1.05, 1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4];
  return percentages.map((percentage) => ({
    label: `${(percentage * 100).toFixed(0)}%`,
    value: Math.round(weight * percentage).toString(),
    isCustom: false, // Default percentages are not custom
  }));
}

export default function PRPage() {
  const router = useRouter();
  const { name: movementName, pr: initialWeight, quickCalc = false } = useLocalSearchParams();
  const [weight, setWeight] = useState<number>(Number(initialWeight) || 0);
  const [unit, setUnit] = useState<'kg' | 'lbs'>('lbs');
  const [percentages, setPercentages] = useState(calculatePercentages(weight));
  const [modalVisible, setModalVisible] = useState(false); // For custom percentage input
  const [selectedWeightModal, setSelectedWeightModal] = useState(false); // For weight load modal
  const [customPercentageInput, setCustomPercentageInput] = useState<string>(''); // Input for custom percentage
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null); // Selected weight for load modal
  const [isWomenBar, setIsWomenBar] = useState(false);

  const barWeight = isWomenBar ? (unit === 'kg' ? 15 : 35) : (unit === 'kg' ? 20 : 45);

  useEffect(() => {
    if (!quickCalc) {
      async function fetchData() {
        try {
          const user = await getUser();
          const movements = await getAllMovements();
          const movement = movements.find((item) => item.name === movementName);

          let userWeight = movement?.pr || 0;
          let userUnit = user?.preferences?.weightUnit || 'lbs';

          if (userUnit === 'kg') {
            userWeight = userWeight * LBS_TO_KG;
          }

          setWeight(userWeight);
          setUnit(userUnit);
          setPercentages(calculatePercentages(userWeight));

          user?.gender === 'F' ? setIsWomenBar(true) : setIsWomenBar(false);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }

      fetchData();
    }
  }, [movementName, quickCalc]);

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

  function toggleBarGender() {
    setIsWomenBar((prev) => !prev);
  }

  function handleWeightLoadPress(weight: string) {
    setSelectedWeight(Number(weight));
    setSelectedWeightModal(true); // Open weight load modal
  }

  function addCustomPercentage() {
    const customPercentage = parseFloat(customPercentageInput);
    if (isNaN(customPercentage) || customPercentage <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid percentage (greater than 0).');
      return;
    }
    const newPercentage = {
      label: `${customPercentage}%`,
      value: Math.round(weight * (customPercentage / 100)).toString(),
      isCustom: true, // Mark this percentage as custom
    };
    setPercentages([newPercentage, ...percentages]); // Add custom percentage to the top
    setCustomPercentageInput(''); // Clear the input
    setModalVisible(false); // Close the modal
  }

  function renderGrid(percentages: { label: string; value: string; isCustom: boolean }[], unit: 'kg' | 'lbs') {
    const itemsPerRow = 2;
    const rows = [];

    for (let i = 0; i < percentages.length; i += itemsPerRow) {
      const row = percentages.slice(i, i + itemsPerRow);
      rows.push(row);
    }

    return rows.map((row, rowIndex) => (
      <View key={rowIndex} style={styles.gridRow}>
        {row.map((item, colIndex) => {
          const isCustom = item.isCustom;
          const is100Percent = item.label === '100%';
          return (
            <TouchableOpacity
              key={colIndex}
              onPress={() => handleWeightLoadPress(item.value)}
              style={[
                styles.gridItem,
                isCustom && styles.customGridItem, // Highlight custom percentages
                is100Percent && styles.highlightedItem, // Highlight 100%
              ]}
            >
              <Text style={[styles.gridLabel]}>
                {item.label}
              </Text>
              <Text style={[styles.gridValue]}>
                {item.value} {unit}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    ));
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.title}>
          {quickCalc ? 'Quick Weight Calculator' : movementName}
        </Text>

        {/* Personal Record Row */}
        <View style={styles.personalRecordRow}>
          {quickCalc ? (
            <TextInput
              style={styles.weightInput}
              keyboardType="numeric"
              value={weight.toString()}
              onChangeText={handleWeightChange}
            />
          ) : (
            <Text style={styles.weightText}>{weight.toFixed(2)}</Text>
          )}
          <TouchableOpacity style={styles.unitGenderButton} onPress={toggleUnit}>
            <Text style={styles.unitButtonText}>{unit.toUpperCase()}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.unitGenderButton} onPress={toggleBarGender}>
            <FontAwesome5
              name={isWomenBar ? 'female' : 'male'}
              size={16}
              color={'#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        {/* Percentages Grid */}
        <ScrollView style={styles.gridContainer}>
          {renderGrid(percentages, unit)}
        </ScrollView>

        {/* Add Custom Percentage Floating Button */}
        <TouchableOpacity
          style={quickCalc ? styles.quickCalcAddButton : styles.addCustomButton}
          onPress={() => setModalVisible(true)}
        >
          <MaterialIcons name="add" size={28} color="white" />
        </TouchableOpacity>

        {/* Edit Floating Button */}
        {!quickCalc && (
          <TouchableOpacity style={styles.floatingButton} onPress={() => router.replace({ pathname: '/create-edit-movement', params: { name: movementName, pr: weight, } })}>
            <MaterialIcons name="edit" size={28} color="white" />
          </TouchableOpacity>
        )}

        {/* Modal for Adding Custom Percentage */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Custom Percentage</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter %"
                keyboardType="numeric"
                value={customPercentageInput}
                onChangeText={setCustomPercentageInput}
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={addCustomPercentage}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal for Weight Load Information */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={selectedWeightModal}
          onRequestClose={() => setSelectedWeightModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setSelectedWeightModal(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Load Information</Text>
              {selectedWeight !== null && (
                <>
                  <Text style={styles.modalText}>Bar Weight: {barWeight} {unit}</Text>
                  <Text style={styles.modalText}>
                    Weight per Side: {((selectedWeight - barWeight) / 2).toFixed(2)} {unit}
                  </Text>
                </>
              )}
            </View>
          </Pressable>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
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
    marginBottom: 20,
  },
  weightInput: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#6200EE',
    borderBottomWidth: 1,
    borderColor: '#CCCCCC',
    paddingBottom: 5,
    marginBottom: 10,
  },
  weightText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000000',
    marginRight: 10,
  },
  personalRecordRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  unitGenderButton: {
    height: 40,
    minWidth: 60,
    marginHorizontal: 5,
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: '#6200EE',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gridContainer: {
    marginVertical: 20,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  gridItem: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  highlightedItem: {
    backgroundColor: '#FFD700', // Gold color for 100%
  },
  customGridItem: {
    backgroundColor: '#D3D3D3', // Light gray for custom percentages
  },
  gridLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  gridValue: {
    fontSize: 16,
    color: '#6200EE',
  },
  addCustomButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#6200EE',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  quickCalcAddButton: {
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: '#6200EE',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
});
