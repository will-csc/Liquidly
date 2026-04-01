import React from "react"
import { StyleSheet, Text, TouchableOpacity } from "react-native"
import { theme } from "../styles/theme"

type Props = {
  direction: "prev" | "next"
  top: number
  disabled: boolean
  onPress: () => void
  accessibilityLabel: string
}

const OnboardingArrowButton = ({ direction, top, disabled, onPress, accessibilityLabel }: Props) => {
  const isPrev = direction === "prev"
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        isPrev ? { left: 8 } : { right: 8 },
        { top, opacity: disabled ? 0.3 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.text}>{isPrev ? "‹" : "›"}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: theme.colors.primary,
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 26,
  },
})

export default OnboardingArrowButton
