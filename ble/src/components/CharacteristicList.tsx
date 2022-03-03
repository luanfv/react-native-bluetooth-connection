import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Button,
  FlatList,
  TouchableHighlight,
} from 'react-native';
import {IPeripheralInfo} from '../../App';

interface ICharacteristicList {
  isReading: boolean;
  peripheralsInfo: IPeripheralInfo | undefined;
  onClose: () => void;
  onRead: (id: string, service: string, characteristic: string) => void;
}

const CharacteristicList: React.FC<ICharacteristicList> = ({
  isReading,
  peripheralsInfo,
  onClose,
  onRead,
}) => {
  return (
    <View style={styles.body}>
      {peripheralsInfo && (
        <FlatList
          data={peripheralsInfo.characteristics}
          keyExtractor={(_, index) => String(index)}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={() => {
            return (
              <>
                <View style={styles.buttonContainer}>
                  <Button title="back to home" onPress={onClose} />
                </View>

                {!peripheralsInfo ||
                  (peripheralsInfo.characteristics.length === 0 && (
                    <View style={styles.voidList}>
                      <Text style={styles.voidListText}>
                        No characteristics
                      </Text>
                    </View>
                  ))}

                <View style={styles.separator} />
              </>
            );
          }}
          renderItem={({item}) => {
            return (
              <TouchableHighlight
                onPress={() =>
                  !isReading &&
                  onRead(peripheralsInfo.id, item.service, item.characteristic)
                }>
                <View style={styles.backgroundWhite}>
                  <Text style={styles.textLarge}>SERVICE: {item.service}</Text>
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
          ListFooterComponent={() => <View style={styles.marginBottom} />}
        />
      )}
    </View>
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
  backgroundWhite: {
    backgroundColor: '#fff',
  },
  separator: {
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  marginBottom: {
    marginBottom: 40,
  },
});

export {CharacteristicList};
