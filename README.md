# react-native-bluetooth-connection

Nas comunicações via bluetooth entre aparelhos existem dois protocolos importantes com papéis diferentes, BLE e Bluetooth Classic, ambos com suas vantagens e desvantagens. A proposta deste repositório é ter uma breve descrição de cada um deles, com exemplos de como utilizá-los com React Native e as bibliotecas, [react-native-ble-manager](https://github.com/innoveit/react-native-ble-manager) e [react-native-bluetooth-classic](https://github.com/kenjdavidson/react-native-bluetooth-classic).

Para saber mais sobre a diferença entre BLE e Bluetooth Classic, [clique aqui](https://medium.com/@akash.kandhare/bluetooth-vs-bluetooth-low-energy-whats-the-difference-74687afcedb1#:~:text=Just%20like%20Bluetooth%2C%20BLE%20operates,Bluetooth%20which%20would%20take%20~100ms).

## BLE

Protocolo de comunicação bluetooth que possui um baixo custo de energia, muito utilizado por projetos embarcados, famoso IoT, `Internet of Things` ou em português `Internet das Coisas`. A comunicação com dispositivos que forem desenvolvidos com esse protocolo deve ser feita através de um [service](https://learn.adafruit.com/introduction-to-bluetooth-low-energy/gatt#services-640991-8) e [characteristic](https://learn.adafruit.com/introduction-to-bluetooth-low-energy/gatt#characteristics-640991-8), eles são os endereços das funcionalidades no dispositivo em questão. **Obs: as funcionalidades e serviços devem ser desenvolvidos pelo responsável do aparelho, não o desenvolvedor mobile.**

Antes de utilizar o BLE você precisa ficar ciente de que ele é feito para comunicações rápidas e leves, sua conexão é perdida depois de alguns segundos, então caso precise manter uma conexão por um período longo de tempo, talvez essa não seja a melhor opção.

Para saber mais sobre, [clique aqui](https://learn.adafruit.com/introduction-to-bluetooth-low-energy).

[Exemplo de código](https://github.com/luanfv/react-native-bluetooth-connection/tree/master/ble)
