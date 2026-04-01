// Entry.tsx
// Onboarding com 3 slides, setas SOBREPOSTAS ao carrossel (sem barras laterais),
// paginação por pontinhos e 3º slide menor. Compatível com Expo Web e mobile.

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../styles/theme';
import { useI18n } from '../i18n/i18n';

// === CONFIG RÁPIDA ===
// Frações da largura/altura útil do slide para controlar imagens
const IMG = {
  defaultW: 0.75,
  defaultH: 0.50,
  thirdW: 0.68,  // 👈 3º slide MENOR (ajuste aqui)
  thirdH: 0.42,
};

const BOTTOM_HEIGHT = 100; // altura do rodapé
const ARROW_SIZE = 44;     // diâmetro do botão da seta

const Entry = ({ navigation }: any) => {
  const { t } = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);

  const slides = [
    {
      key: 'slide1',
      image: require('../assets/images/logo-liquidly.png'),
      title: t('entry.slide1.title'),
      subtitle: t('entry.slide1.subtitle'),
    },
    {
      key: 'slide2',
      image: require('../assets/images/hero-image_entry-page.png'),
      title: t('entry.slide2.title'),
      subtitle: t('entry.slide2.subtitle'),
    },
    {
      key: 'slide3',
      image: require('../assets/images/dash.png'),
      title: t('entry.slide3.title'),
      subtitle: t('entry.slide3.subtitle'),
    },
  ];

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Cada "página" do carrossel mede a largura da janela
  const pageWidth = width;

  // Altura útil do slide (desconta rodapé + safe areas)
  const slideHeight = Math.max(
    0,
    height - BOTTOM_HEIGHT - insets.top - insets.bottom
  );

  // Posição vertical das setas (centralizadas no conteúdo)
  const arrowTop = insets.top + slideHeight / 2 - ARROW_SIZE / 2;

  // Índice robusto (Web/Mobile): pega a página mais próxima
  const computeIndex = (offsetX: number) => {
    const idx = Math.floor((offsetX + pageWidth / 2) / pageWidth);
    return Math.max(0, Math.min(idx, slides.length - 1));
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = computeIndex(x);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = computeIndex(x);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    scrollRef.current?.scrollTo({ x: clamped * pageWidth, animated: true });
    setActiveIndex(clamped);
  };
  const goPrev = () => goTo(activeIndex - 1);
  const goNext = () => goTo(activeIndex + 1);

  const canPrev = activeIndex > 0;
  const canNext = activeIndex < slides.length - 1;

  const goToSignIn = () => navigation.navigate('SignIn');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Skip */}
      <TouchableOpacity style={styles.skipButton} onPress={goToSignIn}>
        <Text style={styles.skipText}>{t('entry.skip')}</Text>
      </TouchableOpacity>

      {/* ===== CARROSSEL ===== */}
      <View style={styles.carouselWrap}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          snapToInterval={pageWidth}     // 👈 páginas medem a largura da janela
          snapToAlignment="start"
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          onMomentumScrollEnd={onScrollEnd}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: BOTTOM_HEIGHT }} // reserva o rodapé
        >
          {slides.map((slide) => {
            const isThird = slide.key === 'slide3';
            const imgWidth =
              (isThird ? IMG.thirdW : IMG.defaultW) * pageWidth;
            const maxImgHeight =
              (isThird ? IMG.thirdH : IMG.defaultH) * slideHeight;

            return (
              <View
                key={slide.key}
                style={[
                  styles.slide,
                  { width: pageWidth, height: slideHeight },
                ]}
              >
                <Image
                  source={slide.image}
                  resizeMode="contain"
                  style={[
                    { width: imgWidth, maxHeight: maxImgHeight },
                    slide.key === 'slide1' && { tintColor: theme.colors.primary },
                  ]}
                />

                <Text style={styles.slideTitle}>{slide.title}</Text>
                <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* ===== SETAS SOBREPOSTAS (sem colunas, sem barras) ===== */}
        <View style={styles.arrowsOverlay} pointerEvents="box-none">
          <TouchableOpacity
            onPress={goPrev}
            disabled={!canPrev}
            style={[
              styles.arrowButton,
              { left: 8, top: arrowTop, opacity: canPrev ? 1 : 0.3 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('entry.a11y.prevSlide')}
          >
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goNext}
            disabled={!canNext}
            style={[
              styles.arrowButton,
              { right: 8, top: arrowTop, opacity: canNext ? 1 : 0.3 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('entry.a11y.nextSlide')}
          >
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== Paginação (bolinhas) ===== */}
      <View style={[styles.pagination, { bottom: BOTTOM_HEIGHT + 10 }]}>
        {slides.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => goTo(index)}
            style={[
              styles.dot,
              activeIndex === index && styles.dotActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('entry.a11y.goToSlide', { index: index + 1 })}
          />
        ))}
      </View>

      {/* ===== Rodapé ===== */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.signInButton} onPress={goToSignIn}>
          <Text style={styles.signInText}>{t('entry.signIn')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signUpButton}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.signUpText}>{t('entry.signUp')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ===== ESTILOS =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  skipButton: {
    position: 'absolute',
    top: 24,
    right: 20,
    zIndex: 3,
  },
  skipText: {
    color: theme.colors.secondary,
    fontWeight: '600',
    fontSize: 16,
  },

  // Wrapper do carrossel — posição relativa para podermos SOBREPOR as setas
  carouselWrap: {
    flex: 1,
    position: 'relative',
  },

  // Cada slide/página (sem overlay lateral e sem colunas)
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.xl,
    overflow: 'hidden', // evita glitches no Web
  },

  // Overlay das setas: não ocupa layout, não cria colunas, não desenha barras
  arrowsOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 2,
  },
  arrowButton: {
    position: 'absolute',
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    borderRadius: ARROW_SIZE / 2,
    backgroundColor: 'rgba(0,0,0,0.06)', // círculo suave, sem barra lateral
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: theme.colors.primary,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 26,
  },

  // Título e subtítulo
  slideTitle: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  slideSubtitle: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.secondary,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: '80%',
  },

  // Paginação
  pagination: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginHorizontal: 6,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    transform: [{ scale: 1.15 }],
  },

  // Rodapé
  bottomContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_HEIGHT,
    backgroundColor: theme.colors.background,
  },
  signInButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  signInText: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  signUpButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: 50,
  },
  signUpText: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
});

export default Entry;
