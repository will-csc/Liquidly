import React from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { theme } from "../styles/theme"

type Props = {
  title: string
  onClose: () => void
  closeLabel?: string
}

const ModalHeader = ({ title, onClose, closeLabel }: Props) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity onPress={onClose} accessibilityRole="button">
        {closeLabel ? <Text style={styles.closeText}>{closeLabel}</Text> : <Ionicons name="close" size={22} color={theme.colors.text} />}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  closeText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
})

export default ModalHeader
