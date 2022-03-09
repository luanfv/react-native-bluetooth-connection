import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Button,
  FlatList,
  TouchableHighlight,
} from 'react-native';
import { IPeripheral } from '../../App';

interface IPeripheralList {
  isScanning: boolean;
  peripherals: IPeripheral[];
  onStartScan: () => void;
  onRetrieveConnected: () => void;
  onPeripheral: (peripheral: IPeripheral) => void;
}

const PeripheralList: React.FC<IPeripheralList> = ({
  isScanning,
  peripherals,
  onStartScan,
  onRetrieveConnected,
  onPeripheral,
}) => {
  return (
    <>
      <FlatList
        data={peripherals}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => {
          return (
            <View style={styles.body}>
              <View style={styles.buttonContainer}>
                <Button
                  title={'Scan Bluetooth (' + (isScanning ? 'on' : 'off') + ')'}
                  onPress={() => !isScanning && onStartScan()}
                />
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  title="Retrieve connected peripherals"
                  onPress={() => onRetrieveConnected()}
                />
              </View>

              {peripherals.length === 0 && (
                <View style={styles.voidList}>
                  <Text style={styles.voidListText}>No peripherals</Text>
                </View>
              )}
            </View>
          );
        }}
        renderItem={({ item }) => {
          return (
            <TouchableHighlight onPress={() => onPeripheral(item)}>
              <View
                style={
                  item.isConnected
                    ? styles.backgroundGreen
                    : styles.backgroundWhite
                }
              >
                <Text
                  style={[
                    styles.textLarge,
                    item.isConnected && styles.colorWhite,
                  ]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.textMedium,
                    item.isConnected && styles.colorWhite,
                  ]}
                >
                  RSSI: {item.rssi}
                </Text>
                <Text
                  style={[
                    styles.textSmall,
                    item.isConnected && styles.colorWhite,
                  ]}
                >
                  {item.id}
                </Text>
              </View>
            </TouchableHighlight>
          );
        }}
        ListFooterComponent={() => <View style={styles.marginBottom} />}
      />
    </>
  );
};

const styles = StyleSheet.create({
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
  marginBottom: {
    marginBottom: 40,
  },
});

export { PeripheralList };
