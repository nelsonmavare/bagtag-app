import { Alert, Dimensions, Linking, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { AppBar, AppButton } from "@/src/components";
import { useEffect, useMemo, useState } from "react";
import { appHorizontalPadding, appTopPadding } from "@/src/utils/constants";
import { ThemedText } from "@/src/components/ThemedText";
import { colors } from "@/src/utils/colors";
import { useDispatch, useSelector } from "react-redux";
import { selectUserLogged, setAuth } from "@/src/store/AuthSlice";
import { Icon } from "react-native-paper";
import { useFetch } from "@/src/hooks/useFetch";
import {
  deleteBleDebugLogFile,
  listBleDebugLogFiles,
  readBleDebugLogFile,
  type BleDebugLogFile,
} from "@/src/debug/bleDeviceLogger";

const { height, fontScale } = Dimensions.get("window");

const OptionButton = ({
  color = colors.primary,
  prefix,
  title,
  value,
  onPress,
}: {
  title: string;
  onPress: () => void;
  value?: string;
  color?: string;
  prefix?: string;
}) => {
  return (
    <TouchableOpacity style={[styles.optionButtonContainer, { borderColor: color }]} onPress={onPress}>
      {prefix && (
        <View style={{ marginRight: 6 }}>
          <Icon source={prefix} color={color} size={35} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <ThemedText style={[styles.optionButtonText, { color }]}>{title}</ThemedText>
        {value && <ThemedText style={styles.optionButtonValue}>{value}</ThemedText>}
      </View>
      <Icon source="chevron-right" color={color} size={35} />
    </TouchableOpacity>
  );
};

export default function ConfigScreen() {
  const fetch = useFetch();
  const dispatch = useDispatch();
  const user = useSelector(selectUserLogged);
  const [companies, setCompanies] = useState<{ id: string; name: string | null }[]>([]);
  const [bleLogContent, setBleLogContent] = useState("");
  const [bleLogName, setBleLogName] = useState("");
  const [selectedBleLogFile, setSelectedBleLogFile] = useState<BleDebugLogFile | null>(null);
  const [showBleLogModal, setShowBleLogModal] = useState(false);

  const router = useRouter();
  const selectedCompanyName = useMemo(() => {
    if (!user?.companyId) {
      return "Sin empresa";
    }
    const selectedCompany = companies.find((company) => company.id === user.companyId);
    if (!selectedCompany) {
      return "Empresa no encontrada";
    }
    return selectedCompany.name ?? "Sin nombre";
  }, [companies, user?.companyId]);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await fetch("/company", {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });
        const responsePayload = await response.json();
        if (response.ok && Array.isArray(responsePayload.data)) {
          setCompanies(responsePayload.data);
        }
      } catch {
        setCompanies([]);
      }
    };

    loadCompanies().catch(() => {
      setCompanies([]);
    });
  }, [fetch]);

  const showBleDebugLogFile = async (logFile: BleDebugLogFile) => {
    const content = await readBleDebugLogFile(logFile);
    setSelectedBleLogFile(logFile);
    setBleLogName(logFile.name);
    setBleLogContent(content);
    setShowBleLogModal(true);
  };

  const handleDeleteBleLogFile = () => {
    if (!selectedBleLogFile) {
      return;
    }

    Alert.alert("Eliminar log BLE", `¿Deseas eliminar el archivo ${selectedBleLogFile.name}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          deleteBleDebugLogFile(selectedBleLogFile)
            .then(() => {
              setShowBleLogModal(false);
              setSelectedBleLogFile(null);
              setBleLogName("");
              setBleLogContent("");
              Alert.alert("Logs BLE", "Archivo eliminado correctamente.");
            })
            .catch((error) => {
              console.error("[BLE debug] could not delete selected log file:", error);
              Alert.alert("Logs BLE", "No se pudo eliminar el archivo de debug BLE.");
            });
        },
      },
    ]);
  };

  const openBleDebugLogs = async () => {
    try {
      const logFiles = await listBleDebugLogFiles();

      if (logFiles.length === 0) {
        Alert.alert("Logs BLE", "No hay archivos de debug BLE guardados todavía.");
        return;
      }

      if (logFiles.length === 1) {
        await showBleDebugLogFile(logFiles[0]);
        return;
      }

      Alert.alert(
        "Logs BLE",
        "Selecciona el archivo de debug que quieres abrir.",
        [
          ...logFiles.slice(0, 5).map((logFile) => ({
            text: logFile.name,
            onPress: () => {
              showBleDebugLogFile(logFile).catch((error) => {
                console.error("[BLE debug] could not show selected log file:", error);
                Alert.alert("Logs BLE", "No se pudo leer el archivo de debug BLE.");
              });
            },
          })),
          { text: "Cancelar", style: "cancel" as const },
        ],
      );
    } catch (error) {
      console.error("[BLE debug] could not open log files:", error);
      Alert.alert("Logs BLE", "No se pudo abrir el archivo de debug BLE.");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Configuración" withoutBackButton />
      <ScrollView>
        <View
          style={{
            paddingHorizontal: appHorizontalPadding,
            paddingTop: appTopPadding + 20,
            flex: 1,
          }}
        >
          <OptionButton
            title="Nombre completo"
            value={user?.name}
            onPress={() => {
              router.navigate("/screens/auth/changeUserInfo");
            }}
          />
          <OptionButton
            title="Correo electrónico"
            value={user?.email}
            onPress={() => {
              router.navigate("/screens/auth/changeEmail");
            }}
          />
          <OptionButton
            title="Teléfono"
            value={`${user?.phoneRef ? user?.phoneRef : "+54"} ${user?.phoneNumber}`}
            onPress={() => {
              router.navigate("/screens/auth/changePhone");
            }}
          />
          <OptionButton
            title="Agente o aerolínea relacionada"
            value={selectedCompanyName}
            onPress={() => {
              router.navigate("/screens/auth/changeCompany" as any);
            }}
          />
          <OptionButton
            title="Logs BLE de debug"
            onPress={openBleDebugLogs}
            prefix={"file-document-outline"}
          />
          <OptionButton
            title="Soporte"
            onPress={() => {
              Linking.openURL('mailto:soporte@bagtag.com.ar');
            }}
            prefix={"headset"}
          />
          <OptionButton
            title="Eliminar cuenta"
            onPress={() => {
              router.navigate("/screens/auth/deleteAccount");
            }}
            color={colors.error}
          />
          <View style={styles.logOutButtonContainer}>
            <AppButton
              title="Cerrar sesión"
              onPress={() => {
                dispatch(setAuth(undefined));
                router.navigate("/");
              }}
            />
          </View>
        </View>
      </ScrollView>
      <Modal
        animationType="slide"
        visible={showBleLogModal}
        onRequestClose={() => {
          setShowBleLogModal(false);
          setSelectedBleLogFile(null);
        }}
      >
        <View style={styles.logModalContainer}>
          <ThemedText style={styles.logModalTitle}>{bleLogName}</ThemedText>
          <ScrollView
            style={styles.logContentContainer}
            contentContainerStyle={styles.logContentContainerInner}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            <ThemedText style={styles.logContentText}>{bleLogContent}</ThemedText>
          </ScrollView>
          <AppButton
            title="Eliminar archivo"
            style={{ backgroundColor: colors.error, marginBottom: 12 }}
            onPress={handleDeleteBleLogFile}
          />
          <AppButton
            title="Cerrar"
            onPress={() => {
              setShowBleLogModal(false);
              setSelectedBleLogFile(null);
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  optionButtonContainer: {
    flexDirection: "row",
    marginBottom: height * 0.06,
    borderBottomWidth: 1,
    borderColor: colors.primary,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: height * 0.06,
  },
  optionButtonText: {
    fontSize: fontScale * 17,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 8,
  },
  optionButtonValue: {
    fontSize: fontScale * 17,
    marginBottom: 5,
    color: colors.primary,
  },
  logOutButtonContainer: {
    paddingBottom: height * 0.03,
    flex: 1,
    justifyContent: "flex-end",
  },
  logModalContainer: {
    flex: 1,
    paddingHorizontal: appHorizontalPadding,
    paddingTop: appTopPadding + 20,
    paddingBottom: height * 0.03,
    backgroundColor: colors.light,
  },
  logModalTitle: {
    color: colors.primary,
    fontSize: fontScale * 17,
    fontWeight: "bold",
    marginBottom: 12,
  },
  logContentContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    marginBottom: 16,
  },
  logContentContainerInner: {
    padding: 12,
    paddingBottom: 24,
  },
  logContentText: {
    color: colors.primary,
    fontSize: fontScale * 12,
    fontFamily: "monospace",
  },
});
