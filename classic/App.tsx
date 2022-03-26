import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Platform,
  PermissionsAndroid,
  FlatList,
  Alert,
} from 'react-native';
import RNBluetoothClassic, {
  BluetoothDevice,
} from 'react-native-bluetooth-classic';

const App: React.FC = () => {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);

  const getBondedDevices = useCallback(async () => {
    try {
      const peripherals = await RNBluetoothClassic.getBondedDevices();

      if (peripherals.length < 1) {
        throw Error();
      }

      setDevices(peripherals);
    } catch (err) {
      Alert.alert(
        'Error',
        'Could not find any paired connections with your device',
      );

      console.log('Error:', err);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ).then(async (isConnected) => {
        if (!isConnected) {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
        }
      });
    }
  }, []);

  useEffect(() => {
    getBondedDevices();
  }, [getBondedDevices]);

  return (
    <View>
      <Text>React Native Bluetooth Classic</Text>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          return (
            <View>
              <Text>{item.name}</Text>
            </View>
          );
        }}
      />
    </View>
  );
};

export default App;
