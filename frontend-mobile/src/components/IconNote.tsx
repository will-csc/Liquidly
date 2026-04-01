import React from "react"
import { StyleSheet, Text, View, ViewStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { theme } from "../styles/theme"

type Props = {
  iconName: keyof typeof Ionicons.glyphMap
  text: string
  style?: ViewStyle
}

const IconNote = ({ iconName, text, style }: Props) => {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name={iconName} size={14} color={theme.colors.textLight} />
      <Text style={styles.text}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  text: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginLeft: 5,
  },
})

export default IconNote
