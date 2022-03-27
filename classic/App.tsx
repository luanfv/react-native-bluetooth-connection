import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Platform,
  PermissionsAndroid,
  FlatList,
  Alert,
  TouchableOpacity,
  Button,
  Modal,
  TextInput,
} from 'react-native';
import RNBluetoothClassic, {
  BluetoothDevice,
} from 'react-native-bluetooth-classic';

const App: React.FC = () => {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [deviceConnected, setDeviceConnected] = useState<
    BluetoothDevice | undefined
  >(undefined);
  const [request, setRequest] = useState('');
  const [isOpenModal, setIsOpenModal] = useState(false);

  const handleGetBondedDevices = useCallback(async () => {
    try {
      const peripherals = await RNBluetoothClassic.getBondedDevices();

      if (peripherals.length < 1) {
        throw Error();
      }

      setDevices(peripherals);
    } catch (err) {
      Alert.alert(
        'Error',
        'Could not find any paired connections with your device.',
      );

      console.log('handleGetBondedDevices error:', err);
    }
  }, []);

  const handleRequest = useCallback(
    async (data: string) => {
      try {
        if (deviceConnected) {
          const isConnected = await deviceConnected.isConnected();

          if (isConnected) {
            const response = await deviceConnected.write(data);

            if (response) {
              Alert.alert(
                'Success',
                'Your request has been sent successfully.',
              );

              return;
            }
          }
        }

        Alert.alert('Failure', 'Unable to send your request.');
      } catch (err) {
        Alert.alert('Error', 'There was an error trying to send your request.');

        console.log('handleRequest error:', err);
      }
    },
    [deviceConnected],
  );

  const handleDisconnect = useCallback(async () => {
    try {
      if (deviceConnected) {
        const isSuccess = await deviceConnected.disconnect();
        setDeviceConnected(undefined);

        if (isSuccess) {
          Alert.alert('Success', 'Device disconnected');

          return;
        }
      }

      Alert.alert('Failure', 'Unable to disconnect device');
    } catch (err) {
      console.log('handleDisconnect error:', err);

      Alert.alert('Error', 'Unable to disconnect device');
    }
  }, [deviceConnected]);

  const handleConnectToDevice = useCallback(
    async (id: string) => {
      try {
        if (deviceConnected) {
          await deviceConnected.disconnect();
          setDeviceConnected(undefined);
        }

        const device = await RNBluetoothClassic.connectToDevice(id, {
          connectorType: 'rfcomm',
          delimiter: '\n',
          charset: Platform.OS === 'ios' ? 1536 : 'utf-8',
        });

        setDeviceConnected(device);
      } catch (err) {
        Alert.alert('Error', `Unable to connect to device "${id}".`);

        console.log('handleConnectToDevice error:', err);
      }
    },
    [deviceConnected],
  );

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
    const listener = RNBluetoothClassic.onDeviceDisconnected(() => {
      setDeviceConnected(undefined);
    });

    return () => listener.remove();
  }, []);

  useEffect(() => {
    if (deviceConnected) {
      const listener = deviceConnected.onDataReceived((item) => {
        Alert.alert(`${item.device.name} data received`, item.data);
      });

      return () => listener.remove();
    }
  }, [deviceConnected]);

  return (
    <View>
      <Text>React Native Bluetooth Classic</Text>

      <Button title="Get Bonded Devices" onPress={handleGetBondedDevices} />

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          return (
            <TouchableOpacity
              onPress={() => {
                if (deviceConnected) {
                  setIsOpenModal(true);
                } else {
                  handleConnectToDevice(item.id);
                }
              }}
              activeOpacity={0.7}
              style={{
                padding: 20,
                marginVertical: 10,
                backgroundColor:
                  deviceConnected && item.id === deviceConnected.id
                    ? 'green'
                    : 'white',
              }}
            >
              <Text
                style={{
                  color:
                    deviceConnected && item.id === deviceConnected.id
                      ? 'white'
                      : 'black',
                }}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <Modal
        visible={isOpenModal}
        style={{ backgroundColor: 'red' }}
        transparent={true}
        animationType="fade"
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: 20,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ backgroundColor: '#fff', width: '100%', padding: 20 }}>
            <Text
              style={{
                fontWeight: 'bold',
                fontSize: 18,
                marginBottom: 40,
                color: '#000',
              }}
            >
              {deviceConnected?.name}
            </Text>

            <TextInput
              placeholder="Request"
              value={request}
              onChangeText={setRequest}
              style={{
                borderWidth: 1,
                borderColor: '#000',
                marginBottom: 20,
                padding: 10,
              }}
            />

            <Button
              title="write"
              onPress={() => {
                handleRequest(request);
              }}
            />

            <View
              style={{
                width: '100%',
                height: 1,
                backgroundColor: '#000',
                marginVertical: 20,
              }}
            />

            <Button title="disconnect" onPress={handleDisconnect} />

            <View
              style={{
                width: '100%',
                height: 1,
                backgroundColor: '#000',
                marginVertical: 20,
              }}
            />

            <Button
              title="Close modal"
              onPress={() => {
                setIsOpenModal(false);
                setRequest('');
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default App;
