import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  NativeEventEmitter,
  NativeModules,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import * as Location from "expo-location";
import BleManager, {
  BleScanMode,
  BleScanMatchMode,
  Peripheral,
  BleScanCallbackType,
} from "react-native-ble-manager";

import { colors } from "@/src/utils/colors";
import { ThemedText } from "@/src/components/ThemedText";
import { ThemedView } from "@/src/components/ThemedView";
import { AppBar, AppButton } from "@/src/components";
import { useDispatch, useSelector } from "react-redux";
import { PRODUCT_STATUS } from "@/src/utils/types";
import { selectProduct, setProduct } from "@/src/store/TagSlice";
import Toast from "react-native-toast-message";
import { BLE_ERROR_MESSAGES } from "@/src/utils/constants";
import { useFetch } from "@/src/hooks/useFetch";
import { selectAuth, selectUserLogged } from "@/src/store/AuthSlice";
import { requestPermissions } from "@/src/hooks/useBLE";
import { environment } from "../../environments/environment";
import useReport from "@/src/hooks/useReport";
import { BleDeviceDebugLogger } from "@/src/debug/bleDeviceLogger";

const { width, height } = Dimensions.get("window");
const SECONDS_TO_SCAN_FOR = 30;

const normalizeBleIdentifier = (value?: string | null) => {
  if (!value) {
    return "";
  }

  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
};

const bytesToHex = (bytes: number[]) => {
  return bytes
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
};

const extractManufacturerHex = (manufacturerData: unknown) => {
  if (!manufacturerData) {
    return "";
  }

  if (typeof manufacturerData === "string") {
    return normalizeBleIdentifier(manufacturerData);
  }

  if (typeof manufacturerData === "object") {
    const data = manufacturerData as { bytes?: unknown; data?: unknown };

    if (Array.isArray(data.bytes)) {
      const numericBytes = data.bytes.filter((value): value is number => typeof value === "number");
      if (numericBytes.length > 0) {
        return bytesToHex(numericBytes);
      }
    }

    if (typeof data.data === "string") {
      return normalizeBleIdentifier(data.data);
    }
  }

  return "";
};

const getPeripheralIdentifiers = (peripheral: Peripheral) => {
  const identifiers = new Set<string>();
  const advertising = peripheral.advertising as { localName?: string; manufacturerData?: unknown } | undefined;

  const normalizedId = normalizeBleIdentifier(peripheral.id);
  if (normalizedId) {
    identifiers.add(normalizedId);
  }

  const normalizedName = normalizeBleIdentifier(peripheral.name);
  if (normalizedName) {
    identifiers.add(normalizedName);
  }

  const normalizedLocalName = normalizeBleIdentifier(advertising?.localName);
  if (normalizedLocalName) {
    identifiers.add(normalizedLocalName);
  }

  const manufacturerHex = extractManufacturerHex(advertising?.manufacturerData);
  if (manufacturerHex) {
    identifiers.add(manufacturerHex);
  }

  return Array.from(identifiers);
};

