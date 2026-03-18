import { useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { CountryPicker } from "react-native-country-codes-picker";
import { Input } from "./Input";
import { Button } from "react-native-paper";
import { colors } from "../utils/colors";

const { height, fontScale } = Dimensions.get("window");

const PhoneInput = ({
  setPhone,
  setCountryCode,
  countryCodeValue,
  phoneValue,
}: {
  setPhone: (text: string) => void;
  setCountryCode: (text: string) => void;
  countryCodeValue: string;
  phoneValue: string;
}) => {
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const removeExtraCharactersFromPhone = (text: string) => {
    return text.replace(/[^0-9]/g, "");
  };
  return (
    <>
      <View style={styles.container}>
        <Button textColor={colors.primary}
          style={styles.codeButtonStyle}
          onPress={() => setShowCountryPicker(true)}
        >
          {countryCodeValue}
        </Button>
        <Input
          label="Teléfono"
          placeholder="1234567890"
          onChangeText={(text) => {
            setPhone(removeExtraCharactersFromPhone(text));
          }}
          value={phoneValue}
          containerStyle={{ flex: 1 }}
          inputMode="numeric"
        />
      </View>
      <CountryPicker
        show={showCountryPicker}
        lang="es"
        style={{
          modal: {
            height: height * 0.7,
          },
          textInput: {
            paddingHorizontal: 16,
            paddingVertical: 10,
            fontSize: fontScale * 16,
          }
        }}
        enableModalAvoiding={false}
        onBackdropPress={() => setShowCountryPicker(false)}
        pickerButtonOnPress={(item) => {
          setCountryCode(item.dial_code);
          setShowCountryPicker(false);
        }}
        inputPlaceholder="Buscar país"
      />
    </>
  );
};

const styles = StyleSheet.create({
  codeButtonStyle: {
    backgroundColor: colors.secondary,
    paddingVertical: 6,
    marginBottom: 20,
    marginRight: 5,
    borderRadius: 10,
    fontSize: fontScale * 16,
  },
  container:{ 
    flexDirection: "row",
    width: "100%",
    alignItems: "flex-end",
    display: 'flex',
    justifyContent: 'center'
  }
});

export default PhoneInput;
