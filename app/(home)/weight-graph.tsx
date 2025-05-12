import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useLocalSearchParams } from 'expo-router';
import { getAllMovements } from '@/utils/movements.utils';
import { Movement, MovementData } from '@/types/movements.type';
import { getUser } from '@/utils/user.utils';

export default function WeightGraphScreen() {
  const { name: movementName } = useLocalSearchParams();
  const [movementData, setMovementData] = useState<MovementData[]>([]);
  const [unit, setUnit] = useState<'lb' | 'kg'>('lb');

  useEffect(function() {
    async function fetchData() {
      const [storedMovements, user] = await Promise.all([getAllMovements(), getUser()]);
      setUnit(user?.preferences?.weightUnit || 'lb');

      const movement = storedMovements.find(function(m: Movement) {
        return m.name === movementName;
      });

      if (movement) {
        setMovementData(movement.data);
      }
    }

    fetchData();
  }, [movementName]);

  // Prepare data for the graph
  const chartData = movementData.map(function(item) {
    return {
      value: item.weight,
      label: new Date(item.date).toLocaleDateString(),
    };
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        Weight Progress for {movementName}
      </Text>

      <View style={{ flex: 1, alignItems: 'center' }}>
        {movementData.length > 0 ? (
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 150}
            height={220}
            yAxisLabelSuffix={` ${unit}`}
            isAnimated
            animationDuration={500}
            adjustToWidth
            yAxisTextStyle={{ color: '#6200EE', fontSize: 12, }}
            xAxisLabelTextStyle={{ color: '#6200EE', fontSize: 12 }}
            yAxisColor="#6200EE"
            xAxisColor="#6200EE"
            showVerticalLines={true}
            hideDataPoints={false}
            dataPointsColor="#6200EE"
            dataPointsRadius={4}
            thickness={2}
            startFillColor="#6200EE"
            endFillColor="#6200EE"
            startOpacity={0.3}
            endOpacity={0.1}
            noOfSections={4} // Number of y-axis sections
          />
        ) : (
          <Text style={styles.noDataText}>No data available to display</Text>
        )}
      </View>
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
    textAlign: 'center',
    marginBottom: 20,
    color: '#6200EE',
  },
  noDataText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#B0BEC5',
  },
});

