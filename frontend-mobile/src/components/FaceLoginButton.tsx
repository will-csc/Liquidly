import React from "react"
import { Image, ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { theme } from "../styles/theme"

type Props = {
  label: string
  onPress: () => void
  disabled?: boolean
  icon: ImageSourcePropType
}

const FaceLoginButton = ({ label, onPress, disabled, icon }: Props) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!!disabled}
      style={[styles.button, disabled ? styles.disabled : null]}
      accessibilityRole="button"
    >
      <View style={styles.content}>
        <Image source={icon} style={styles.icon} resizeMode="contain" />
        <Text style={styles.text}>{label}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.l,
    width: "100%",
    marginTop: 12,
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: "#fff",
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default FaceLoginButton
