import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ExploreMapPane } from "@/components/ExploreMapPane";
import { clearSubjectLocalData } from "@/constants/clearSubjectData";
import { syncExploreEntries } from "@/constants/exploreSync";
import { syncCurriculum } from "@/constants/curriculumSync";
import { syncLessons } from "@/constants/lessonSync";
import {
  CURRICULUM_SUBJECTS,
  getGradeLabel,
  getSubjectsForGrade,
  resolveGradeId,
  SubjectOption,
} from "@/constants/curriculum";
import { isDeviceOnline } from "@/constants/network";
import {
  bootstrapLearnerOffline,
  type OfflineBootstrapProgress,
} from "@/constants/offlineBootstrap";
import { hydrateOfflineFiles } from "@/constants/offlineFiles";
import { getUserPath } from "@/constants/userPath";

// Official Namibian colors
const NAMIBIA_BLUE = "#002B7F";
const NAMIBIA_RED = "#D21034";
const NAMIBIA_YELLOW = "#FFCE00";
const MAP_PIN_PINK = "#E84A7F";

type CategoryFilter =
  | "All"
  | "Sciences"
  | "Languages"
  | "Commercials"
  | "Humanities"
  | "Arts"
  | "Life Skills";
type MainTab = "home" | "explore";

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    gradeId?: string;
    grade?: string;
    subjectsCount?: string;
  }>();
  const insets = useSafeAreaInsets();

  // State
  const [activeTab, setActiveTab] = useState<MainTab>("home");
  const [isReturningUser, setIsReturningUser] = useState<boolean | null>(null);
  const [activeGradeId, setActiveGradeId] = useState<string>("gr11");
  const [activeGrade, setActiveGrade] = useState<string>("Grade 11 (NSSCO)");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");
  const [refreshing, setRefreshing] = useState(false);
  const [showManageSubjects, setShowManageSubjects] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] =
    useState<OfflineBootstrapProgress | null>(null);

  // Load persistence data
  const loadUserData = async () => {
    try {
      // 1. Check if returning user
      const hasVisited = await AsyncStorage.getItem("has_visited_landing");
      if (hasVisited === "true") {
        setIsReturningUser(true);
      } else {
        setIsReturningUser(false);
        await AsyncStorage.setItem("has_visited_landing", "true");
      }

      // 2. Load Grade. The id is what content is keyed by; the name is only
      // ever a label, derived from the id.
      const storedGradeId = await AsyncStorage.getItem("user_grade_id");
      const storedGrade = await AsyncStorage.getItem("user_grade");
      const gradeId = resolveGradeId(
        params.gradeId || storedGradeId || params.grade || storedGrade
      );
      setActiveGradeId(gradeId);
      setActiveGrade(getGradeLabel(gradeId));

      // 3. Load Selected Subjects
      const storedSubjects = await AsyncStorage.getItem("user_subjects");
      if (storedSubjects) {
        try {
          const parsed = JSON.parse(storedSubjects);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedSubjectIds(parsed);
          } else {
            // Default fallback if array is empty: popular subjects
            setSelectedSubjectIds(["math", "phys", "bio", "eng2", "geo"]);
          }
        } catch {
          setSelectedSubjectIds(["math", "phys", "bio", "eng2", "geo"]);
        }
      } else {
        setSelectedSubjectIds(["math", "phys", "bio", "eng2", "geo"]);
      }
    } catch (e) {
      console.warn("Error loading user data", e);
      setSelectedSubjectIds(["math", "phys", "bio", "eng2", "geo"]);
    }
  };

  useEffect(() => {
    // Deferred so state updates happen after the effect, not synchronously inside it.
    const task = setTimeout(() => {
      loadUserData();
    }, 0);
    return () => clearTimeout(task);
    // loadUserData only depends on the grade params
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.grade, params.gradeId]);

  useEffect(() => {
    getUserPath().then((path) => {
      if (path === "explorer") {
        router.replace("/explore");
      }
    });
  }, [router]);

  useEffect(() => {
    void hydrateOfflineFiles();
    void syncLessons();
    void syncCurriculum();
  }, []);

  useEffect(() => {
    if (activeTab === "explore") {
      void syncExploreEntries(true);
    }
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUserData(), syncLessons(true), syncCurriculum(true)]);
    setRefreshing(false);
  };

  // Resolve user's selected subjects
  const userSubjects: SubjectOption[] = useMemo(() => {
    if (selectedSubjectIds.length === 0) return [];
    return selectedSubjectIds
      .map((id) => CURRICULUM_SUBJECTS.find((sub) => sub.id === id))
      .filter((sub): sub is SubjectOption => Boolean(sub));
  }, [selectedSubjectIds]);

  // Filtered subjects based on search & category
  const filteredSubjects = useMemo(() => {
    return userSubjects.filter((subject) => {
      const matchesSearch =
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.namibianContext
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "All" || subject.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [userSubjects, searchQuery, activeCategory]);

  // Dynamic time greeting
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const categories: CategoryFilter[] = useMemo(() => {
    const present = new Set(userSubjects.map((s) => s.category));
    const order: Exclude<CategoryFilter, "All">[] = [
      "Languages",
      "Sciences",
      "Arts",
      "Life Skills",
      "Commercials",
      "Humanities",
    ];
    return ["All", ...order.filter((cat) => present.has(cat))];
  }, [userSubjects]);

  const availableToAdd = useMemo(() => {
    const selected = new Set(selectedSubjectIds);
    return getSubjectsForGrade(activeGradeId).filter((s) => !selected.has(s.id));
  }, [activeGradeId, selectedSubjectIds]);

  const persistSubjectIds = async (nextIds: string[]) => {
    setSelectedSubjectIds(nextIds);
    try {
      await AsyncStorage.setItem("user_subjects", JSON.stringify(nextIds));
    } catch (e) {
      console.warn("Failed to save subjects", e);
    }
  };

  const handleAddSubject = (subject: SubjectOption) => {
    if (selectedSubjectIds.includes(subject.id) || isDownloading) return;

    Alert.alert(
      `Add ${subject.name}?`,
      "Internet is required to download this subject's content for offline study.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Download & add",
          onPress: () => {
            void (async () => {
              const online = await isDeviceOnline();
              if (!online) {
                Alert.alert(
                  "Internet required",
                  "Connect to the internet to add a subject. Content is saved on your device for offline learning.",
                );
                return;
              }

              const nextIds = [...selectedSubjectIds, subject.id];
              setIsDownloading(true);
              setDownloadProgress({
                phase: "checking",
                message: `Downloading ${subject.name}…`,
              });

              try {
                const result = await bootstrapLearnerOffline({
                  gradeId: activeGradeId,
                  subjectIds: nextIds,
                  onProgress: setDownloadProgress,
                });
                if (!result.ok) {
                  Alert.alert(
                    "Download failed",
                    result.error ||
                      "Could not download this subject. Check your connection and try again.",
                  );
                  return;
                }
                await persistSubjectIds(nextIds);
                await AsyncStorage.setItem("offline_content_ready", "true");
              } finally {
                setIsDownloading(false);
                setDownloadProgress(null);
              }
            })();
          },
        },
      ],
    );
  };

  const handleRemoveSubject = (subject: SubjectOption) => {
    if (selectedSubjectIds.length <= 1) {
      Alert.alert(
        "Keep at least one subject",
        "You need at least one subject on your home page. Add another subject before removing this one.",
      );
      return;
    }

    Alert.alert(
      `Remove ${subject.name}?`,
      `If you remove this subject, all of its data on this device will be cleared — including lesson progress, quiz scores, and reading history.\n\nThis cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove & clear data",
          style: "destructive",
          onPress: () => {
            void (async () => {
              await clearSubjectLocalData(activeGradeId, subject.id);
              const next = selectedSubjectIds.filter((id) => id !== subject.id);
              await persistSubjectIds(next);
            })();
          },
        },
      ],
    );
  };

  const handleEditSetup = () => {
    Alert.alert(
      "Edit your setup?",
      `You are currently on ${activeGrade} with ${userSubjects.length} subject${userSubjects.length === 1 ? "" : "s"}.\n\nContinue to change your learning path, grade, or subjects?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Edit setup",
          style: "default",
          onPress: () => router.push("/choose-path"),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {activeTab === "home" ? (
        <View style={[styles.homePane, { paddingTop: insets.top }]}>
          {/* Top Navbar */}
          <View style={styles.navBar}>
            <View style={styles.brandGroup}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.navLogo}
                contentFit="contain"
              />
              <View>
                <View style={styles.titleRow}>
                  <Text style={styles.navBrandText}>edu</Text>
                  <Text style={styles.navBrandAccent}>Namibia</Text>
                </View>
                <Text style={styles.navSubText}>National Digital Library</Text>
              </View>
            </View>

            <Pressable
              onPress={handleEditSetup}
              style={({ pressed }) => [
                styles.navEditSetupBtn,
                pressed && styles.pressedState,
              ]}
              hitSlop={8}
              accessibilityLabel="Edit setup"
            >
              <Text style={styles.navEditSetupText}>Edit setup</Text>
            </Pressable>
          </View>

          <FlatList
            data={filteredSubjects}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={NAMIBIA_BLUE}
              />
            }
            contentContainerStyle={styles.scrollListContent}
            ListHeaderComponent={
              <View style={styles.headerSection}>
                {/* Dynamic Welcome / Welcome Back Hero Banner */}
                <View style={styles.greetingCard}>
                  <LinearGradient
                    colors={
                      isReturningUser
                        ? [NAMIBIA_BLUE, "#1A3B8B", "#0B2256"]
                        : ["#002B7F", "#0455BF", "#009A44"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.greetingGradient}
                  >
                    {/* Namibian Sun Accent Bar */}
                    <View style={styles.greetingTopSunBar} />

                    <View style={styles.greetingContent}>
                      <View style={styles.greetingTagRow}>
                        <View style={styles.greetingStatusBadge}>
                          <Text style={styles.greetingStatusIcon}>
                            {isReturningUser ? "🇳🇦" : "🎉"}
                          </Text>
                          <Text style={styles.greetingStatusText}>
                            {isReturningUser
                              ? "ACTIVE LEARNER"
                              : "SETUP COMPLETED"}
                          </Text>
                        </View>
                      </View>

                      {/* Dynamic Greeting Title */}
                      <Text style={styles.greetingTitle}>
                        {isReturningUser
                          ? `${timeGreeting}, Learner! 👋`
                          : "Welcome to Edu-Learning Namibia! 🇳🇦"}
                      </Text>

                      {/* Subtitle */}
                      <Text style={styles.greetingSubtitle}>
                        {isReturningUser
                          ? "Welcome back! Your selected curriculum is ready for offline study. Pick a subject below to continue."
                          : "Here is your personalized Namibian curriculum. Access subject materials, past exam papers, and quizzes from your teachers."}
                      </Text>

                      {/* Info Pill Ribbon */}
                      <View style={styles.infoPillRow}>
                        <View style={styles.curriculumPill}>
                          <Text style={styles.curriculumPillIcon}>🎓</Text>
                          <Text
                            style={styles.curriculumPillText}
                            numberOfLines={1}
                          >
                            {activeGrade}
                          </Text>
                        </View>
                        <View style={styles.curriculumPill}>
                          <Text style={styles.curriculumPillIcon}>📚</Text>
                          <Text style={styles.curriculumPillText}>
                            {userSubjects.length} Selected Subjects
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        onPress={handleEditSetup}
                        style={({ pressed }) => [
                          styles.editSetupCta,
                          pressed && styles.pressedState,
                        ]}
                        accessibilityLabel="Edit setup"
                      >
                        <Text style={styles.editSetupCtaText}>
                          Edit grade & subjects
                        </Text>
                        <Text style={styles.editSetupCtaArrow}>→</Text>
                      </Pressable>
                    </View>
                  </LinearGradient>
                </View>

                {/* Search Input Box */}
                <View style={styles.searchSection}>
                  <View style={styles.searchBar}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                      placeholder="Search your subjects or topics..."
                      placeholderTextColor="#94A3B8"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      style={styles.searchInput}
                    />
                    {searchQuery.length > 0 && (
                      <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                        <Text style={styles.clearSearchText}>✕</Text>
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* Category Filter Pills */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScroll}
                >
                  {categories.map((cat) => {
                    const isSelected = activeCategory === cat;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setActiveCategory(cat)}
                        style={({ pressed }) => [
                          styles.categoryTab,
                          isSelected && styles.categoryTabActive,
                          pressed && styles.pressedState,
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryTabText,
                            isSelected && styles.categoryTabTextActive,
                          ]}
                        >
                          {cat === "All" ? `All (${userSubjects.length})` : cat}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Section Header */}
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>
                      Your Selected Subjects
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                      Curated with official Namibian study resources
                    </Text>
                  </View>
                  <Text style={styles.subjectCountBadge}>
                    {userSubjects.length}
                  </Text>
                </View>
              </View>
            }
            renderItem={({ item }) => (
              <SubjectLandscapeCard
                subject={item}
                grade={activeGrade}
                onPress={() => {
                  router.push({
                    pathname: "/subject",
                    params: {
                      id: item.id,
                      gradeId: activeGradeId,
                      grade: activeGrade,
                    },
                  });
                }}
                onRemove={() => handleRemoveSubject(item)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>
                  No matching subjects found
                </Text>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? `No selected subjects match "${searchQuery}". Try a different keyword.`
                    : "You have not selected any subjects in this category."}
                </Text>
                <Pressable
                  onPress={() => setShowManageSubjects(true)}
                  style={styles.resetFilterBtn}
                >
                  <Text style={styles.resetFilterBtnText}>
                    Add subjects
                  </Text>
                </Pressable>
              </View>
            }
          />

          <Modal
            visible={showManageSubjects}
            animationType="slide"
            transparent
            onRequestClose={() => setShowManageSubjects(false)}
          >
            <View style={styles.manageBackdrop}>
              <View
                style={[
                  styles.manageSheet,
                  { paddingBottom: Math.max(insets.bottom, 16) },
                ]}
              >
                <View style={styles.manageHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.manageTitle}>Manage subjects</Text>
                    <Text style={styles.manageSubtitle}>
                      Add more for {activeGrade}, or remove one (clears its data)
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setShowManageSubjects(false)}
                    hitSlop={10}
                  >
                    <Text style={styles.manageClose}>✕</Text>
                  </Pressable>
                </View>

                <ScrollView
                  style={styles.manageScroll}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.manageSectionLabel}>
                    Your subjects ({userSubjects.length})
                  </Text>
                  {userSubjects.map((subject) => (
                    <View key={subject.id} style={styles.manageRow}>
                      <View style={styles.manageRowText}>
                        <Text style={styles.manageRowTitle}>
                          {subject.icon} {subject.name}
                        </Text>
                        <Text style={styles.manageRowMeta}>
                          {subject.category} · {subject.code}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleRemoveSubject(subject)}
                        style={styles.manageRemoveBtn}
                      >
                        <Text style={styles.manageRemoveBtnText}>Remove</Text>
                      </Pressable>
                    </View>
                  ))}

                  <Text style={[styles.manageSectionLabel, { marginTop: 18 }]}>
                    Add more ({availableToAdd.length})
                  </Text>
                  {availableToAdd.length === 0 ? (
                    <Text style={styles.manageEmptyAdd}>
                      All subjects for this grade are already on your list.
                    </Text>
                  ) : (
                    availableToAdd.map((subject) => (
                      <View key={subject.id} style={styles.manageRow}>
                        <View style={styles.manageRowText}>
                          <Text style={styles.manageRowTitle}>
                            {subject.icon} {subject.name}
                          </Text>
                          <Text style={styles.manageRowMeta}>
                            {subject.category} · {subject.code}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => handleAddSubject(subject)}
                          style={styles.manageAddBtn}
                        >
                          <Text style={styles.manageAddBtnText}>Add</Text>
                        </Pressable>
                      </View>
                    ))
                  )}
                </ScrollView>

                <Pressable
                  onPress={() => setShowManageSubjects(false)}
                  style={styles.manageDoneBtn}
                >
                  <Text style={styles.manageDoneBtnText}>Done</Text>
                </Pressable>
              </View>
            </View>
          </Modal>

          <Modal visible={isDownloading} transparent animationType="fade">
            <View style={styles.downloadBackdrop}>
              <View style={styles.downloadCard}>
                <ActivityIndicator size="large" color={NAMIBIA_BLUE} />
                <Text style={styles.downloadTitle}>Saving for offline</Text>
                <Text style={styles.downloadMessage}>
                  {downloadProgress?.message ||
                    "Downloading subject content for offline study…"}
                </Text>
                {downloadProgress?.total ? (
                  <Text style={styles.downloadCount}>
                    {downloadProgress.current || 0} / {downloadProgress.total}
                  </Text>
                ) : null}
              </View>
            </View>
          </Modal>
        </View>
      ) : (
        <ExploreMapPane bottomOffset={Math.max(insets.bottom, 10) + 72} />
      )}

      {activeTab === "home" ? (
        <Pressable
          onPress={() => setShowManageSubjects(true)}
          style={({ pressed }) => [
            styles.manageFab,
            { bottom: Math.max(insets.bottom, 10) + 78 },
            pressed && styles.pressedState,
          ]}
          accessibilityLabel="Add or remove subjects"
        >
          <Text style={styles.manageFabText}>±</Text>
        </Pressable>
      ) : null}

      {/* Bottom Tabs: Home | Explore */}
      <View
        style={[
          styles.bottomTabBar,
          { paddingBottom: Math.max(insets.bottom, 10) },
        ]}
      >
        <Pressable
          onPress={() => setActiveTab("home")}
          style={({ pressed }) => [
            styles.bottomTab,
            activeTab === "home" && styles.bottomTabActive,
            pressed && styles.pressedState,
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "home" }}
        >
          <Text
            style={[
              styles.bottomTabIcon,
              activeTab === "home" && styles.bottomTabIconActive,
            ]}
          >
            ⌂
          </Text>
          <Text
            style={[
              styles.bottomTabLabel,
              activeTab === "home" && styles.bottomTabLabelActive,
            ]}
          >
            Home
          </Text>
          {activeTab === "home" && <View style={styles.bottomTabDot} />}
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("explore")}
          style={({ pressed }) => [
            styles.bottomTab,
            activeTab === "explore" && styles.bottomTabActive,
            pressed && styles.pressedState,
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "explore" }}
        >
          <Text
            style={[
              styles.bottomTabIcon,
              activeTab === "explore" && styles.bottomTabIconActive,
            ]}
          >
            ◎
          </Text>
          <Text
            style={[
              styles.bottomTabLabel,
              activeTab === "explore" && styles.bottomTabLabelActive,
            ]}
          >
            Explore
          </Text>
          {activeTab === "explore" && <View style={styles.bottomTabDot} />}
        </Pressable>
      </View>
    </View>
  );
}

