// components/CustomInput.tsx
import { authStyles } from "@/styles/auth/auth.styles";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleProp, TextInput, TextInputProps, TextStyle, View } from "react-native";
interface CustomInputProps extends TextInputProps {
  iconName: any;
  iconSize?: number;
  iconColor?: string;
  secureTextEntry?: boolean;
  isPasswordVisible?: boolean;
  togglePasswordVisibility?: () => void;
  style?: StyleProp<TextStyle>;
}

const CustomInput: React.FC<CustomInputProps> = ({
  iconName,
  iconSize = 20,
  iconColor = "#A1A1A1",
  secureTextEntry = false,
  isPasswordVisible,
  togglePasswordVisibility,
  style,
  ...props
}) => {
  return (
    <View style={{ position: "relative" }}>
      <TextInput
        style={[authStyles.input, style]}
        secureTextEntry={secureTextEntry && !isPasswordVisible}
        {...props}
      />
      {iconName && (
        <Ionicons
          name={iconName}
          size={iconSize}
          color={iconColor}
          style={authStyles.icon}
        />
      )}
      {secureTextEntry && togglePasswordVisibility && (
        <Ionicons
          name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
          size={23}
          color={"#747474"}
          style={authStyles.visibleIcon}
          onPress={togglePasswordVisibility}
        />
      )}
    </View>
  );
};

export default CustomInput;