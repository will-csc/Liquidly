// Entry.tsx
// Onboarding com 3 slides, setas SOBREPOSTAS ao carrossel (sem barras laterais),
// paginação por pontinhos e 3º slide menor. Compatível com Expo Web e mobile.

import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useI18n } from '../i18n/i18n';
import EntryBottomActions from '../components/EntryBottomActions';
import EntrySkipButton from '../components/EntrySkipButton';
import OnboardingArrowButton from '../components/OnboardingArrowButton';
import OnboardingPagination from '../components/OnboardingPagination';
import OnboardingSlide from '../components/OnboardingSlide';
import { theme } from '../styles/theme';

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

      <EntrySkipButton label={t('entry.skip')} onPress={goToSignIn} />

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
              <OnboardingSlide
                key={slide.key}
                pageWidth={pageWidth}
                slideHeight={slideHeight}
                image={slide.image}
                imageWidth={imgWidth}
                maxImageHeight={maxImgHeight}
                tintPrimary={slide.key === 'slide1'}
                title={slide.title}
                subtitle={slide.subtitle}
              />
            );
          })}
        </ScrollView>

        {/* ===== SETAS SOBREPOSTAS (sem colunas, sem barras) ===== */}
        <View style={styles.arrowsOverlay} pointerEvents="box-none">
          <OnboardingArrowButton
            direction="prev"
            top={arrowTop}
            disabled={!canPrev}
            onPress={goPrev}
            accessibilityLabel={t('entry.a11y.prevSlide')}
          />
          <OnboardingArrowButton
            direction="next"
            top={arrowTop}
            disabled={!canNext}
            onPress={goNext}
            accessibilityLabel={t('entry.a11y.nextSlide')}
          />
        </View>
      </View>

      {/* ===== Paginação (bolinhas) ===== */}
      <OnboardingPagination
        count={slides.length}
        activeIndex={activeIndex}
        bottom={BOTTOM_HEIGHT + 10}
        onSelect={goTo}
        getAccessibilityLabel={(i) => t('entry.a11y.goToSlide', { index: i + 1 })}
      />

      {/* ===== Rodapé ===== */}
      <EntryBottomActions
        height={BOTTOM_HEIGHT}
        bottomInset={insets.bottom}
        signInLabel={t('entry.signIn')}
        signUpLabel={t('entry.signUp')}
        onSignIn={goToSignIn}
        onSignUp={() => navigation.navigate('SignUp')}
      />
    </SafeAreaView>
  );
};

// ===== ESTILOS =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Wrapper do carrossel — posição relativa para podermos SOBREPOR as setas
  carouselWrap: {
    flex: 1,
    position: 'relative',
  },

  // Overlay das setas: não ocupa layout, não cria colunas, não desenha barras
  arrowsOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 2,
  },
});

export default Entry;
