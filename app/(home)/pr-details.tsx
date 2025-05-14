import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
import { useTheme } from '@react-navigation/native';
import { KG_TO_LBS, LBS_TO_KG } from '@/constants/Units';
import { getUser } from '@/utils/user.utils';
import { getAllMovements } from '@/utils/movements.utils';
import { User } from '@/types/user.type';
import { CustomTheme } from '@/constants/Colors';

function calculatePercentages(weight: number) {
  const percentages = [1.25, 1.2, 1.15, 1.1, 1.05, 1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4];
  return percentages.map((percentage) => ({
    label: `${(percentage * 100).toFixed(0)}%`,
    value: Math.round(weight * percentage).toString(),
    isCustom: false, // Default percentages are not custom
  }));
}

export default function PRPage() {
  const { colors } = useTheme() as CustomTheme;
  const router = useRouter();
  const { name: movementName, pr: initialWeight, quickCalc = false } = useLocalSearchParams();
  const [weight, setWeight] = useState<number>(Number(initialWeight) || 0);
  const [unit, setUnit] = useState<User['preferences']['weightUnit']>('lb');
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

          let userWeight = movement?.data[0]?.weight || 0;
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

  function handleWeightChange(input: string) {
    const parsedWeight = parseFloat(input) || 0;
    setWeight(parsedWeight);
  }

  function toggleUnit() {
    if (unit === 'kg') {
      const convertedWeight = weight * KG_TO_LBS;
      setUnit('lb');
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

  function renderGrid(percentages: { label: string; value: string; isCustom: boolean }[], unit: User['preferences']['weightUnit']) {
    const itemsPerRow = 2;
    const rows = [];

    for (let i = 0; i < percentages.length; i += itemsPerRow) {
      const row = percentages.slice(i, i + itemsPerRow);
      rows.push(row);
    }

    return rows.map((row, rowIndex) => (
      <View key={rowIndex} style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 }}>
        {row.map((item, colIndex) => {
          const isCustom = item.isCustom;
          const is100Percent = item.label === '100%';
          return (
            <TouchableOpacity
              key={colIndex}
              onPress={() => handleWeightLoadPress(item.value)}
              style={{
                flex: 1,
                marginHorizontal: 5,
                paddingVertical: 10,
                paddingHorizontal: 15,
                backgroundColor: isCustom ? colors.accent : is100Percent ? colors.highlight : colors.surface,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: colors.borders,
                elevation: 3,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.primaryText }}>
                {item.label}
              </Text>
              <Text style={{ fontSize: 16, color: colors.secondaryText }}>
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
      <View style={{ flex: 1, padding: 20, backgroundColor: colors.background }}>
        {/* Title */}
        <Text style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: colors.primary }}>
          {quickCalc ? 'Quick Weight Calculator' : movementName}
        </Text>

        {/* Personal Record Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 10 }}>
          {quickCalc ? (
            <TextInput
              style={{
                fontSize: 28,
                fontWeight: 'bold',
                textAlign: 'center',
                color: colors.primary,
                borderBottomWidth: 1,
                borderColor: colors.borders,
                paddingBottom: 5,
                marginBottom: 10,
              }}
              keyboardType="numeric"
              value={weight.toString()}
              onChangeText={handleWeightChange}
            />
          ) : (
            <Text style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: colors.primaryText, marginRight: 10 }}>
              {weight.toFixed(2)}
            </Text>
          )}
          <TouchableOpacity
            style={{
              height: 40,
              minWidth: 60,
              marginHorizontal: 5,
              paddingHorizontal: 15,
              paddingVertical: 5,
              backgroundColor: colors.primary,
              borderRadius: 5,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={toggleUnit}
          >
            <Text style={{ color: colors.surface, fontSize: 16, fontWeight: 'bold' }}>{unit.toUpperCase()}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              height: 40,
              minWidth: 60,
              marginHorizontal: 5,
              paddingHorizontal: 15,
              paddingVertical: 5,
              backgroundColor: colors.primary,
              borderRadius: 5,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={toggleBarGender}
          >
            <FontAwesome5
              name={isWomenBar ? 'female' : 'male'}
              size={16}
              color={colors.surface}
            />
          </TouchableOpacity>
        </View>

        {/* Percentages Grid */}
        <ScrollView style={{ marginVertical: 20 }}>
          {renderGrid(percentages, unit)}
        </ScrollView>

        {/* Add Custom Percentage Floating Button */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: quickCalc ? 20 : 100,
            right: 20,
            backgroundColor: colors.primary,
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 5,
          }}
          onPress={() => setModalVisible(true)}
        >
          <MaterialIcons name="add" size={28} color={colors.surface} />
        </TouchableOpacity>

        {/* Edit Floating Button */}
        {!quickCalc && (
          <TouchableOpacity
            style={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              backgroundColor: colors.primary,
              width: 56,
              height: 56,
              borderRadius: 28,
              justifyContent: 'center',
              alignItems: 'center',
              elevation: 5,
            }}
            onPress={() => router.replace({ pathname: '/create-edit-movement', params: { name: movementName, pr: weight } })}
          >
            <MaterialIcons name="edit" size={28} color={colors.surface} />
          </TouchableOpacity>
        )}

        {/* Modal for Adding Custom Percentage */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <View style={{
              width: 300,
              padding: 20,
              backgroundColor: colors.surface,
              borderRadius: 10,
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: colors.primaryText }}>Add Custom Percentage</Text>
              <TextInput
                style={{
                  width: '100%',
                  borderWidth: 1,
                  borderColor: colors.borders,
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 16,
                  marginBottom: 15,
                  color: colors.primaryText,
                }}
                placeholder="Enter %"
                placeholderTextColor={colors.secondaryText}
                keyboardType="numeric"
                value={customPercentageInput}
                onChangeText={setCustomPercentageInput}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: '100%',
                }}
                onPress={addCustomPercentage}
              >
                <Text style={{ color: colors.surface, fontWeight: 'bold' }}>Add</Text>
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
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setSelectedWeightModal(false)}
          >
            <View style={{
              width: 300,
              padding: 20,
              backgroundColor: colors.surface,
              borderRadius: 10,
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: colors.primaryText }}>Load Information</Text>
              {selectedWeight !== null && (
                <>
                  <Text style={{ fontSize: 16, marginBottom: 10, color: colors.secondaryText }}>
                    Bar Weight: {barWeight} {unit}
                  </Text>
                  <Text style={{ fontSize: 16, marginBottom: 10, color: colors.secondaryText }}>
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