export default function FindTagScreen() {
  const fetch = useFetch();
  const dispatch = useDispatch();
  const { onProductFound } = useReport({ setLoading: () => {}, onSuccess: () => {} });

  const BleManagerModule = NativeModules.BleManager;
  const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

  const auth = useSelector(selectAuth);
  const user = useSelector(selectUserLogged);
  const product = useSelector(selectProduct);

  const [isScanning, setIsScanning] = useState(true);
  const [bleError, setBleError] = useState<{ errorCode: string; message: string } | null>(null);
  const [peripherals, setPeripherals] = useState<Map<string, Peripheral>>(new Map());
  const hasHandledScanResultRef = useRef(false);
  const bleDebugLoggerRef = useRef<BleDeviceDebugLogger | null>(null);

  const notifyProductLostWereFinded = async (productInfo: {
    userEmail: string;
    userName: string;
  }) => {
    let location = await Location.getCurrentPositionAsync({});
    const linkLocation = `https://www.google.com/maps?q=${location?.coords.latitude},${location?.coords.longitude}&z=22`;
    try {
      const body = {
        asunto: "Hola!, te estamos buscando",
        correo: productInfo.userEmail,
        nombre: productInfo.userName,
        tipoenvio: environment.company,
        mensaje: "Alguien realizó una lectura de Ble",
        link: linkLocation,
      };

      const options = {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.accessToken}`,
          body: JSON.stringify(body),
        },
      };
      await fetch(`/sendmail`, options);
    } catch (error: unknown) {
      const errorMessage = error as Error;
      Toast.show({
        text1: errorMessage.message,
        type: "error",
      });
    }
  };

  const onUpdateOtherProductLocation = async (
    productInfo: {
      id: string;
    },
    peripheral: Peripheral,
  ) => {
    let location = await Location.getCurrentPositionAsync({});
    try {
      const body = {
        id: productInfo.id,
        longitude: location?.coords.longitude,
        latitude: location?.coords.latitude,
        rssi: peripheral?.rssi,
      };

      const options = {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.accessToken}`,
        },
        body: JSON.stringify(body),
      };
      await fetch(`/products/location`, options);
    } catch (error: unknown) {
      const errorMessage = error as Error;
      Toast.show({
        text1: errorMessage.message,
        type: "error",
      });
    }
  };

  const consultProductBySerial = async (serial: string) => {
    try {
      const options = {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.accessToken}`,
        },
      };
      const response: {
        ok: boolean;
        json: () => Promise<{
          success: boolean;
          data: { estado: string };
          estado: number;
        }>;
      } = await fetch(`/products/serial/${serial}`, options);

      const responsePayload = await response.json();
      const responseData = responsePayload.data;
      if (response.ok) {
        if (Array.isArray(responseData)) {
          return responseData[0];
        }
      }
    } catch (error: unknown) {
      const errorMessage = error as Error;
      Toast.show({
        text1: errorMessage.message,
        type: "error",
      });
    }
  };

  const startScan = async () => {
    try {
      if (Platform.OS === "android") {
        await BleManager.enableBluetooth();
      }
      setBleError(null);
      setPeripherals(new Map());
      setIsScanning(true);
      hasHandledScanResultRef.current = false;

      try {
        bleDebugLoggerRef.current = await BleDeviceDebugLogger.create({
          scanSeconds: SECONDS_TO_SCAN_FOR,
          targetSerial: product?.serial as string | undefined,
        });
        console.debug("[BLE debug] log file created:", bleDebugLoggerRef.current.getFileUri());
      } catch (error) {
        console.error("[BLE debug] could not create log file:", error);
      }

      console.debug("[startScan] starting scan...");
      if (Platform.OS === "android") {
        await BleManager.scan([], SECONDS_TO_SCAN_FOR, true, {
          matchMode: BleScanMatchMode.Sticky,
          scanMode: BleScanMode.LowLatency,
          callbackType: BleScanCallbackType.AllMatches,
        });
      } else {
        await BleManager.scan([], SECONDS_TO_SCAN_FOR, true);
      }
      console.debug("[startScan] scan promise returned successfully.");
    } catch (error) {
      console.error("[startScan] ble scan returned in error", error);
      setBleError({ errorCode: "001", message: "El bluetooth no pudo ser activado" });
    }
  };

  const handleDiscoverPeripheral = (peripheral: Peripheral) => {
    bleDebugLoggerRef.current?.recordPeripheral(peripheral).catch((error) => {
      console.error("[BLE debug] could not record discovered peripheral:", error);
    });

    if (!peripheral.name) {
      peripheral.name = "NO NAME";
    }
    setPeripherals((map) => {
      const nextMap = new Map(map);
      const identifiers = getPeripheralIdentifiers(peripheral);

      if (identifiers.length === 0) {
        const fallbackIdentifier = normalizeBleIdentifier(peripheral.id);
        if (fallbackIdentifier) {
          nextMap.set(fallbackIdentifier, peripheral);
        }
      } else {
        for (const identifier of identifiers) {
          nextMap.set(identifier, peripheral);
        }
      }

      return nextMap;
    });
  };

  const handleStopScan = () => {
    console.debug("[handleStopScan] scan is stopped.");
    setIsScanning(false);
    bleDebugLoggerRef.current?.finish("BleManagerStopScan").catch((error) => {
      console.error("[BLE debug] could not finish log file:", error);
    });
  };

  useEffect(() => {
    let isMounted = true;
    setPeripherals(new Map());

    const listeners = [
      bleManagerEmitter.addListener("BleManagerDidUpdateState", ({ state }) => {
        console.debug("[BLE state]", state);
      }),
      bleManagerEmitter.addListener("BleManagerDiscoverPeripheral", handleDiscoverPeripheral),
      bleManagerEmitter.addListener("BleManagerStopScan", handleStopScan),
    ];

    const initializeAndStartScanning = async () => {
      try {
        await BleManager.start({ showAlert: false });
        await BleManager.checkState();

        if (!isMounted) {
          return;
        }

        const permissionStatus = await requestPermissions();
        if (permissionStatus) {
          await startScan();
        }
      } catch (error) {
        console.error("[BLE init] initialization failed", error);
      }
    };

    initializeAndStartScanning();

    return () => {
      isMounted = false;
      console.debug("[app] main component unmounting. Removing listeners...");
      for (const listener of listeners) {
        listener.remove();
      }
      BleManager.stopScan()
        .then(() => {
          console.debug("Scanning stopped successfully");
          return bleDebugLoggerRef.current?.finish("component-unmount");
        })
        .catch((error) => {
          console.error("Failed to stop scanning:", error);
        });
    };
  }, []);

  useEffect(() => {
    const handleStopScanning = async () => {
      if (isScanning) {
        return;
      }
      if (hasHandledScanResultRef.current) {
        return;
      }
      hasHandledScanResultRef.current = true;

      if (product) {
        if (peripherals.size > 0) {
          const findedSerials: string[] = [];
          const discoveredPeripheralsBySerial = new Map<string, Peripheral>();
          const normalizedTargetSerial = normalizeBleIdentifier(product?.serial as string);
          const uniquePeripherals = Array.from(
            new Map(Array.from(peripherals.values()).map((peripheral) => [peripheral.id, peripheral])).values(),
          );

          uniquePeripherals.forEach((peripheral) => {
            const identifiers = getPeripheralIdentifiers(peripheral);
            const fallbackIdentifier = normalizeBleIdentifier(peripheral.id);
            const primaryIdentifier = identifiers[0] || fallbackIdentifier;

            for (const identifier of identifiers) {
              discoveredPeripheralsBySerial.set(identifier, peripheral);
            }

            if (primaryIdentifier) {
              discoveredPeripheralsBySerial.set(primaryIdentifier, peripheral);
            }

            if (primaryIdentifier && primaryIdentifier !== normalizedTargetSerial) {
              findedSerials.push(primaryIdentifier);
            }
          });
          const device = discoveredPeripheralsBySerial.get(normalizedTargetSerial);

          // TODO: This can be optimized moving the logic to the backend to check the products in the database and update the location of the products that are found.
          for await (const serial of findedSerials) {
            const product = await consultProductBySerial(serial);
            if (product) {
              if (product.tipo_estado_id === PRODUCT_STATUS.LOST && product.email !== user?.email) {
                await notifyProductLostWereFinded({
                  userEmail: product.email,
                  userName: product.nombre,
                });
              }
              const peripheral = discoveredPeripheralsBySerial.get(
                normalizeBleIdentifier(product.serial as string),
              );
              if (peripheral) {
                await onUpdateOtherProductLocation(product, peripheral);
              }
            }
          }

          if (device) {
            let location = await Location.getCurrentPositionAsync({});
            const longitude = location?.coords.longitude;
            const latitude = location?.coords.latitude;
            const lastTimeLocated = new Date().toISOString();
            const updatedProduct = {
              ...product,
              location: JSON.stringify({ lat: latitude, long: longitude }),
              lastTimeLocated,
              rssi:
                discoveredPeripheralsBySerial.get(product.serial as string)?.rssi ??
                product.rssi ??
                null,
            };
            dispatch(setProduct(updatedProduct));
            await onProductFound(
              product,
              discoveredPeripheralsBySerial.get(normalizeBleIdentifier(product.serial as string)),
              longitude,
              latitude,
            );
            dispatch(
              setProduct({
                ...updatedProduct,
                lastTimeLocated: new Date().toISOString(),
              }),
            );
            Toast.show({
              text1: "Maleta encontrada",
              text2: "La maleta se encuentra en las proximidades",
              type: "info",
            });
            router.replace("/screens/tag/productLocation");
            return;
          }
        }
        Toast.show({
          text1: "Maleta no encontrada",
          text2: "La maleta no se encuentra en las proximidades",
          type: "error",
        });
        router.replace("/screens/tag/productLost");
      }
    };

    handleStopScanning().catch((error) => {
      console.error(error);
    });
  }, [peripherals, isScanning]);

  if (bleError) {
    return (
      <ThemedView style={{ flex: 1 }}>
        <AppBar
          title="Buscando tu Maleta"
          onBackPress={async () => {
            router.back();
          }}
        />
        <View style={styles.processingContainer}>
          <Image
            source={require("@/src/assets/images/lost-suitcase.png")}
            style={styles.imageStyle}
          />
          <ThemedText style={styles.modalInstructions}>
            {BLE_ERROR_MESSAGES[bleError.errorCode as keyof typeof BLE_ERROR_MESSAGES]}
          </ThemedText>
          <View style={styles.nextButtonContainer}>
            <AppButton
              title="Intentar de nuevo"
              style={{ backgroundColor: colors.secondary }}
              labelStyle={{ color: colors.primary }}
              onPress={startScan}
            />
            <AppButton
              title={"Ir a la página principal"}
              onPress={() => {
                dispatch(setProduct(undefined));
                router.replace("/screens/tag/(tabs)/");
              }}
              style={{ backgroundColor: "transparent", marginTop: height * 0.02 }}
              labelStyle={{ color: colors.primary }}
            />
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <AppBar
        title="Buscando tu Maleta"
        onBackPress={async () => {
          router.back();
        }}
      />
      <View style={styles.processingContainer}>
        <Image
          source={require("@/src/assets/images/suitcase-with-background-2.png")}
          style={styles.imageStyle}
        />
        <ThemedText style={styles.modalInstructions}>
          Unos segundos, estamos localizando tu maleta en las proximidades...
        </ThemedText>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  modalInstructions: {
    color: colors.primary,
    fontSize: 16,
    textAlign: "center",
    marginTop: -100,
    fontWeight: "bold",
  },
  processingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: width * 0.15,
    paddingBottom: 100,
  },
  imageStyle: {
    width: width,
    borderRadius: 100,
  },
  nextButtonContainer: {
    marginTop: height * 0.04,
    paddingBottom: height * 0.05,
    gap: 10,
    width: "100%",
  },
});
