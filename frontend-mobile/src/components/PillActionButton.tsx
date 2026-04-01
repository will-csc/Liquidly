import React from "react"
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native"
import { theme } from "../styles/theme"

type Props = {
  label: string
  onPress: () => void
  disabled?: boolean
  style?: ViewStyle
}

const PillActionButton = ({ label, onPress, disabled, style }: Props) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!!disabled}
      style={[styles.button, disabled ? styles.disabled : null, style]}
      accessibilityRole="button"
    >
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: "#fff",
    fontWeight: "bold",
  },
})

export default PillActionButton
