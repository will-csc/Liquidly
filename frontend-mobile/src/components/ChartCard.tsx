import React, { ReactNode } from "react"
import { StyleSheet, Text, ViewStyle } from "react-native"
import Card from "./Card"
import { theme } from "../styles/theme"

type Props = {
  title: string
  children: ReactNode
  style?: ViewStyle
}

const ChartCard = ({ title, children, style }: Props) => {
  return (
    <Card style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 15,
    marginBottom: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
})

export default ChartCard
