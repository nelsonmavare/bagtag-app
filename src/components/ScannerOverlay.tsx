import { Canvas, DiffRect, rect, rrect } from "@shopify/react-native-skia";
import { Dimensions, Platform, StyleSheet } from "react-native";
import { colors } from "../utils/colors";

const { width, height } = Dimensions.get("window");

const innerDimension = 300;

const outer = rrect(rect(0, 0, width, height), 0, 0);
const inner = rrect(
  rect(
    width / 2 - innerDimension / 2,
    height / 2 - innerDimension / 2,
    innerDimension,
    innerDimension
  ),
  50,
  50
);

export const Overlay = () => {
  return (
    <Canvas
      style={StyleSheet.absoluteFillObject
      }
    >
      <DiffRect inner={inner} outer={outer} color={colors.primary} opacity={0.5} />
    </Canvas>
  );
};