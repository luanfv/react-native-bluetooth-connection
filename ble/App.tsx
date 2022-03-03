import React, {useState, useEffect, useCallback} from 'react';
import {
  SafeAreaView,
  StatusBar,
  NativeModules,
  NativeEventEmitter,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import Buffer from 'buffer';
import BleManager, {Peripheral} from 'react-native-ble-manager';

import {PeripheralList, CharacteristicList} from './src/components';

export interface IPeripheral extends Peripheral {
  isConnected?: boolean;
}

export interface IPeripheralInfo {
  id: string;
  characteristics: {
    service: string;
    characteristic: string;
    properties: string[];
  }[];
}

type IType = 'peripherals' | 'characteristics';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const App = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isReading, setIsReading] = useState(false);

  const [type, setType] = useState<IType>('peripherals');

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

            setType('characteristics');
          }
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
    }
  }, []);

  const handleRead = useCallback(
    async (id: string, service: string, characteristic: string) => {
      try {
        setIsReading(true);
        const peripheralData = await BleManager.retrieveServices(id);

        console.log(
          'Retrieved peripheral services:',
          JSON.stringify(peripheralData),
        );

        // READ THE BATTERY AT MI BAND 5
        const readData = await BleManager.read(id, service, characteristic);

        const buffer = Buffer.Buffer.from(readData); //https://github.com/feross/buffer#convert-arraybuffer-to-buffer

        Alert.alert(
          'Success',
          `Number: ${buffer.readUInt8(1)}\nString: ${buffer.toString()}\n`,
        );

        setIsReading(false);
      } catch (err) {
        await BleManager.connect(id);
        handleRead(id, service, characteristic);
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
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <SafeAreaView>
        <PeripheralList
          isScanning={isScanning}
          peripherals={peripherals}
          onPeripheral={handlePeripheral}
          onRetrieveConnected={handleRetrieveConnected}
          onStartScan={handleStartScan}
        />

        <CharacteristicList
          isOpenModal={type === 'characteristics'}
          isReading={isReading}
          peripheralsInfo={peripheralsInfo}
          onRead={handleRead}
          onClose={() => setType('peripherals')}
        />
      </SafeAreaView>
    </>
  );
};

export default App;
