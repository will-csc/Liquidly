import React, { ReactNode } from "react"
import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native"
import { theme } from "../styles/theme"

type Props = {
  title: string
  subtitle?: string
  right?: ReactNode
  style?: ViewStyle
  titleStyle?: TextStyle
  subtitleStyle?: TextStyle
}

const ScreenHeader = ({ title, subtitle, right, style, titleStyle, subtitleStyle }: Props) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        <Text style={[styles.title, titleStyle]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  left: {
    flex: 1,
    paddingRight: 12,
  },
  right: {
    alignItems: "flex-end",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
})

export default ScreenHeader
