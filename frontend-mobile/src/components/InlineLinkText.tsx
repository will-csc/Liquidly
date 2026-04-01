import React from "react"
import { StyleSheet, Text, TextStyle } from "react-native"
import { theme } from "../styles/theme"

type Props = {
  text: string
  linkText: string
  onPressLink: () => void
  style?: TextStyle
}

const InlineLinkText = ({ text, linkText, onPressLink, style }: Props) => {
  return (
    <Text style={[styles.text, style]}>
      {text}{" "}
      <Text style={styles.link} onPress={onPressLink}>
        {linkText}
      </Text>
    </Text>
  )
}

const styles = StyleSheet.create({
  text: {
    color: "#666",
    fontSize: 14,
  },
  link: {
    color: theme.colors.primary,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
})

export default InlineLinkText
