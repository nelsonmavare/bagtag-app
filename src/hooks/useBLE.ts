import { Alert, Linking, PermissionsAndroid, Platform } from "react-native";

const requestAndroid31Permissions = async () => {
  const bluetoothScanPermission = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    {
      title: "Permiso para escanear con Bluetooth",
      message: "BagTag requiere permiso para escanear con Bluetooth para funcionar correctamente.",
      buttonPositive: "OK",
    }
  );
  const bluetoothConnectPermission = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    {
      title: "Permiso de conexión con Bluetooth",
      message: "BagTag requiere permiso de conexión con Bluetooth para funcionar correctamente.",
      buttonPositive: "OK",
    }
  );
  const fineLocationPermission = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: "Permiso de ubicación",
      message: "BagTag requiere permiso de ubicación para funcionar correctamente.",
      buttonPositive: "OK",
    }
  );
  if (bluetoothConnectPermission !== "granted" || bluetoothScanPermission !== "granted") {
    Alert.alert(
      "Permisos necesarios",
      "BagTag requiere permiso para escanear con Bluetooth, para conectarse con Bluetooth y para acceder a la ubicación del dispositivo. Por favor, otorgue los permisos necesarios para continuar.",
      [
        {
          text: "Ir a configuración",
          onPress: () => {
            Linking.openSettings();
          },
        },
        {
          text: "Cancelar",
        },
      ]
    );
  }
  if (fineLocationPermission !== "granted") {
    Alert.alert(
      "Permisos necesarios",
      "BagTag requiere permiso de ubicación para funcionar correctamente. Por favor, otorgue el permiso necesario para continuar.",
      [
        {
          text: "Ir a configuración",
          onPress: () => {
            Linking.openSettings();
          },
        },
        {
          text: "Cancelar",
        },
      ]
    );
  }
  return (
    bluetoothScanPermission === "granted" &&
    bluetoothConnectPermission === "granted" &&
    fineLocationPermission === "granted"
  );
};

export const requestPermissions = async (): Promise<boolean> => {
  if (Platform.OS === "android") {
    if ((Platform.Version ?? -1) < 31) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Permiso de ubicación",
          message: "BagTag requiere permiso de ubicación para funcionar correctamente.",
          buttonPositive: "OK",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const isAndroid31PermissionsGranted = await requestAndroid31Permissions();
      return isAndroid31PermissionsGranted;
    }
  } else {
    return true;
  }
};