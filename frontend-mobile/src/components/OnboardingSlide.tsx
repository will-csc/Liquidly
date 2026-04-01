import React from "react"
import { Image, ImageSourcePropType, StyleSheet, Text, View } from "react-native"
import { theme } from "../styles/theme"

type Props = {
  pageWidth: number
  slideHeight: number
  image: ImageSourcePropType
  imageWidth: number
  maxImageHeight: number
  tintPrimary?: boolean
  title: string
  subtitle: string
}

const OnboardingSlide = ({
  pageWidth,
  slideHeight,
  image,
  imageWidth,
  maxImageHeight,
  tintPrimary,
  title,
  subtitle,
}: Props) => {
  return (
    <View style={[styles.slide, { width: pageWidth, height: slideHeight }]}>
      <Image
        source={image}
        resizeMode="contain"
        style={[{ width: imageWidth, maxHeight: maxImageHeight }, tintPrimary ? { tintColor: theme.colors.primary } : null]}
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  slide: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.xl,
    overflow: "hidden",
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: "bold",
    color: theme.colors.primary,
    textAlign: "center",
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  subtitle: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.secondary,
    textAlign: "center",
    lineHeight: 26,
    maxWidth: "80%",
  },
})

export default OnboardingSlide
