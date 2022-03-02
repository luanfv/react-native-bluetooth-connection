import React, {useState, useEffect, useCallback} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  NativeModules,
  NativeEventEmitter,
  Button,
  Platform,
  PermissionsAndroid,
  FlatList,
  TouchableHighlight,
} from 'react-native';
import Buffer from 'buffer';

import BleManager, {Peripheral} from 'react-native-ble-manager';

interface IPeripheral extends Peripheral {
  isConnected?: boolean;
}

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const App = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [peripherals, setPeripherals] = useState<IPeripheral[]>([]);

  const handleStartScan = useCallback(() => {
    if (!isScanning) {
      BleManager.scan([], 5, true).then(() => {
        setIsScanning(true);
      });
    }
  }, [isScanning]);

  const handleRetrieveConnected = useCallback(() => {
    BleManager.getConnectedPeripherals([]).then((results) => {
      const peripheralsUpdated = results.map((item) => {
        const updated = {...item, isConnected: true};
        return updated;
      });

      setPeripherals(peripheralsUpdated);
    });
  }, []);

  const handlePeripheral = useCallback(
    async (peripheral: IPeripheral) => {
      if (peripheral) {
        if (peripheral.isConnected) {
          try {
            await BleManager.disconnect(peripheral.id);
            handleStartScan();
          } finally {
            return;
          }
        }

        try {
          await BleManager.connect(peripheral.id);

          setPeripherals((oldState) => {
            const peripheralConnected = {
              ...peripheral,
              isConnected: true,
            };
            const peripheralsDisconnected = oldState.filter((item) => {
              if (item.id !== peripheral.id) {
                return item;
              }
            });

            return [peripheralConnected, ...peripheralsDisconnected];
          });
        } catch (err) {
          console.log('Connect error:', err);

          return;
        }

        try {
          const peripheralData = await BleManager.retrieveServices(
            peripheral.id,
          );

          console.log(
            'Retrieved peripheral services:',
            JSON.stringify(peripheralData),
          );

          // READ THE BATTERY AT MI BAND 5
          const readData = await BleManager.read(
            String(peripheral.id),
            'fee0',
            '00000006-0000-3512-2118-0009af100700',
          );

          const buffer = Buffer.Buffer.from(readData); //https://github.com/feross/buffer#convert-arraybuffer-to-buffer
          const sensorData = buffer.readUInt8(1);
          console.log('Read: ' + sensorData);
        } catch (err) {
          console.log('Read error:', err);
        }
      }
    },
    [handleStartScan],
  );

  useEffect(() => {
    BleManager.start({showAlert: false});

    bleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      (peripheral: IPeripheral) => {
        console.log('Got ble peripheral', peripheral);

        if (!peripheral.name) {
          peripheral.name = 'NO NAME';
        }

        setPeripherals((oldState) => {
          const idFound = oldState.find(({id}) => id === peripheral.id);

          if (!idFound) {
            return [...oldState, peripheral];
          }

          const newState = oldState.map((state) => {
            if (state.id === peripheral.id) {
              return peripheral;
            }

            return state;
          });

          return newState;
        });
      },
    );

    bleManagerEmitter.addListener('BleManagerStopScan', () =>
      setIsScanning(false),
    );

    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ).then(async (result) => {
        if (!result) {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
        }
      });
    }

    return () => {
      bleManagerEmitter.removeAllListeners('BleManagerDiscoverPeripheral');
      bleManagerEmitter.removeAllListeners('BleManagerStopScan');
    };
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <View style={styles.body}>
            <View style={styles.buttonContainer}>
              <Button
                title={'Scan Bluetooth (' + (isScanning ? 'on' : 'off') + ')'}
                onPress={() => !isScanning && handleStartScan()}
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title="Retrieve connected peripherals"
                onPress={() => handleRetrieveConnected()}
              />
            </View>

            {peripherals.length === 0 && (
              <View style={styles.voidList}>
                <Text style={styles.voidListText}>No peripherals</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <FlatList
          data={peripherals}
          keyExtractor={(item) => item.id}
          renderItem={({item}) => {
            return (
              <TouchableHighlight onPress={() => handlePeripheral(item)}>
                <View
                  style={
                    item.isConnected
                      ? styles.backgroundGreen
                      : styles.backgroundWhite
                  }>
                  <Text
                    style={[
                      styles.peripheralName,
                      item.isConnected && styles.colorWhite,
                    ]}>
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.peripheralRssi,
                      item.isConnected && styles.colorWhite,
                    ]}>
                    RSSI: {item.rssi}
                  </Text>
                  <Text
                    style={[
                      styles.peripheralId,
                      item.isConnected && styles.colorWhite,
                    ]}>
                    {item.id}
                  </Text>
                </View>
              </TouchableHighlight>
            );
          }}
        />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#eee',
  },
  body: {
    backgroundColor: '#fff',
  },
  buttonContainer: {
    margin: 10,
  },
  voidList: {
    flex: 1,
    margin: 20,
  },
  voidListText: {
    textAlign: 'center',
  },
  peripheralName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333333',
    padding: 10,
  },
  peripheralRssi: {
    fontSize: 10,
    textAlign: 'center',
    color: '#333333',
    padding: 2,
  },
  peripheralId: {
    fontSize: 8,
    textAlign: 'center',
    color: '#333333',
    padding: 2,
    paddingBottom: 20,
  },
  colorWhite: {
    color: '#fff',
  },
  backgroundWhite: {
    backgroundColor: '#fff',
  },
  backgroundGreen: {
    backgroundColor: '#04b404',
  },
});

export default App;
