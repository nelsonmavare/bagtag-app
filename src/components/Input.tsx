import { Dimensions, StyleProp, TextInput, View } from "react-native";
import { colors } from "../utils/colors";
import { ThemedText } from "./ThemedText";

const { height, fontScale } = Dimensions.get("window");
  
export const Input = ({
  label,
  placeholder,
  onChangeText,
  value,
  style,
  containerStyle,
  secureTextEntry,
  error,
  keyboardType,
  autoCapitalize,
  onFocus,
  inputMode,
}: {
  label?: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  value: string;
  style?: StyleProp<any>;
  containerStyle?: StyleProp<any>;
  secureTextEntry?: boolean;
  error?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  onFocus?: () => void;
  inputMode?: "text" | "numeric" | "email" | "tel";
}) => {
  return (
    <View style={containerStyle}>
      {label && (
        <ThemedText style={{ marginBottom: 10, color: colors.primary, fontWeight: "bold" }}>
          {label}
        </ThemedText>
      )}
      <TextInput
        style={{
          borderRadius: 10,
          marginBottom: error ? 5 : 20,
          fontSize: fontScale * 16,
          paddingVertical: 10,
          paddingHorizontal: 16,
          height: 50,
          backgroundColor: colors.secondary,
          color: colors.primary,
          ...style,
        }}
        onFocus={onFocus}
        // Adding hint in TextInput using Placeholder option.
        inputMode={inputMode}
        placeholder={placeholder}
        placeholderTextColor={colors.primaryLight}
        onChangeText={onChangeText}
        value={value}
        secureTextEntry={secureTextEntry}
        // Making the Under line Transparent.
        underlineColorAndroid="transparent"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {error && <ThemedText style={{ color: "red" }}>{error}</ThemedText>}
    </View>
  );
};
