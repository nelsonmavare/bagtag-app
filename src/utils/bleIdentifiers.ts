import type { Peripheral } from "react-native-ble-manager";

const TAG_SERIAL_EXACT_PATTERN = /^(?:AC|C3)(?:[0-9A-F]{2}){5,8}$/;
const TAG_SERIAL_PREFIXES = ["AC", "C3"];
const TAG_SERIAL_LENGTHS = [12, 14, 16, 18];

export const normalizeBleIdentifier = (value?: string | null) => {
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

const base64ToBytes = (value: string) => {
  const sanitizedValue = value.trim().replace(/\s/g, "");

  if (
    sanitizedValue.length < 4 ||
    sanitizedValue.length % 4 === 1 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(sanitizedValue)
  ) {
    return [];
  }

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes: number[] = [];
  let buffer = 0;
  let bitCount = 0;

  for (const character of sanitizedValue.replace(/=+$/, "")) {
    const valueIndex = alphabet.indexOf(character);

    if (valueIndex === -1) {
      return [];
    }

    buffer = (buffer << 6) | valueIndex;
    bitCount += 6;

    if (bitCount >= 8) {
      bitCount -= 8;
      bytes.push((buffer >> bitCount) & 0xff);
      buffer &= (1 << bitCount) - 1;
    }
  }

  return bytes;
};

const extractTagSerials = (normalizedValue: string) => {
  const serials = new Set<string>();

  for (let index = 0; index < normalizedValue.length; index += 1) {
    const prefix = normalizedValue.slice(index, index + 2);

    if (!TAG_SERIAL_PREFIXES.includes(prefix)) {
      continue;
    }

    for (const length of TAG_SERIAL_LENGTHS) {
      const candidate = normalizedValue.slice(index, index + length);

      if (candidate.length === length && TAG_SERIAL_EXACT_PATTERN.test(candidate)) {
        serials.add(candidate);
      }
    }
  }

  return Array.from(serials);
};

const addIdentifier = (
  identifiers: Set<string>,
  value?: string | null,
  options: { extractEmbeddedSerials?: boolean } = {},
) => {
  const normalizedValue = normalizeBleIdentifier(value);

  if (!normalizedValue) {
    return;
  }

  identifiers.add(normalizedValue);

  if (options.extractEmbeddedSerials === false) {
    return;
  }

  for (const serial of extractTagSerials(normalizedValue)) {
    identifiers.add(serial);
  }
};

const addBleDataIdentifier = (identifiers: Set<string>, value: unknown, depth = 0) => {
  if (!value || depth > 3) {
    return;
  }

  if (typeof value === "string") {
    addIdentifier(identifiers, value);

    const decodedBytes = base64ToBytes(value);
    if (decodedBytes.length > 0) {
      addIdentifier(identifiers, bytesToHex(decodedBytes));
    }
    return;
  }

  if (Array.isArray(value)) {
    const numericBytes = value.filter((item): item is number => typeof item === "number");
    if (numericBytes.length === value.length && numericBytes.length > 0) {
      addIdentifier(identifiers, bytesToHex(numericBytes));
      return;
    }

    value.forEach((item) => addBleDataIdentifier(identifiers, item, depth + 1));
    return;
  }

  if (typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((item) =>
      addBleDataIdentifier(identifiers, item, depth + 1),
    );
  }
};

const isTagSerial = (identifier: string) => TAG_SERIAL_EXACT_PATTERN.test(identifier);

export const getPeripheralIdentifiers = (peripheral: Peripheral) => {
  const identifiers = new Set<string>();
  const advertising = peripheral.advertising as
    | {
        localName?: string;
        rawData?: unknown;
        manufacturerData?: unknown;
        manufacturerRawData?: unknown;
        serviceData?: unknown;
        serviceUUIDs?: unknown;
      }
    | undefined;

  addIdentifier(identifiers, peripheral.id, { extractEmbeddedSerials: false });
  addIdentifier(identifiers, peripheral.name);
  addIdentifier(identifiers, advertising?.localName);
  addBleDataIdentifier(identifiers, advertising?.rawData);
  addBleDataIdentifier(identifiers, advertising?.manufacturerData);
  addBleDataIdentifier(identifiers, advertising?.manufacturerRawData);
  addBleDataIdentifier(identifiers, advertising?.serviceData);
  addBleDataIdentifier(identifiers, advertising?.serviceUUIDs);

  return Array.from(identifiers);
};

export const getPeripheralTagSerials = (peripheral: Peripheral) => {
  const serials = new Set<string>();

  for (const identifier of getPeripheralIdentifiers(peripheral)) {
    if (isTagSerial(identifier)) {
      serials.add(identifier);
    }

    for (const embeddedSerial of extractTagSerials(identifier)) {
      serials.add(embeddedSerial);
    }
  }

  return Array.from(serials);
};

export const peripheralMatchesSerial = (peripheral: Peripheral, normalizedSerial: string) => {
  if (!normalizedSerial) {
    return false;
  }

  return getPeripheralIdentifiers(peripheral).some(
    (identifier) => identifier === normalizedSerial || identifier.includes(normalizedSerial),
  );
};
