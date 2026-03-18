import { Dimensions, StyleSheet } from "react-native";
import { Modal } from "react-native-paper";

const { width } = Dimensions.get("window");

const CustomModal = ({
  visible,
  onDismiss,
  children,
}: {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
}) => {
  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={styles.containerStyle}
      style={{ paddingHorizontal: width * 0.03 }}
    >
      {children}
    </Modal>
  );
};

const styles = StyleSheet.create({
  containerStyle: {
    backgroundColor: "white",
    padding: 20,
    paddingHorizontal: width * 0.1,
    borderRadius: 10,
  },
});

export default CustomModal;
