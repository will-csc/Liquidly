import React from "react"
import { StyleSheet, Text, View, ViewStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { theme } from "../styles/theme"

type Props = {
  title: string
  value: string
  iconName: keyof typeof Ionicons.glyphMap
  style?: ViewStyle
}

const KpiCard = ({ title, value, iconName, style }: Props) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.label}>{title}</Text>
        <View style={styles.iconWrap}>
          <Ionicons name={iconName} size={16} color={theme.colors.primary} />
        </View>
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "rgba(0, 100, 0, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: 11,
    color: theme.colors.textLight,
    textTransform: "uppercase",
    marginRight: 8,
    fontWeight: "700",
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
  },
})

export default KpiCard