// Sub-Component: Landscape Card with Namibian photographic background & Gradient Overlay
interface SubjectLandscapeCardProps {
  subject: SubjectOption;
  grade: string;
  onPress: () => void;
  onRemove?: () => void;
}

function SubjectLandscapeCard({
  subject,
  grade,
  onPress,
  onRemove,
}: SubjectLandscapeCardProps) {
  return (
    <View style={styles.cardContainer}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.cardPressArea, pressed && styles.cardPressed]}
      >
        <Image
          source={{ uri: subject.namibianImage }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
          priority="high"
        />

        <LinearGradient
          colors={[
            "rgba(15, 23, 42, 0.25)",
            "rgba(0, 43, 127, 0.72)",
            "rgba(2, 6, 23, 0.94)",
          ]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.cardSunBar} />

        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <View style={styles.badgePill}>
              <Text style={styles.badgeIcon}>{subject.icon}</Text>
              <Text style={styles.badgeCategoryText}>
                {subject.category} • {subject.code}
              </Text>
            </View>

            <View style={styles.filesCountPill}>
              <Text style={styles.filesCountText}>
                📄 {subject.availableMaterialsCount} Materials
              </Text>
            </View>
          </View>

          <View style={styles.cardMiddleRow}>
            <View style={styles.namibiaTag}>
              <Text style={styles.namibiaFlagIcon}>🇳🇦</Text>
              <Text style={styles.namibiaTagText} numberOfLines={1}>
                {subject.namibianContext}
              </Text>
            </View>
          </View>

          <View style={styles.cardBottomRow}>
            <View style={styles.cardTitleBox}>
              <Text style={styles.cardSubjectName} numberOfLines={1}>
                {subject.name}
              </Text>
              <Text style={styles.cardGradeText}>
                {grade} • Syllabi & Past Papers
              </Text>
            </View>

            <View style={styles.cardActionBtn}>
              <Text style={styles.cardActionText}>Study →</Text>
            </View>
          </View>
        </View>
      </Pressable>

      {onRemove ? (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          style={styles.cardRemoveBtn}
          accessibilityLabel={`Remove ${subject.name}`}
        >
          <Text style={styles.cardRemoveBtnText}>Remove</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  brandGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  navLogo: {
    width: 38,
    height: 38,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  navBrandText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  navBrandAccent: {
    fontSize: 18,
    fontWeight: "900",
    color: NAMIBIA_BLUE,
  },
  navSubText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  navEditSetupBtn: {
    backgroundColor: NAMIBIA_YELLOW,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6B800",
  },
  navEditSetupText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0B1B33",
  },

  // Header Section
  scrollListContent: {
    paddingBottom: 100,
  },
  headerSection: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  greetingCard: {
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: NAMIBIA_BLUE,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: "0 6px 16px rgba(0, 43, 127, 0.2)",
      },
    }),
  },
  greetingGradient: {
    padding: 18,
    position: "relative",
  },
  greetingTopSunBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: NAMIBIA_YELLOW,
  },
  greetingContent: {
    gap: 8,
  },
  greetingTagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  greetingStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  greetingStatusIcon: {
    fontSize: 12,
  },
  greetingStatusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  editSetupCta: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  editSetupCtaText: {
    fontSize: 14,
    fontWeight: "800",
    color: NAMIBIA_BLUE,
  },
  editSetupCtaArrow: {
    fontSize: 16,
    fontWeight: "800",
    color: NAMIBIA_BLUE,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: "#E0E7FF",
    lineHeight: 19,
    fontWeight: "500",
  },
  infoPillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    flexWrap: "wrap",
  },
  curriculumPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  curriculumPillIcon: {
    fontSize: 13,
  },
  curriculumPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Search
  searchSection: {
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
      },
    }),
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
  },
  clearSearchText: {
    fontSize: 13,
    color: "#94A3B8",
    paddingHorizontal: 4,
  },

  // Category Tabs
  categoryScroll: {
    gap: 8,
    paddingBottom: 16,
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  categoryTabActive: {
    backgroundColor: NAMIBIA_BLUE,
    borderColor: NAMIBIA_BLUE,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  categoryTabTextActive: {
    color: "#FFFFFF",
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  subjectCountBadge: {
    fontSize: 12,
    fontWeight: "800",
    color: NAMIBIA_BLUE,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    overflow: "hidden",
  },
  manageFab: {
    position: "absolute",
    right: 18,
    zIndex: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: NAMIBIA_BLUE,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: NAMIBIA_BLUE,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: "0 8px 18px rgba(0, 43, 127, 0.28)",
      },
    }),
  },
  manageFabText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
    marginTop: -2,
  },
  manageBackdrop: {
    flex: 1,
    backgroundColor: "rgba(11, 27, 51, 0.45)",
    justifyContent: "flex-end",
  },
  manageSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "82%",
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  manageHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  manageTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  manageSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 18,
  },
  manageClose: {
    fontSize: 18,
    color: "#64748B",
    fontWeight: "700",
    padding: 4,
  },
  manageScroll: {
    maxHeight: 420,
  },
  manageSectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: NAMIBIA_BLUE,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  manageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  manageRowText: {
    flex: 1,
  },
  manageRowTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  manageRowMeta: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
    fontWeight: "600",
  },
  manageRemoveBtn: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  manageRemoveBtnText: {
    color: NAMIBIA_RED,
    fontWeight: "800",
    fontSize: 12,
  },
  manageAddBtn: {
    backgroundColor: "#E6F6ED",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  manageAddBtnText: {
    color: "#007A36",
    fontWeight: "800",
    fontSize: 12,
  },
  manageEmptyAdd: {
    fontSize: 13,
    color: "#94A3B8",
    marginBottom: 8,
    lineHeight: 19,
  },
  manageDoneBtn: {
    marginTop: 14,
    backgroundColor: NAMIBIA_BLUE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  manageDoneBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
  downloadBackdrop: {
    flex: 1,
    backgroundColor: "rgba(11, 27, 51, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  downloadCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: "center",
  },
  downloadTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  downloadMessage: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
    textAlign: "center",
  },
  downloadCount: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "800",
    color: NAMIBIA_BLUE,
  },

  // Landscape Subject Cards with Namibian Background Images
  cardContainer: {
    height: 185,
    marginHorizontal: 18,
    marginBottom: 16,
    borderRadius: 22,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#0F172A",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: "0 6px 18px rgba(0, 0, 0, 0.14)",
      },
    }),
  },
  cardPressArea: {
    flex: 1,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  cardSunBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3.5,
    backgroundColor: NAMIBIA_YELLOW,
    zIndex: 2,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
    zIndex: 3,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingRight: 72,
  },
  cardRemoveBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 5,
    backgroundColor: "rgba(210, 16, 52, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  cardRemoveBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  badgeIcon: {
    fontSize: 13,
  },
  badgeCategoryText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  filesCountPill: {
    backgroundColor: "rgba(0, 154, 68, 0.85)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  filesCountText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cardMiddleRow: {
    marginTop: 10,
  },
  namibiaTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  namibiaFlagIcon: {
    fontSize: 12,
  },
  namibiaTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F8FAFC",
    letterSpacing: 0.2,
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitleBox: {
    flex: 1,
  },
  cardSubjectName: {
    fontSize: 21,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
    marginBottom: 3,
    ...Platform.select({
      ios: {
        textShadowColor: "rgba(0, 0, 0, 0.75)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
      android: {
        textShadowColor: "rgba(0, 0, 0, 0.75)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },
  cardGradeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#CBD5E1",
  },
  cardActionBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: "800",
    color: NAMIBIA_BLUE,
  },

  // Empty State
  emptyContainer: {
    padding: 36,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  resetFilterBtn: {
    backgroundColor: NAMIBIA_BLUE,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  resetFilterBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pressedState: {
    opacity: 0.75,
  },

  homePane: {
    flex: 1,
  },

  // Bottom Tabs
  bottomTabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
    paddingTop: 6,
    paddingHorizontal: 24,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bottomTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 16,
    gap: 2,
  },
  bottomTabActive: {
    backgroundColor: "rgba(232, 74, 127, 0.1)",
  },
  bottomTabIcon: {
    fontSize: 20,
    color: "#64748B",
    fontWeight: "600",
  },
  bottomTabIconActive: {
    color: MAP_PIN_PINK,
  },
  bottomTabLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  bottomTabLabelActive: {
    color: MAP_PIN_PINK,
  },
  bottomTabDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: MAP_PIN_PINK,
    marginTop: 2,
  },

  // Explore — full-screen map
  explorePane: {
    flex: 1,
    backgroundColor: "#D4C4A8",
  },
  mapSearchWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 10,
  },
  mapSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mapSearchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
      },
    }),
  },
  mapClearBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  mapClearBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: MAP_PIN_PINK,
  },
  mapSearchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  mapSearchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    paddingVertical: 2,
  },
  mapSearchResults: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: 220,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  mapSearchResultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  mapSearchResultName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  mapSearchResultCapital: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  mapSearchEmpty: {
    padding: 16,
    textAlign: "center",
    color: "#64748B",
    fontSize: 13,
  },
  mapPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: MAP_PIN_PINK,
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  mapPinSelected: {
    backgroundColor: NAMIBIA_RED,
    transform: [{ scale: 1.12 }],
  },
  mapPinStem: {
    width: 3,
    height: 10,
    borderRadius: 1.5,
    backgroundColor: "#1A1A1A",
  },
  regionNameBanner: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    zIndex: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  regionNameBannerLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: MAP_PIN_PINK,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  regionNameBannerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  regionNameBannerCapital: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 4,
  },
  webMapFallback: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  webMapFallbackTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
  },
  webMapFallbackText: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
});
