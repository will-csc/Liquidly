import React from "react"
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native"
import { theme } from "../styles/theme"

type Props = {
  label: string
  onPress: () => void
  style?: ViewStyle
}

const EntrySkipButton = ({ label, onPress, style }: Props) => {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress} accessibilityRole="button">
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    top: 24,
    right: 20,
    zIndex: 3,
  },
  text: {
    color: theme.colors.secondary,
    fontWeight: "600",
    fontSize: 16,
  },
})

export default EntrySkipButton
