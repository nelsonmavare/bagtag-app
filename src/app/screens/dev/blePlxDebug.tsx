import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { BleManager, Device, State } from "react-native-ble-plx";

import { AppBar, AppButton } from "@/src/components";
import { ThemedText } from "@/src/components/ThemedText";
import { ThemedView } from "@/src/components/ThemedView";
import { colors } from "@/src/utils/colors";
import { appHorizontalPadding, appTopPadding } from "@/src/utils/constants";
import { requestPermissions } from "@/src/hooks/useBLE";

const SCAN_DURATION_MS = 30_000;
const MAX_LOG_LINES = 250;

const stringifySafe = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const formatDevice = (device: Device) => ({
  id: device.id,
  name: device.name,
  localName: device.localName,
  rssi: device.rssi,
  manufacturerData: device.manufacturerData,
  serviceData: device.serviceData,
  serviceUUIDs: device.serviceUUIDs,
  txPowerLevel: device.txPowerLevel,
  isConnectable: (device as { isConnectable?: boolean | null }).isConnectable ?? null,
});

export default function BlePlxDebugScreen() {
  const managerRef = useRef<BleManager | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenDevicesRef = useRef(new Set<string>());
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const uniqueDevices = useMemo(() => seenDevicesRef.current.size, [logs]);

  const pushLog = (line: string) => {
    const formattedLine = `${new Date().toISOString()} ${line}`;
    setLogs((previousLogs) => [formattedLine, ...previousLogs].slice(0, MAX_LOG_LINES));
  };

  useEffect(() => {
    const manager = new BleManager();
    managerRef.current = manager;

    const subscription = manager.onStateChange((state) => {
      pushLog(`[state] ${state}`);
      console.log("[ble-plx][state]", state);
    }, true);

    return () => {
      subscription.remove();
      manager.stopDeviceScan();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      manager.destroy();
      managerRef.current = null;
    };
  }, []);

  const stopScan = () => {
    managerRef.current?.stopDeviceScan();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsScanning(false);
    pushLog("[scan] stopped manually");
  };

  const startScan = async () => {
    const manager = managerRef.current;
    if (!manager) {
      pushLog("[scan] manager unavailable");
      return;
    }

    if (Platform.OS === "android") {
      const granted = await requestPermissions();
      if (!granted) {
        pushLog("[scan] android permissions denied");
        return;
      }
    }

    const state = await manager.state();
    pushLog(`[scan] requested, state=${state}`);
    if (state !== State.PoweredOn) {
      pushLog("[scan] bluetooth is not powered on");
      return;
    }

    seenDevicesRef.current.clear();
    manager.stopDeviceScan();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setIsScanning(true);
    pushLog(`[scan] starting for ${SCAN_DURATION_MS / 1000}s`);
    console.log("[ble-plx][scan][start]", { platform: Platform.OS, durationMs: SCAN_DURATION_MS });

    manager.startDeviceScan(null, { allowDuplicates: true }, (error, device) => {
      if (error) {
        pushLog(`[scan][error] ${error.errorCode} ${error.message}`);
        console.log("[ble-plx][scan][error]", error);
        return;
      }

      if (!device?.id) {
        return;
      }

      const firstSeen = !seenDevicesRef.current.has(device.id);
      if (firstSeen) {
        seenDevicesRef.current.add(device.id);
        const payload = formatDevice(device);
        pushLog(`[device] ${stringifySafe(payload)}`);
        console.log("[ble-plx][device]", payload);
      }
    });

    timerRef.current = setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
      pushLog(`[scan] completed, unique devices=${seenDevicesRef.current.size}`);
      console.log("[ble-plx][scan][summary]", {
        platform: Platform.OS,
        uniqueDevices: seenDevicesRef.current.size,
      });
    }, SCAN_DURATION_MS);
  };

  const clearLogs = () => {
    setLogs([]);
    pushLog("[logs] cleared");
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <AppBar title="BLE-PLX Debug" />
      <View style={styles.container}>
        <ThemedText style={styles.statusText}>
          Estado: {isScanning ? "Escaneando" : "En espera"} | Unicos: {uniqueDevices}
        </ThemedText>
        <View style={styles.actions}>
          <AppButton title="Iniciar scan (30s)" onPress={startScan} />
          <AppButton
            title="Detener scan"
            onPress={stopScan}
            style={{ backgroundColor: colors.secondary }}
            labelStyle={{ color: colors.primary }}
          />
          <AppButton
            title="Limpiar logs"
            onPress={clearLogs}
            style={{ backgroundColor: "transparent" }}
            labelStyle={{ color: colors.primary }}
          />
        </View>
        <ScrollView style={styles.logsContainer} contentContainerStyle={styles.logsContentContainer}>
          {logs.map((line, index) => (
            <ThemedText key={`${index}-${line}`} selectable style={styles.logLine}>
              {line}
            </ThemedText>
          ))}
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
    marginBottom: 12,
  },
  actions: {
    gap: 10,
    marginBottom: 12,
  },
  logsContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
  },
  logsContentContainer: {
    padding: 12,
    gap: 8,
  },
  logLine: {
    color: colors.primary,
    fontSize: 11,
    fontFamily: "monospace",
  },
});
