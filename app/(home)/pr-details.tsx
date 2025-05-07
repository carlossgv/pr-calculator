import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button, useTheme } from 'react-native-paper';
import { KG_TO_LBS, LBS_TO_KG } from '@/constants/Units';
import { getUser } from '@/utils/user.utils';
import { getAllMovements } from '@/utils/movements.utils';
import { User } from '@/types/user.type';

function calculatePercentages(weight: number) {
  const percentages = [1.25, 1.2, 1.15, 1.1, 1.05, 1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4];
  return percentages.map((percentage) => ({
    label: `${(percentage * 100).toFixed(0)}%`,
    value: Math.round(weight * percentage).toString(),
    isCustom: false,
  }));
}

export default function PRPage() {
  const router = useRouter();
  const { name: movementName, pr: initialWeight, quickCalc = false } = useLocalSearchParams();
  const theme = useTheme();

  const [weight, setWeight] = useState<number>(Number(initialWeight) || 0);
  const [unit, setUnit] = useState<User['preferences']['weightUnit']>('lb');
  const [percentages, setPercentages] = useState(calculatePercentages(weight));
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWeightModal, setSelectedWeightModal] = useState(false);
  const [customPercentageInput, setCustomPercentageInput] = useState<string>('');
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
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
          let userUnit = user?.preferences?.weightUnit || 'lb';

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

  const handleWeightChange = (input: string) => {
    const parsedWeight = parseFloat(input) || 0;
    setWeight(parsedWeight);
  };

  const toggleUnit = () => {
    if (unit === 'kg') {
      const convertedWeight = weight * KG_TO_LBS;
      setUnit('lb');
      setWeight(parseFloat(convertedWeight.toFixed(2)));
    } else {
      const convertedWeight = weight * LBS_TO_KG;
      setUnit('kg');
      setWeight(parseFloat(convertedWeight.toFixed(2)));
    }
  };

  const toggleBarGender = () => {
    setIsWomenBar((prev) => !prev);
  };

  const handleWeightLoadPress = (weight: string) => {
    setSelectedWeight(Number(weight));
    setSelectedWeightModal(true);
  };

  const addCustomPercentage = () => {
    const customPercentage = parseFloat(customPercentageInput);
    if (isNaN(customPercentage) || customPercentage <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid percentage (greater than 0).');
      return;
    }
    const newPercentage = {
      label: `${customPercentage}%`,
      value: Math.round(weight * (customPercentage / 100)).toString(),
      isCustom: true,
    };
    setPercentages([newPercentage, ...percentages]);
    setCustomPercentageInput('');
    setModalVisible(false);
  };

  const renderGrid = (items: { label: string; value: string; isCustom: boolean }[]) => {
    const itemsPerRow = 2;
    const rows = [];

    for (let i = 0; i < items.length; i += itemsPerRow) {
      const row = items.slice(i, i + itemsPerRow);
      rows.push(row);
    }

    return rows.map((row, rowIndex) => (
      <View key={rowIndex} style={styles.gridRow}>
        {row.map((item, colIndex) => {
          const is100Percent = item.label === '100%';
          return (
            <Button
              key={colIndex}
              mode="outlined"
              onPress={() => handleWeightLoadPress(item.value)}
              style={[
                styles.gridItem,
                { backgroundColor: theme.colors.secondaryContainer },
                item.isCustom && { backgroundColor: theme.colors.secondaryContainer },
                is100Percent && { backgroundColor: '#FFBD33' },
              ]}
              contentStyle={styles.buttonContent}
            >
              <Text style={[styles.gridLabel, { color: theme.colors.onSecondaryContainer }]}>{item.label} / </Text>
              <Text style={[styles.gridValue, { color: theme.colors.onSecondaryContainer }]}>{item.value} {unit}</Text>
            </Button>
          );
        })}
      </View>
    ));
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text variant='headlineLarge' style={[styles.title, { color: theme.colors.primary }]}>
          {quickCalc ? 'Quick Weight Calculator' : movementName}
        </Text>

        <View style={styles.personalRecordRow}>
          {quickCalc ? (
            <TextInput
              style={[styles.weightInput, { color: theme.colors.primary }]}
              keyboardType="numeric"
              value={weight.toString()}
              onChangeText={handleWeightChange}
            />
          ) : (
            <Text variant='headlineLarge' style={[styles.weightText, { color: theme.colors.onSurface }]}>{weight.toFixed(2)}</Text>
          )}
          <Button style={[styles.unitButton]} onPress={toggleUnit} mode='contained'>
            {unit.toUpperCase()}
          </Button>
          <Button onPress={toggleBarGender} mode='contained'>
            <FontAwesome5 name={isWomenBar ? 'female' : 'male'} size={16} />
          </Button>
        </View>

        <ScrollView style={styles.gridContainer}>
          {renderGrid(percentages)}
        </ScrollView>

        <Button
          style={[styles.addCustomButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <MaterialIcons name="add" size={28} color="white" />
        </Button>

        {!quickCalc && (
          <Button
            style={[styles.floatingButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.replace({ pathname: '/create-edit-movement', params: { name: movementName, pr: weight } })}
          >
            <MaterialIcons name="edit" size={28} color="white" />
          </Button>
        )}

        <Modal transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Add Custom Percentage</Text>
              <TextInput
                style={[styles.modalInput, { color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
                placeholder="Enter %"
                keyboardType="numeric"
                value={customPercentageInput}
                onChangeText={setCustomPercentageInput}
              />
              <Button style={[styles.modalButton, { backgroundColor: theme.colors.primary }]} onPress={addCustomPercentage}>
                <Text style={styles.modalButtonText}>Add</Text>
              </Button>
            </View>
          </View>
        </Modal>

        <Modal transparent visible={selectedWeightModal} onRequestClose={() => setSelectedWeightModal(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setSelectedWeightModal(false)}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Load Information</Text>
              {selectedWeight !== null && (
                <>
                  <Text style={[styles.modalText, { color: theme.colors.onSurface }]}>Bar Weight: {barWeight} {unit}</Text>
                  <Text style={[styles.modalText, { color: theme.colors.onSurface }]}>
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
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  weightInput: {
    fontWeight: 'bold',
    textAlign: 'center',
    borderBottomWidth: 1,
    paddingBottom: 5,
    marginBottom: 10,
  },
  weightText: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginRight: 5,
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
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitButton: {
    marginHorizontal: 5,
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
    // paddingHorizontal: 15,
    // borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'column', // Stack children vertically
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  gridLabel: {
    // fontSize: 16,
    fontWeight: 'bold',
  },
  gridValue: {
    // fontSize: 16,
  },
  addCustomButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
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
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  modalButton: {
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
