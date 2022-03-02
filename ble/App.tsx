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
  Alert,
} from 'react-native';
import Buffer from 'buffer';
import BleManager, {Peripheral} from 'react-native-ble-manager';
import Modal from 'react-native-modal';

interface IPeripheral extends Peripheral {
  isConnected?: boolean;
}

interface IPeripheralInfo {
  id: string;
  characteristics: {
    service: string;
    characteristic: string;
    properties: string[];
  }[];
}

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const App = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [peripherals, setPeripherals] = useState<IPeripheral[]>([]);
  const [peripheralsInfo, setPeripheralsInfo] = useState<
    IPeripheralInfo | undefined
  >(undefined);

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

  const handlePeripheral = useCallback(async (peripheral: IPeripheral) => {
    if (peripheral) {
      if (peripheral.isConnected) {
        try {
          const peripheralData = await BleManager.retrieveServices(
            peripheral.id,
          );

          const characteristics = peripheralData.characteristics?.map(
            (item) => {
              return {
                service: item.service,
                characteristic: item.characteristic,
                properties: Object.keys(item.properties),
              };
            },
          );

          if (Array.isArray(characteristics)) {
            setPeripheralsInfo({
              id: peripheralData.id,
              characteristics: characteristics,
            });
            setIsOpenModal(true);
          }

          // console.log(
          //   'Retrieved peripheral services:',
          //   JSON.stringify(peripheralData.characteristics),
          // );

          // await BleManager.disconnect(peripheral.id);
          // handleStartScan();
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

      // try {
      //   const peripheralData = await BleManager.retrieveServices(peripheral.id);

      //   console.log(
      //     'Retrieved peripheral services:',
      //     JSON.stringify(peripheralData),
      //   );

      //   // READ THE BATTERY AT MI BAND 5
      //   const readData = await BleManager.read(
      //     String(peripheral.id),
      //     'fee0',
      //     '00000006-0000-3512-2118-0009af100700',
      //   );

      //   const buffer = Buffer.Buffer.from(readData); //https://github.com/feross/buffer#convert-arraybuffer-to-buffer
      //   const sensorData = buffer.readUInt8(1);
      //   console.log('Read: ' + sensorData);
      // } catch (err) {
      //   console.log('Read error:', err);
      // }
    }
  }, []);

  const handleRead = useCallback(
    async (id: string, service: string, characteristic: string) => {
      try {
        const peripheralData = await BleManager.retrieveServices(id);

        console.log(
          'Retrieved peripheral services:',
          JSON.stringify(peripheralData),
        );

        // READ THE BATTERY AT MI BAND 5
        const readData = await BleManager.read(id, service, characteristic);

        const buffer = Buffer.Buffer.from(readData); //https://github.com/feross/buffer#convert-arraybuffer-to-buffer
        const sensorData = buffer.readUInt8(1);
        console.log('Read: ' + sensorData);

        Alert.alert('Success', String(sensorData));
      } catch (err) {
        console.log('Read error:', err);

        Alert.alert('Error', String(err));
      }
    },
    [],
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
                      styles.textLarge,
                      item.isConnected && styles.colorWhite,
                    ]}>
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.textMedium,
                      item.isConnected && styles.colorWhite,
                    ]}>
                    RSSI: {item.rssi}
                  </Text>
                  <Text
                    style={[
                      styles.textSmall,
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

      <Modal
        isVisible={isOpenModal}
        onBackButtonPress={() => setIsOpenModal(false)}>
        <Button title="close" onPress={() => setIsOpenModal(false)} />

        <View style={{flex: 1, backgroundColor: '#fff', paddingHorizontal: 10}}>
          {peripheralsInfo && (
            <FlatList
              data={peripheralsInfo.characteristics}
              keyExtractor={(_, index) => String(index)}
              ItemSeparatorComponent={() => (
                <View
                  style={{
                    marginVertical: 12,
                    borderWidth: 1,
                    borderColor: '#eee',
                  }}
                />
              )}
              renderItem={({item}) => {
                return (
                  <TouchableHighlight
                    onPress={() =>
                      handleRead(
                        peripheralsInfo.id,
                        item.service,
                        item.characteristic,
                      )
                    }>
                    <View style={styles.backgroundWhite}>
                      <Text style={styles.textLarge}>
                        SERVICE: {item.service}
                      </Text>
                      <Text style={styles.textLarge}>
                        CHARACTERISTIC: {item.characteristic}
                      </Text>
                      <Text style={styles.textMedium}>
                        PROPERTIES: {`${item.properties}`}
                      </Text>
                    </View>
                  </TouchableHighlight>
                );
              }}
            />
          )}
        </View>
      </Modal>
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
  textLarge: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333333',
    padding: 10,
  },
  textMedium: {
    fontSize: 10,
    textAlign: 'center',
    color: '#333333',
    padding: 2,
  },
  textSmall: {
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
