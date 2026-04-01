import React from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { theme } from "../styles/theme"

type Props = {
  height: number
  bottomInset: number
  signInLabel: string
  signUpLabel: string
  onSignIn: () => void
  onSignUp: () => void
}

const EntryBottomActions = ({ height, bottomInset, signInLabel, signUpLabel, onSignIn, onSignUp }: Props) => {
  return (
    <View style={[styles.container, { height, paddingBottom: bottomInset }]}>
      <TouchableOpacity style={styles.signInButton} onPress={onSignIn} accessibilityRole="button">
        <Text style={styles.signInText}>{signInLabel}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signUpButton} onPress={onSignUp} accessibilityRole="button">
        <Text style={styles.signUpText}>{signUpLabel}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
  },
  signInButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  signInText: {
    fontSize: theme.fontSize.xxl,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  signUpButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: 50,
  },
  signUpText: {
    fontSize: theme.fontSize.xxl,
    fontWeight: "bold",
    color: theme.colors.white,
  },
})

export default EntryBottomActions
