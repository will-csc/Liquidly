import React, { ReactNode } from "react"
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native"

type Props = {
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

const Card = ({ children, style }: Props) => {
  return <View style={[styles.card, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
})

export default Card
