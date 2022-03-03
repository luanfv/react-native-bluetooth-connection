import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Button,
  FlatList,
  TouchableHighlight,
} from 'react-native';
import Modal from 'react-native-modal';
import {IPeripheralInfo} from '../../App';

interface ICharacteristicList {
  isOpenModal: boolean;
  isReading: boolean;
  peripheralsInfo: IPeripheralInfo | undefined;
  onClose: () => void;
  onRead: (id: string, service: string, characteristic: string) => void;
}

const CharacteristicList: React.FC<ICharacteristicList> = ({
  isOpenModal,
  isReading,
  peripheralsInfo,
  onClose,
  onRead,
}) => {
  return (
    <Modal isVisible={isOpenModal} onBackButtonPress={onClose}>
      <Button title="close" onPress={onClose} />

      <View style={styles.modal}>
        {peripheralsInfo && (
          <FlatList
            data={peripheralsInfo.characteristics}
            keyExtractor={(_, index) => String(index)}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({item}) => {
              return (
                <TouchableHighlight
                  onPress={() =>
                    !isReading &&
                    onRead(
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
  );
};

const styles = StyleSheet.create({
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
  modal: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
  },
  separator: {
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
});

export {CharacteristicList};
