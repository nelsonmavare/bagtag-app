import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import type { Peripheral } from "react-native-ble-manager";

type BleDebugDeviceEvent = {
  discoveredAt: string;
  peripheral: unknown;
};

type BleDebugLogState = {
  session: {
    startedAt: string;
    stoppedAt?: string;
    reason?: string;
    platform: typeof Platform.OS;
    scanSeconds: number;
    targetSerial?: string;
  };
  totals: {
    discoveryEvents: number;
    uniqueDevices: number;
  };
  discoveryEvents: BleDebugDeviceEvent[];
  uniqueDevices: unknown[];
};

export type BleDebugLogFile = {
  uri: string;
  name: string;
  modificationTime?: number;
  size?: number;
};

const DEBUG_DIRECTORY_NAME = "debug";
const DEBUG_FILE_PREFIX = "ble-devices-";
const DEBUG_FILE_EXTENSION = ".txt";

const getDebugDirectoryUri = () => {
  if (!FileSystem.documentDirectory) {
    throw new Error("No writable document directory is available for BLE debug logs.");
  }

  return `${FileSystem.documentDirectory}${DEBUG_DIRECTORY_NAME}/`;
};

export const listBleDebugLogFiles = async (): Promise<BleDebugLogFile[]> => {
  const debugDirectoryUri = getDebugDirectoryUri();
  const fileNames = await FileSystem.readDirectoryAsync(debugDirectoryUri).catch(() => []);
  const debugFileNames = fileNames.filter(
    (fileName) => fileName.startsWith(DEBUG_FILE_PREFIX) && fileName.endsWith(DEBUG_FILE_EXTENSION),
  );

  const debugFiles = await Promise.all(
    debugFileNames.map(async (name): Promise<BleDebugLogFile | null> => {
      const uri = `${debugDirectoryUri}${name}`;
      const info = await FileSystem.getInfoAsync(uri);

      if (!info.exists) {
        return null;
      }

      return {
        uri,
        name,
        modificationTime: "modificationTime" in info ? info.modificationTime : undefined,
        size: "size" in info ? info.size : undefined,
      };
    }),
  );

  return debugFiles
    .filter((file): file is BleDebugLogFile => file !== null)
    .sort((left, right) => {
      const leftTime = left.modificationTime ?? 0;
      const rightTime = right.modificationTime ?? 0;

      if (leftTime === rightTime) {
        return right.name.localeCompare(left.name);
      }

      return rightTime - leftTime;
    });
};

export const getLatestBleDebugLogFile = async () => {
  const debugFiles = await listBleDebugLogFiles();
  return debugFiles[0] ?? null;
};

export const readBleDebugLogFile = async (logFile: BleDebugLogFile) => {
  return FileSystem.readAsStringAsync(logFile.uri);
};

const safeStringify = (value: unknown) => {
  const seen = new WeakSet();

  return JSON.stringify(
    value,
    (_key, item) => {
      if (typeof item === "object" && item !== null) {
        if (seen.has(item)) {
          return "[Circular]";
        }
        seen.add(item);
      }

      return item;
    },
    2,
  );
};

const toSerializableObject = (value: unknown) => {
  try {
    return JSON.parse(safeStringify(value));
  } catch {
    return String(value);
  }
};

export class BleDeviceDebugLogger {
  private readonly fileUri: string;
  private readonly discoveryEvents: BleDebugDeviceEvent[] = [];
  private readonly uniqueDevicesById = new Map<string, unknown>();
  private readonly session: BleDebugLogState["session"];
  private finished = false;

  private constructor(fileUri: string, scanSeconds: number, targetSerial?: string) {
    this.fileUri = fileUri;
    this.session = {
      startedAt: new Date().toISOString(),
      platform: Platform.OS,
      scanSeconds,
      targetSerial,
    };
  }

  static async create(options: { scanSeconds: number; targetSerial?: string }) {
    const debugDirectoryUri = getDebugDirectoryUri();
    await FileSystem.makeDirectoryAsync(debugDirectoryUri, { intermediates: true }).catch(() => {});

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileUri = `${debugDirectoryUri}${DEBUG_FILE_PREFIX}${timestamp}${DEBUG_FILE_EXTENSION}`;
    const logger = new BleDeviceDebugLogger(fileUri, options.scanSeconds, options.targetSerial);

    await logger.write();
    return logger;
  }

  getFileUri() {
    return this.fileUri;
  }

  async recordPeripheral(peripheral: Peripheral) {
    if (this.finished) {
      return;
    }

    const event = {
      discoveredAt: new Date().toISOString(),
      peripheral: toSerializableObject(peripheral),
    };

    this.discoveryEvents.push(event);
    this.uniqueDevicesById.set(peripheral.id || `unknown-${this.discoveryEvents.length}`, event.peripheral);

    await this.write();
  }

  async finish(reason: string) {
    if (this.finished) {
      return;
    }

    this.finished = true;
    this.session.stoppedAt = new Date().toISOString();
    this.session.reason = reason;

    await this.write();
  }

  private async write() {
    const logState: BleDebugLogState = {
      session: this.session,
      totals: {
        discoveryEvents: this.discoveryEvents.length,
        uniqueDevices: this.uniqueDevicesById.size,
      },
      discoveryEvents: this.discoveryEvents,
      uniqueDevices: Array.from(this.uniqueDevicesById.values()),
    };

    await FileSystem.writeAsStringAsync(this.fileUri, `${safeStringify(logState)}\n`);
  }
}
