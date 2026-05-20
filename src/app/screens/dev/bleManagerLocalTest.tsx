import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  NativeEventEmitter,
  NativeModules,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import BleManager, {
  BleScanCallbackType,
  BleScanMatchMode,
  BleScanMode,
  type Peripheral,
} from "react-native-ble-manager";
import * as Clipboard from "expo-clipboard";

import { AppBar, AppButton } from "@/src/components";
import { ThemedText } from "@/src/components/ThemedText";
import { ThemedView } from "@/src/components/ThemedView";
import { requestPermissions } from "@/src/hooks/useBLE";
import {
  getPeripheralIdentifiers,
  getPeripheralTagSerials,
  normalizeBleIdentifier,
  peripheralMatchesSerial,
} from "@/src/utils/bleIdentifiers";
import { appHorizontalPadding, appTopPadding } from "@/src/utils/constants";
import { colors } from "@/src/utils/colors";

const SCAN_SECONDS = 30;
const MAX_LOG_LINES = 180;
const MAX_RAW_HISTORY = 3;
const MAX_RAW_VISIBLE_CHARS = 1200;
const TARGET_SERIALS = ["C300003E67DC", "C300003E67DA", "C300003E67D0"].map(
  normalizeBleIdentifier,
);

type DiscoveredDevice = {
  key: string;
  id: string;
  name: string;
  rssi: number | null;
  identifiers: string[];
  tagSerials: string[];
  matchedSerials: string[];
  rawAdvertisingHistory: string[];
  discoveryEvents: number;
  lastSeenAt: string;
};

const safeStringify = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const truncateRawValue = (value: string) => {
  if (value.length <= MAX_RAW_VISIBLE_CHARS) {
    return value;
  }

  return `${value.slice(0, MAX_RAW_VISIBLE_CHARS)}... [truncado]`;
};

const mergeUnique = (...values: string[][]) => {
  return Array.from(new Set(values.flat().filter(Boolean)));
};

const mergeRawHistory = (previousHistory: string[] | undefined, nextRawAdvertising: string) => {
  const history = previousHistory ?? [];

  if (!nextRawAdvertising || history[0] === nextRawAdvertising) {
    return history;
  }

  return [nextRawAdvertising, ...history.filter((rawValue) => rawValue !== nextRawAdvertising)].slice(
    0,
    MAX_RAW_HISTORY,
  );
};

const formatDeviceDebugLog = (device: DiscoveredDevice) => {
  return [
    `name: ${device.name}`,
    `id: ${device.id}`,
    `rssi: ${device.rssi ?? "N/A"}`,
    `tags: ${device.tagSerials.join(", ") || "N/A"}`,
    `matches: ${device.matchedSerials.join(", ") || "N/A"}`,
    `identifiers: ${device.identifiers.join(" | ") || "N/A"}`,
    `events: ${device.discoveryEvents}`,
    `lastSeenAt: ${device.lastSeenAt}`,
    "rawAdvertisingHistory:",
    ...device.rawAdvertisingHistory.map((rawAdvertising, index) => `#${index + 1}\n${rawAdvertising}`),
  ].join("\n");
};

