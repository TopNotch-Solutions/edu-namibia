import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Official & branded Namibian Colors
const NAMIBIA_BLUE = "#002B7F"; // Sky, lakes, ocean & digital depth
const NAMIBIA_RED = "#D21034"; // Heroism, energy & determination
const NAMIBIA_GREEN = "#009A44"; // Natural resources & growth
const NAMIBIA_YELLOW = "#FFCE00"; // The sun, warmth & enlightenment
const NAMIBIA_GOLD = "#F59E0B"; // Secondary golden tone

interface OnboardingStepData {
  step: number;
  headlinePrefix: string;
  headlineHighlight: string;
  headlineSuffix?: string;
  description: string;
  buttonText: string;
}

const STEPS_DATA: OnboardingStepData[] = [
  {
    step: 1,
    headlinePrefix: "Access Approved",
    headlineHighlight: "Digital Curriculum",
    headlineSuffix: ", Anywhere",
    description:
      "Explore official national curriculum textbooks, teacher guides, and syllabi for all Namibian grades directly on your phone or tablet.",
    buttonText: "Continue →",
  },
  {
    step: 2,
    headlinePrefix: "Excel in Exams with",
    headlineHighlight: "Past Papers",
    headlineSuffix: " & Memos",
    description:
      "Prepare with confidence using an extensive digital archive of NSSCO and NSSCAS examination question papers with official marking memos.",
    buttonText: "Continue →",
  },
  {
    step: 3,
    headlinePrefix: "Empower Your Studies with",
    headlineHighlight: "Offline Learning",
    headlineSuffix: " Across Namibia",
    description:
      "Pre downloaded textbooks and past papers to your device, then study anytime, anywhere without using your mobile data.",
    buttonText: "Start Learning Free →",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [fadeAnim] = useState(() => new Animated.Value(1));
  const [slideAnim] = useState(() => new Animated.Value(0));

  const currentStep = STEPS_DATA[currentStepIndex];

  // If user has already completed onboarding previously, do not display onboarding
  useEffect(() => {
    AsyncStorage.getItem('has_completed_onboarding')
      .then(async (val) => {
        if (val === 'true') {
          const path = await AsyncStorage.getItem('user_path');
          if (path === 'explorer') {
            router.replace('/explore');
            return;
          }
          const hasCurriculum =
            (await AsyncStorage.getItem('has_selected_grade_and_subjects')) === 'true' ||
            Boolean(await AsyncStorage.getItem('user_grade'));
          if (path === 'learner' || (!path && hasCurriculum)) {
            router.replace(hasCurriculum ? '/home' : '/select-grade');
            return;
          }
          router.replace('/choose-path');
        }
      })
      .catch(() => {});
  }, [router]);

  const animateTransition = (
    nextIndex: number,
    direction: 'forward' | 'backward'
  ) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction === 'forward' ? -24 : 24,
        duration: 160,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStepIndex(nextIndex);
      slideAnim.setValue(direction === 'forward' ? 24 : -24);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const completeOnboardingAndProceed = async () => {
    try {
      await AsyncStorage.setItem('has_completed_onboarding', 'true');
    } catch (e) {
      console.warn('Failed to save onboarding completion', e);
    }
    router.replace('/choose-path');
  };

  const handleNext = () => {
    if (currentStepIndex < STEPS_DATA.length - 1) {
      animateTransition(currentStepIndex + 1, 'forward');
    } else {
      completeOnboardingAndProceed();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      animateTransition(currentStepIndex - 1, 'backward');
    }
  };

  const handleSkip = () => {
    completeOnboardingAndProceed();
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Top Navigation Header */}
      <View style={styles.topNav}>
        {/* Left Slot: Back Button or App Logo */}
        <View style={styles.navLeftSlot}>
          {currentStepIndex > 0 ? (
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressedState,
              ]}
              hitSlop={10}
            >
              <Text style={styles.backButtonIcon}>←</Text>
            </Pressable>
          ) : (
            <View style={styles.brandRow}>
              <View style={styles.brandLogoCircle}>
                <Text style={styles.brandStar}>✦</Text>
              </View>
              <Text style={styles.brandText}>
                edu<Text style={styles.brandTextAccent}>Namibia</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Right: Skip Button */}
        <Pressable
          onPress={handleSkip}
          style={({ pressed }) => [
            styles.skipButton,
            pressed && styles.pressedState,
          ]}
          hitSlop={10}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </Pressable>
      </View>

      {/* Segmented Progress Bars Styled with Namibia Colors */}
      <View style={styles.progressBarContainer}>
        {/* Step 1 Bar */}
        <View style={styles.progressSegmentTrack}>
          <LinearGradient
            colors={
              currentStepIndex >= 0
                ? [NAMIBIA_BLUE, "#1E40AF"]
                : ["#E2E8F0", "#E2E8F0"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressSegmentFill,
              { opacity: currentStepIndex >= 0 ? 1 : 0.4 },
            ]}
          />
        </View>

        {/* Step 2 Bar */}
        <View style={styles.progressSegmentTrack}>
          {currentStepIndex >= 1 ? (
            <LinearGradient
              colors={
                currentStepIndex === 1
                  ? [NAMIBIA_GREEN, NAMIBIA_BLUE]
                  : [NAMIBIA_RED, NAMIBIA_RED]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressSegmentFill}
            />
          ) : (
            <View
              style={[
                styles.progressSegmentFill,
                styles.progressSegmentInactive,
              ]}
            />
          )}
        </View>

        {/* Step 3 Bar */}
        <View style={styles.progressSegmentTrack}>
          {currentStepIndex >= 2 ? (
            <LinearGradient
              colors={[NAMIBIA_GREEN, "#10B981"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressSegmentFill}
            />
          ) : (
            <View
              style={[
                styles.progressSegmentFill,
                styles.progressSegmentInactive,
              ]}
            />
          )}
        </View>
      </View>

      {/* Main Animated Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Central Artwork Illustration */}
          <View style={styles.artworkContainer}>
            {currentStepIndex === 0 && <Step1Illustration />}
            {currentStepIndex === 1 && <Step2Illustration />}
            {currentStepIndex === 2 && <Step3Illustration />}
          </View>

          {/* Headline with Namibia Color Accents */}
          <View style={styles.headlineContainer}>
            <Text style={styles.headlineText}>
              {currentStep.headlinePrefix}{" "}
              {currentStepIndex === 0 && (
                <Text style={styles.headlineHighlightBlue}>
                  {currentStep.headlineHighlight}
                </Text>
              )}
              {currentStepIndex === 1 && (
                <>
                  <Text style={styles.headlineHighlightBlue}>
                    {currentStep.headlineHighlight}
                  </Text>
                  <Text style={styles.headlineHighlightRed}>
                    {currentStep.headlineSuffix}
                  </Text>
                </>
              )}
              {currentStepIndex === 2 && (
                <>
                  <Text style={styles.headlineHighlightGreen}>
                    {currentStep.headlineHighlight}
                  </Text>
                  <Text style={styles.headlineHighlightBlue}>
                    {currentStep.headlineSuffix}
                  </Text>
                </>
              )}
              {currentStepIndex === 0 && currentStep.headlineSuffix}
            </Text>
          </View>

          {/* Description */}
          <Text style={styles.descriptionText}>{currentStep.description}</Text>
        </Animated.View>
      </ScrollView>

      {/* Bottom Actions Area */}
      <View style={styles.bottomArea}>
        {/* Primary Action Button with Namibian Colors */}
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.primaryButtonWrapper,
            pressed && styles.buttonPressed,
          ]}
        >
          <LinearGradient
            colors={
              currentStepIndex === 0
                ? [NAMIBIA_BLUE, "#1A4BB8"]
                : currentStepIndex === 1
                  ? [NAMIBIA_BLUE, "#1E3A8A"]
                  : [NAMIBIA_BLUE, "#0F3375"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButtonGradient}
          >
            {/* Namibian flag golden sun bar accent on top of button */}
            <View style={styles.buttonTopFlagAccent} />
            <Text style={styles.primaryButtonText}>
              {currentStep.buttonText}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

// -----------------------------------------------------------------------------
// STEP 1 ARTWORK: Digital Textbook & Curriculum Library in Namibian Palette
// -----------------------------------------------------------------------------
function Step1Illustration() {
  return (
    <View style={styles.haloCircle}>
      {/* Subtle Halo Radial Background */}
      <LinearGradient
        colors={["#FEF3C7", "#E0F2FE", "#F8FAFC"]}
        style={styles.haloGradient}
      />

      {/* Floating Sparkles in Namibian Colors */}
      <Text
        style={[
          styles.sparkleStar,
          { top: 28, left: 74, color: NAMIBIA_YELLOW },
        ]}
      >
        ✦
      </Text>
      <Text
        style={[
          styles.sparkleStar,
          { top: 32, right: 70, color: NAMIBIA_BLUE },
        ]}
      >
        ✦
      </Text>
      <Text
        style={[
          styles.sparkleStar,
          { bottom: 44, left: 62, color: NAMIBIA_GREEN },
        ]}
      >
        ✦
      </Text>
      <Text
        style={[
          styles.sparkleStar,
          { bottom: 48, right: 64, color: NAMIBIA_YELLOW },
        ]}
      >
        ✦
      </Text>

      {/* Central Digital Device & Open Textbook Graphic */}
      <View style={styles.trophyWrapper}>
        <View style={styles.deviceFrame}>
          <View style={styles.deviceHeader}>
            <View style={styles.deviceCam} />
          </View>
          <View style={styles.deviceScreen}>
            <Text style={styles.screenBookIcon}>📖</Text>
            <Text style={styles.screenLabel}>DIGITAL CURRICULUM</Text>
          </View>
        </View>

        {/* Base Stand with Namibian Flag Accent */}
        <View style={styles.deviceStand}>
          <View style={styles.standFlagAccent} />
        </View>
      </View>

      {/* Left Floating Card: Grade 1-12 */}
      <View style={styles.floatCardLeft}>
        <Text style={styles.floatEmoji}>📘</Text>
        <Text style={styles.floatLabel}>GRADE 1–12</Text>
      </View>

      {/* Right Floating Card: Syllabi */}
      <View style={styles.floatCardRight}>
        <View style={styles.xpCircle}>
          <Text style={styles.xpLightning}>✨</Text>
        </View>
        <Text style={styles.xpLabel}>SYLLABI</Text>
      </View>
    </View>
  );
}

// -----------------------------------------------------------------------------
// STEP 2 ARTWORK: Past Examination Papers & Marking Memos
// -----------------------------------------------------------------------------
function Step2Illustration() {
  return (
    <View style={styles.haloCircle}>
      <LinearGradient
        colors={["#EFF6FF", "#EDE9FE", "#F8FAFC"]}
        style={styles.haloGradient}
      />

      {/* Sparkles around orbit */}
      <Text
        style={[
          styles.sparkleStar,
          { top: 30, left: 68, color: NAMIBIA_YELLOW },
        ]}
      >
        ✦
      </Text>
      <Text
        style={[
          styles.sparkleStar,
          { top: 36, right: 68, color: NAMIBIA_BLUE },
        ]}
      >
        ✦
      </Text>
      <Text
        style={[
          styles.sparkleStar,
          { bottom: 44, right: 72, color: NAMIBIA_GREEN },
        ]}
      >
        ✦
      </Text>

      {/* Orbit Ring */}
      <View style={styles.orbitDottedRing} />

      {/* Orbit Badges */}
      {/* Top: NSSCO */}
      <View
        style={[
          styles.orbitBadge,
          { top: 12, alignSelf: "center", backgroundColor: "#EFF6FF" },
        ]}
      >
        <Text style={[styles.orbitBadgeTextSmall, { color: NAMIBIA_BLUE }]}>
          NSSCO
        </Text>
      </View>

      {/* Left: NSSCAS */}
      <View
        style={[
          styles.orbitBadge,
          { left: 30, top: 104, backgroundColor: "#FEF3C7" },
        ]}
      >
        <Text style={[styles.orbitBadgeTextSmall, { color: NAMIBIA_GOLD }]}>
          NSSCAS
        </Text>
      </View>

      {/* Right: Memo with Checkmark */}
      <View
        style={[
          styles.orbitBadge,
          { right: 30, top: 104, backgroundColor: "#DCFCE7" },
        ]}
      >
        <Text style={styles.orbitBadgeIcon}>✅</Text>
      </View>

      {/* Bottom: Grade A+ Distinction */}
      <View
        style={[
          styles.orbitBadge,
          { bottom: 12, alignSelf: "center", backgroundColor: "#FEE2E2" },
        ]}
      >
        <Text style={[styles.orbitBadgeText, { color: NAMIBIA_RED }]}>A+</Text>
      </View>

      {/* Center: Examination Document & Revision Pen */}
      <View style={styles.examDocContainer}>
        <View style={styles.examDocCard}>
          <View style={styles.examDocHeader}>
            <View
              style={[
                styles.docLine,
                { width: "45%", backgroundColor: NAMIBIA_BLUE },
              ]}
            />
            <Text style={styles.examStamp}>2024</Text>
          </View>
          <View style={styles.docLine} />
          <View style={[styles.docLine, { width: "80%" }]} />
          <View style={[styles.docLine, { width: "65%" }]} />

          <View style={styles.examFooterRow}>
            <Text style={styles.examMarkBadge}>MEMO ATTACHED</Text>
          </View>
        </View>

        <View style={styles.pencilFloating}>
          <Text style={styles.pencilEmoji}>✏️</Text>
        </View>
      </View>
    </View>
  );
}

// -----------------------------------------------------------------------------
// STEP 3 ARTWORK: Offline Learning, Data-Free Digital Library Across Namibia
// -----------------------------------------------------------------------------
function Step3Illustration() {
  return (
    <View style={styles.haloCircle}>
      <LinearGradient
        colors={["#E0F2FE", "#DCFCE7", "#F8FAFC"]}
        style={styles.haloGradient}
      />

      {/* Top Right Floating Badge: Zero Data */}
      <View style={styles.zeroDataBadge}>
        <Text style={styles.zeroDataIcon}>📶</Text>
        <Text style={styles.zeroDataText}>Zero Data</Text>
      </View>

      {/* Floating White Storage / Saved Library Card */}
      <View style={styles.analyticsCard}>
        <View style={styles.analyticsCardHeader}>
          <View style={styles.analyticsGreenDot} />
          <View style={styles.analyticsHeaderLine} />
          <View style={styles.metricPill}>
            <Text style={styles.metricText}>SAVED</Text>
          </View>
        </View>

        {/* Digital Files Saved Indicator */}
        <View style={styles.chartArea}>
          <View
            style={[
              styles.chartBar,
              { height: 26, backgroundColor: "#A7F3D0" },
            ]}
          />
          <View
            style={[
              styles.chartBar,
              { height: 44, backgroundColor: "#34D399" },
            ]}
          />
          <View
            style={[
              styles.chartBar,
              { height: 60, backgroundColor: NAMIBIA_GREEN },
            ]}
          />
        </View>

        <View style={styles.chartBaseline} />
      </View>

      {/* Rocket Ship Blasting Off with Namibian Colors */}
      <View style={styles.rocketWrapper}>
        <View style={styles.rocketFlame}>
          <Text style={styles.rocketFlameEmoji}>🔥</Text>
        </View>
        <View style={styles.rocketBody}>
          <View style={styles.rocketNoseCone} />
          <View style={styles.rocketFuselage}>
            <View style={styles.rocketPorthole} />
          </View>
          <View style={styles.rocketFinsRow}>
            <View style={[styles.rocketFin, styles.finLeft]} />
            <View style={[styles.rocketFin, styles.finRight]} />
          </View>
        </View>
      </View>
    </View>
  );
}

// -----------------------------------------------------------------------------
// STYLES
// -----------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFCFF",
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navLeftSlot: {
    minWidth: 80,
    alignItems: "flex-start",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandLogoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: NAMIBIA_BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  brandStar: {
    color: NAMIBIA_YELLOW,
    fontSize: 16,
    fontWeight: "bold",
  },
  brandText: {
    fontSize: 16,
    fontWeight: "800",
    color: NAMIBIA_BLUE,
    letterSpacing: -0.3,
  },
  brandTextAccent: {
    color: NAMIBIA_RED,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      },
    }),
  },
  backButtonIcon: {
    fontSize: 18,
    color: NAMIBIA_BLUE,
    fontWeight: "700",
  },
  skipButton: {
    minWidth: 80,
    alignItems: "flex-end",
    paddingVertical: 6,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  pressedState: {
    opacity: 0.6,
  },

  // Progress Bar
  progressBarContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 4,
    marginBottom: 10,
  },
  progressSegmentTrack: {
    flex: 1,
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressSegmentFill: {
    height: "100%",
    width: "100%",
    borderRadius: 3,
  },
  progressSegmentInactive: {
    backgroundColor: "#E2E8F0",
  },

  // Main Scrollable Area
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  animatedContainer: {
    alignItems: "center",
  },

  // Artwork Halo
  artworkContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  haloCircle: {
    width: Math.min(SCREEN_WIDTH * 0.78, 300),
    height: Math.min(SCREEN_WIDTH * 0.78, 300),
    borderRadius: 150,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  haloGradient: {
    ...StyleSheet.absoluteFill,
    borderRadius: 150,
    opacity: 0.7,
  },
  sparkleStar: {
    position: "absolute",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Step 1 Artwork Styles (Digital Device)
  trophyWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  deviceFrame: {
    width: 140,
    height: 105,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 3,
    borderColor: NAMIBIA_BLUE,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: NAMIBIA_BLUE,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: "0 6px 14px rgba(0, 43, 127, 0.16)",
      },
    }),
  },
  deviceHeader: {
    position: "absolute",
    top: 5,
    alignItems: "center",
  },
  deviceCam: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#CBD5E1",
  },
  deviceScreen: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  screenBookIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  screenLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: NAMIBIA_BLUE,
    letterSpacing: 0.5,
  },
  deviceStand: {
    width: 60,
    height: 8,
    backgroundColor: "#CBD5E1",
    borderRadius: 4,
    marginTop: 4,
    overflow: "hidden",
  },
  standFlagAccent: {
    width: "100%",
    height: "100%",
    backgroundColor: NAMIBIA_RED,
  },
  floatCardLeft: {
    position: "absolute",
    left: 10,
    top: 70,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      },
    }),
  },
  floatEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  floatLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: NAMIBIA_RED,
  },
  floatCardRight: {
    position: "absolute",
    right: 10,
    top: 70,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      },
    }),
  },
  xpCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  xpLightning: {
    fontSize: 14,
  },
  xpLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: NAMIBIA_BLUE,
  },

  // Step 2 Artwork Styles (Exam Doc & Orbit)
  orbitDottedRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#94A3B8",
    opacity: 0.45,
    position: "absolute",
  },
  orbitBadge: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0 2px 6px rgba(0,0,0,0.07)",
      },
    }),
  },
  orbitBadgeIcon: {
    fontSize: 18,
  },
  orbitBadgeText: {
    fontSize: 16,
    fontWeight: "800",
  },
  orbitBadgeTextSmall: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  examDocContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  examDocCard: {
    width: 110,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    gap: 5,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
      },
    }),
  },
  examDocHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  docLine: {
    height: 3,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    width: "90%",
  },
  examStamp: {
    fontSize: 9,
    fontWeight: "800",
    color: NAMIBIA_RED,
    borderWidth: 1,
    borderColor: NAMIBIA_RED,
    paddingHorizontal: 3,
    borderRadius: 3,
  },
  examFooterRow: {
    marginTop: 6,
    alignItems: "center",
  },
  examMarkBadge: {
    fontSize: 8,
    fontWeight: "800",
    color: NAMIBIA_GREEN,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  pencilFloating: {
    position: "absolute",
    right: -16,
    bottom: -8,
  },
  pencilEmoji: {
    fontSize: 22,
  },

  // Step 3 Artwork Styles
  zeroDataBadge: {
    position: "absolute",
    top: 24,
    right: 28,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      },
    }),
  },
  zeroDataIcon: {
    fontSize: 12,
  },
  zeroDataText: {
    fontSize: 11,
    fontWeight: "800",
    color: NAMIBIA_GREEN,
  },
  analyticsCard: {
    width: 120,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 10,
    position: "absolute",
    left: 36,
    top: 90,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
      },
    }),
  },
  analyticsCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  analyticsGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: NAMIBIA_GREEN,
  },
  analyticsHeaderLine: {
    flex: 1,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
  },
  metricPill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metricText: {
    fontSize: 9,
    fontWeight: "800",
    color: NAMIBIA_GREEN,
  },
  chartArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 60,
    paddingHorizontal: 8,
  },
  chartBar: {
    width: 18,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartBaseline: {
    height: 2,
    backgroundColor: "#E2E8F0",
    marginTop: 4,
    borderRadius: 1,
  },
  rocketWrapper: {
    position: "absolute",
    right: 56,
    top: 60,
    alignItems: "center",
  },
  rocketBody: {
    alignItems: "center",
  },
  rocketNoseCone: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 24,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: NAMIBIA_RED,
  },
  rocketFuselage: {
    width: 28,
    height: 38,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  rocketPorthole: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: NAMIBIA_BLUE,
    borderWidth: 2,
    borderColor: "#38BDF8",
  },
  rocketFinsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 44,
    marginTop: -4,
  },
  rocketFin: {
    width: 0,
    height: 0,
    borderTopWidth: 12,
    borderBottomWidth: 0,
    borderTopColor: NAMIBIA_BLUE,
  },
  finLeft: {
    borderLeftWidth: 8,
    borderRightWidth: 0,
    borderLeftColor: "transparent",
  },
  finRight: {
    borderLeftWidth: 0,
    borderRightWidth: 8,
    borderRightColor: "transparent",
  },
  rocketFlame: {
    position: "absolute",
    bottom: -22,
    alignSelf: "center",
  },
  rocketFlameEmoji: {
    fontSize: 22,
  },

  // Headline Typography
  headlineContainer: {
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  headlineText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  headlineHighlightBlue: {
    color: NAMIBIA_BLUE,
  },
  headlineHighlightRed: {
    color: NAMIBIA_RED,
  },
  headlineHighlightGreen: {
    color: NAMIBIA_GREEN,
  },
  descriptionText: {
    fontSize: 15,
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 14,
  },

  // Bottom Area & Button
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 8,
    backgroundColor: "#FAFCFF",
  },
  primaryButtonWrapper: {
    borderRadius: 28,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: NAMIBIA_BLUE,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: "0 6px 16px rgba(0, 43, 127, 0.28)",
      },
    }),
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonGradient: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  buttonTopFlagAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: NAMIBIA_YELLOW, // Top gold sun accent
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
});
