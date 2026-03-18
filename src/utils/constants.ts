import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const appHorizontalPadding = width * 0.06;
export const appTopPadding = height * 0.03;

export const codeRegex = /^(?:AC|C3)(?:[:]?[0-9A-F]{2}){5,8}$/;

export const BLE_ERROR_MESSAGES = {
  ['001']: "Bluetooth deshabilitado. Habilita el Bluetooth y vuelve a intentarlo.",
  ['002']: "Permiso de Bluetooth o Ubicación denegados. Acepta los permisos de Bluetooth y Ubicación en tu dispositivo.",
  ['003']: "Bluetooth no soportado. Asegúrate de que tu dispositivo soporte Bluetooth.",
  ['004']: "Sistema no soportado. Asegúrate de que tu dispositivo soporte Bluetooth.",
};
