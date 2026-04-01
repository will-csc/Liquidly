import React from "react"
import { StyleSheet, TouchableOpacity, View } from "react-native"
import { theme } from "../styles/theme"

type Props = {
  count: number
  activeIndex: number
  bottom: number
  onSelect: (index: number) => void
  getAccessibilityLabel: (index: number) => string
}

const OnboardingPagination = ({ count, activeIndex, bottom, onSelect, getAccessibilityLabel }: Props) => {
  return (
    <View style={[styles.pagination, { bottom }]}>
      {Array.from({ length: count }).map((_, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onSelect(index)}
          style={[styles.dot, activeIndex === index ? styles.dotActive : null]}
          accessibilityRole="button"
          accessibilityLabel={getAccessibilityLabel(index)}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  pagination: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: "row",
    justifyContent: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ccc",
    marginHorizontal: 6,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    transform: [{ scale: 1.15 }],
  },
})

export default OnboardingPagination