export default function BleManagerLocalTestScreen() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const devicesRef = useRef(new Map<string, DiscoveredDevice>());
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Map<string, DiscoveredDevice>>(new Map());
  const [logs, setLogs] = useState<string[]>([]);
  const [bleState, setBleState] = useState("unknown");

  const matchedSerials = useMemo(() => {
    const found = new Set<string>();

    for (const device of devices.values()) {
      device.matchedSerials.forEach((serial) => found.add(serial));
    }

    return Array.from(found);
  }, [devices]);

  const appendLog = useCallback((message: string) => {
    const line = `${new Date().toLocaleTimeString()} ${message}`;
    setLogs((previousLogs) => [line, ...previousLogs].slice(0, MAX_LOG_LINES));
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopScan = useCallback(
    async (reason = "scan detenido") => {
      clearTimer();
      setIsScanning(false);

      try {
        await BleManager.stopScan();
        appendLog(`[stop] ${reason}`);
      } catch (error) {
        appendLog(`[stop] ${reason} (${String(error)})`);
      }
    },
    [appendLog, clearTimer],
  );

  const handleDiscoverPeripheral = useCallback(
    (peripheral: Peripheral) => {
      const identifiers = getPeripheralIdentifiers(peripheral);
      const tagSerials = getPeripheralTagSerials(peripheral);
      const currentMatchedSerials: string[] = TARGET_SERIALS.filter((serial) =>
        peripheralMatchesSerial(peripheral, serial),
      );
      const key = peripheral.id || identifiers[0] || `unknown-${Date.now()}`;
      const previousDevice = devicesRef.current.get(key);
      const rawAdvertising = safeStringify(peripheral.advertising ?? {});
      const mergedMatchedSerials = mergeUnique(
        previousDevice?.matchedSerials ?? [],
        currentMatchedSerials,
      );
      const device: DiscoveredDevice = {
        key,
        id: peripheral.id || "N/A",
        name: peripheral.name || previousDevice?.name || "NO NAME",
        rssi: peripheral.rssi ?? null,
        identifiers: mergeUnique(previousDevice?.identifiers ?? [], identifiers),
        tagSerials: mergeUnique(previousDevice?.tagSerials ?? [], tagSerials),
        matchedSerials: mergedMatchedSerials,
        rawAdvertisingHistory: mergeRawHistory(previousDevice?.rawAdvertisingHistory, rawAdvertising),
        discoveryEvents: (previousDevice?.discoveryEvents ?? 0) + 1,
        lastSeenAt: new Date().toLocaleTimeString(),
      };

      devicesRef.current.set(key, device);
      setDevices(new Map(devicesRef.current));

      const newMatchedSerials = currentMatchedSerials.filter(
        (serial) => !(previousDevice?.matchedSerials.includes(serial) ?? false),
      );
      if (!previousDevice || newMatchedSerials.length > 0) {
        const prefix =
          newMatchedSerials.length > 0 ? `[MATCH ${newMatchedSerials.join(", ")}]` : "[device]";
        appendLog(
          `${prefix} name=${device.name} id=${device.id} rssi=${device.rssi ?? "N/A"} tags=${
            device.tagSerials.join(",") || "N/A"
          }`,
        );
      }
    },
    [appendLog],
  );

  const handleStopScan = useCallback(() => {
    clearTimer();
    setIsScanning(false);
    appendLog(`[event] scan finalizado. devices=${devicesRef.current.size}`);
  }, [appendLog, clearTimer]);

  const startScan = useCallback(async () => {
    clearTimer();
    devicesRef.current.clear();
    setDevices(new Map());
    setLogs([]);

    try {
      await BleManager.start({ showAlert: false });
      await BleManager.checkState();

      const granted = await requestPermissions();
      if (!granted) {
        appendLog("[scan] permisos denegados");
        return;
      }

      if (Platform.OS === "android") {
        await BleManager.enableBluetooth();
      }

      setIsScanning(true);
      appendLog(`[scan] iniciado ${SCAN_SECONDS}s, targets=${TARGET_SERIALS.join(", ")}`);

      if (Platform.OS === "android") {
        await BleManager.scan([], SCAN_SECONDS, true, {
          matchMode: BleScanMatchMode.Sticky,
          scanMode: BleScanMode.LowLatency,
          callbackType: BleScanCallbackType.AllMatches,
        });
      } else {
        await BleManager.scan([], SCAN_SECONDS, true);
      }

      timerRef.current = setTimeout(() => {
        setIsScanning(false);
        appendLog(`[timeout] terminó ventana local. devices=${devicesRef.current.size}`);
      }, (SCAN_SECONDS + 2) * 1000);
    } catch (error) {
      setIsScanning(false);
      appendLog(`[scan][error] ${String(error)}`);
    }
  }, [appendLog, clearTimer]);

  const clearResults = useCallback(() => {
    devicesRef.current.clear();
    setDevices(new Map());
    setLogs([]);
  }, []);

  const copyDeviceLog = useCallback(
    async (device: DiscoveredDevice) => {
      try {
        await Clipboard.setStringAsync(formatDeviceDebugLog(device));
        appendLog(
          `[copy] log copiado para ${device.name} ${
            device.matchedSerials.join(",") || device.id
          }`,
        );
      } catch (error) {
        Alert.alert("Test BLE local", `No se pudo copiar el log: ${String(error)}`);
      }
    },
    [appendLog],
  );

  useEffect(() => {
    const bleManagerEmitter = new NativeEventEmitter(NativeModules.BleManager);
    const listeners = [
      bleManagerEmitter.addListener("BleManagerDidUpdateState", ({ state }) => {
        setBleState(state);
        appendLog(`[state] ${state}`);
      }),
      bleManagerEmitter.addListener("BleManagerDiscoverPeripheral", handleDiscoverPeripheral),
      bleManagerEmitter.addListener("BleManagerStopScan", handleStopScan),
    ];

    BleManager.start({ showAlert: false })
      .then(() => BleManager.checkState())
      .catch((error) => {
        appendLog(`[init][error] ${String(error)}`);
      });

    return () => {
      clearTimer();
      listeners.forEach((listener) => listener.remove());
      BleManager.stopScan().catch(() => {});
    };
  }, [appendLog, clearTimer, handleDiscoverPeripheral, handleStopScan]);

  return (
    <ThemedView style={{ flex: 1 }}>
      <AppBar title="Test BLE local" />
      <View style={styles.container}>
        <ThemedText style={styles.statusText}>
          Estado BLE: {bleState} | Scan: {isScanning ? "activo" : "detenido"}
        </ThemedText>
        <ThemedText style={styles.targetText}>Targets: {TARGET_SERIALS.join(" / ")}</ThemedText>
        <ThemedText style={styles.matchText}>
          Matches: {matchedSerials.length > 0 ? matchedSerials.join(" / ") : "ninguno"}
        </ThemedText>

        <View style={styles.actions}>
          <AppButton title="Escanear 30s" onPress={startScan} disabled={isScanning} />
          <AppButton
            title="Detener scan"
            onPress={() => stopScan("detenido manualmente")}
            disabled={!isScanning}
            style={{ backgroundColor: colors.secondary }}
            labelStyle={{ color: colors.primary }}
          />
          <AppButton
            title="Limpiar"
            onPress={clearResults}
            style={{ backgroundColor: "transparent" }}
            labelStyle={{ color: colors.primary }}
          />
        </View>

        <ScrollView style={styles.devicesContainer} contentContainerStyle={styles.devicesContent}>
          {Array.from(devices.values()).map((device) => {
            const isMatch = device.matchedSerials.length > 0;

            return (
              <View
                key={device.key}
                style={[styles.deviceRow, isMatch ? styles.deviceRowMatch : null]}
              >
                <ThemedText style={styles.deviceTitle}>
                  {isMatch ? "MATCH " : ""}
                  {device.name} | RSSI {device.rssi ?? "N/A"}
                </ThemedText>
                <ThemedText selectable style={styles.deviceMeta}>
                  ID: {device.id}
                </ThemedText>
                <ThemedText selectable style={styles.deviceMeta}>
                  Tags: {device.tagSerials.join(", ") || "N/A"}
                </ThemedText>
                <ThemedText selectable style={styles.deviceMeta}>
                  IDs: {device.identifiers.slice(0, 8).join(" | ") || "N/A"}
                </ThemedText>
                <ThemedText style={styles.deviceMeta}>Ultimo: {device.lastSeenAt}</ThemedText>
                <ThemedText style={styles.deviceMeta}>Eventos: {device.discoveryEvents}</ThemedText>
                <AppButton
                  title="Copiar log"
                  onPress={() => copyDeviceLog(device)}
                  style={styles.copyButton}
                  labelStyle={styles.copyButtonLabel}
                />
                <ThemedText style={styles.rawTitle}>Raw advertising:</ThemedText>
                {device.rawAdvertisingHistory.map((rawAdvertising, rawIndex) => (
                  <ThemedText
                    selectable
                    key={`${device.key}-raw-${rawIndex}`}
                    style={styles.rawText}
                  >
                    #{rawIndex + 1} {truncateRawValue(rawAdvertising)}
                  </ThemedText>
                ))}
              </View>
            );
          })}
        </ScrollView>

        <ScrollView style={styles.logsContainer} contentContainerStyle={styles.logsContent}>
          {logs.map((line, index) => (
            <ThemedText selectable key={`${index}-${line}`} style={styles.logLine}>
              {line}
            </ThemedText>
          ))}
          {logs.length === 0 && (
            <ThemedText style={styles.emptyText}>
              Toca Escanear 30s y acercá los tags. Esta pantalla no llama al backend.
            </ThemedText>
          )}
        </ScrollView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: appHorizontalPadding,
    paddingTop: appTopPadding,
    paddingBottom: 16,
  },
  statusText: {
    color: colors.primary,
    fontWeight: "bold",
    marginBottom: 6,
  },
  targetText: {
    color: colors.primary,
    fontSize: 12,
    marginBottom: 4,
  },
  matchText: {
    color: colors.primary,
    fontWeight: "bold",
    marginBottom: 10,
  },
  actions: {
    gap: 8,
    marginBottom: 10,
  },
  devicesContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d7e8ed",
    borderRadius: 8,
    marginBottom: 10,
  },
  devicesContent: {
    padding: 8,
    gap: 8,
  },
  deviceRow: {
    borderWidth: 1,
    borderColor: "#d7e8ed",
    borderRadius: 8,
    padding: 8,
  },
  deviceRowMatch: {
    borderColor: colors.primary,
    backgroundColor: "#e7f7f3",
  },
  deviceTitle: {
    color: colors.primary,
    fontWeight: "bold",
    marginBottom: 4,
  },
  deviceMeta: {
    color: colors.primary,
    fontSize: 12,
  },
  copyButton: {
    height: 36,
    marginTop: 8,
    backgroundColor: colors.primary,
  },
  copyButtonLabel: {
    fontSize: 13,
  },
  rawTitle: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 6,
  },
  rawText: {
    color: colors.primary,
    fontSize: 10,
    marginTop: 4,
  },
  logsContainer: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: "#d7e8ed",
    borderRadius: 8,
  },
  logsContent: {
    padding: 8,
  },
  logLine: {
    color: colors.primary,
    fontSize: 11,
    marginBottom: 4,
  },
  emptyText: {
    color: colors.primary,
    opacity: 0.7,
    fontSize: 12,
  },
});
