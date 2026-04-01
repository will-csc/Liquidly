import React from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { theme } from "../styles/theme"

type Props = {
  label: string
  selected: boolean
  onPress: () => void
}

const SelectableListItem = ({ label, selected, onPress }: Props) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.row} accessibilityRole="button">
      <Text style={styles.label}>{label}</Text>
      {selected ? (
        <View style={styles.icon}>
          <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
        </View>
      ) : null}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
  },
  label: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingRight: 12,
  },
  icon: {
    width: 24,
    alignItems: "flex-end",
  },
})

export default SelectableListItem
