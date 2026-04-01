import React from "react"
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { theme } from "../styles/theme"

type Props = {
  label: string
  valueText?: string
  placeholder: string
  onPress: () => void
  style?: ViewStyle
}

const SelectField = ({ label, valueText, placeholder, onPress, style }: Props) => {
  const display = valueText || placeholder
  const isPlaceholder = !valueText

  return (
    <View style={style}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={onPress} style={styles.input} accessibilityRole="button">
        <Text style={[styles.text, isPlaceholder ? styles.placeholder : null]}>{display}</Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 10,
    marginTop: 10,
  },
  input: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 15,
  },
  text: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingRight: 12,
  },
  placeholder: {
    color: "#999",
  },
})

export default SelectField
