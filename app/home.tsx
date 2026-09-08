import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CURRICULUM_SUBJECTS, SubjectOption } from '@/constants/curriculum';

// Official Namibian colors
const NAMIBIA_BLUE = '#002B7F';
const NAMIBIA_RED = '#D21034';
const NAMIBIA_GREEN = '#009A44';
const NAMIBIA_YELLOW = '#FFCE00';

type CategoryFilter = 'All' | 'Sciences' | 'Languages' | 'Commercials' | 'Humanities';

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ grade?: string; subjectsCount?: string }>();
  const insets = useSafeAreaInsets();

  // State
  const [isReturningUser, setIsReturningUser] = useState<boolean | null>(null);
  const [activeGrade, setActiveGrade] = useState<string>('Grade 11 (NSSCO)');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [refreshing, setRefreshing] = useState(false);

  // Load persistence data
  const loadUserData = async () => {
    try {
      // 1. Check if returning user
      const hasVisited = await AsyncStorage.getItem('has_visited_landing');
      if (hasVisited === 'true') {
        setIsReturningUser(true);
      } else {
        setIsReturningUser(false);
        await AsyncStorage.setItem('has_visited_landing', 'true');
      }

      // 2. Load Grade
      const storedGrade = await AsyncStorage.getItem('user_grade');
      if (params.grade) {
        setActiveGrade(params.grade);
      } else if (storedGrade) {
        setActiveGrade(storedGrade);
      }

      // 3. Load Selected Subjects
      const storedSubjects = await AsyncStorage.getItem('user_subjects');
      if (storedSubjects) {
        try {
          const parsed = JSON.parse(storedSubjects);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedSubjectIds(parsed);
          } else {
            // Default fallback if array is empty: popular subjects
            setSelectedSubjectIds(['math', 'phys', 'bio', 'eng2', 'geo']);
          }
        } catch {
          setSelectedSubjectIds(['math', 'phys', 'bio', 'eng2', 'geo']);
        }
      } else {
        setSelectedSubjectIds(['math', 'phys', 'bio', 'eng2', 'geo']);
      }
    } catch (e) {
      console.warn('Error loading user data', e);
      setSelectedSubjectIds(['math', 'phys', 'bio', 'eng2', 'geo']);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [params.grade]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
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
        subject.namibianContext.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === 'All' || subject.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [userSubjects, searchQuery, activeCategory]);

  // Dynamic time greeting
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const categories: CategoryFilter[] = ['All', 'Sciences', 'Languages', 'Commercials', 'Humanities'];

  const handleNotificationPress = () => {
    Alert.alert(
      'Notifications 🔔',
      'You are up to date! New curriculum materials, study guides, and exam question papers will appear here.',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Top Navbar */}
      <View style={styles.navBar}>
        <View style={styles.brandGroup}>
          <Image
            source={require('@/assets/images/logo.png')}
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

        <View style={styles.navRight}>
          <Pressable
            onPress={handleNotificationPress}
            style={({ pressed }) => [styles.notificationBtn, pressed && styles.pressedState]}
            hitSlop={8}
            accessibilityLabel="Notifications"
          >
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.notificationBadgeDot} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filteredSubjects}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NAMIBIA_BLUE} />}
        contentContainerStyle={styles.scrollListContent}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Dynamic Welcome / Welcome Back Hero Banner */}
            <View style={styles.greetingCard}>
              <LinearGradient
                colors={
                  isReturningUser
                    ? [NAMIBIA_BLUE, '#1A3B8B', '#0B2256']
                    : ['#002B7F', '#0455BF', '#009A44']
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
                        {isReturningUser ? '🇳🇦' : '🎉'}
                      </Text>
                      <Text style={styles.greetingStatusText}>
                        {isReturningUser ? 'ACTIVE LEARNER' : 'SETUP COMPLETED'}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => router.push('/select-grade')}
                      style={({ pressed }) => [styles.editCurriculumBtn, pressed && styles.pressedState]}
                      hitSlop={8}
                    >
                      <Text style={styles.editCurriculumText}>Edit Setup ✏️</Text>
                    </Pressable>
                  </View>

                  {/* Dynamic Greeting Title */}
                  <Text style={styles.greetingTitle}>
                    {isReturningUser
                      ? `${timeGreeting}, Learner! 👋`
                      : 'Welcome to Edu-Learning Namibia! 🇳🇦'}
                  </Text>

                  {/* Subtitle */}
                  <Text style={styles.greetingSubtitle}>
                    {isReturningUser
                      ? 'Welcome back! Your selected curriculum is ready for offline study. Pick a subject below to continue.'
                      : 'Here is your personalized Namibian curriculum. Access approved textbooks, past exam papers, and marking memos.'}
                  </Text>

                  {/* Info Pill Ribbon */}
                  <View style={styles.infoPillRow}>
                    <View style={styles.curriculumPill}>
                      <Text style={styles.curriculumPillIcon}>🎓</Text>
                      <Text style={styles.curriculumPillText} numberOfLines={1}>
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
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
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
                      {cat === 'All' ? `All (${userSubjects.length})` : cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Section Header */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Your Selected Subjects</Text>
                <Text style={styles.sectionSubtitle}>
                  Curated with official Namibian study resources
                </Text>
              </View>
              <Text style={styles.subjectCountBadge}>
                {filteredSubjects.length} of {userSubjects.length}
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
                pathname: '/subject',
                params: {
                  id: item.id,
                  grade: activeGrade,
                },
              });
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No matching subjects found</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? `No selected subjects match "${searchQuery}". Try a different keyword.`
                : 'You have not selected any subjects in this category.'}
            </Text>
            <Pressable
              onPress={() => {
                setSearchQuery('');
                setActiveCategory('All');
              }}
              style={styles.resetFilterBtn}
            >
              <Text style={styles.resetFilterBtnText}>Show All Selected Subjects</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

// Sub-Component: Landscape Card with Namibian photographic background & Gradient Overlay
interface SubjectLandscapeCardProps {
  subject: SubjectOption;
  grade: string;
  onPress: () => void;
}

function SubjectLandscapeCard({ subject, grade, onPress }: SubjectLandscapeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cardContainer, pressed && styles.cardPressed]}
    >
      {/* Background Namibian Photographic Image */}
      <Image
        source={{ uri: subject.namibianImage }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={300}
        priority="high"
      />

      {/* Multi-Stop Namibian Tinted Gradient for Crystal Clear Text Contrast */}
      <LinearGradient
        colors={[
          'rgba(15, 23, 42, 0.25)',
          'rgba(0, 43, 127, 0.72)',
          'rgba(2, 6, 23, 0.94)',
        ]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Namibian Yellow Sun Top Accent Stripe */}
      <View style={styles.cardSunBar} />

      {/* Foreground Content */}
      <View style={styles.cardContent}>
        {/* Top Badges Row */}
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

        {/* Middle: Namibian Contextual Landscape Reference */}
        <View style={styles.cardMiddleRow}>
          <View style={styles.namibiaTag}>
            <Text style={styles.namibiaFlagIcon}>🇳🇦</Text>
            <Text style={styles.namibiaTagText} numberOfLines={1}>
              {subject.namibianContext}
            </Text>
          </View>
        </View>

        {/* Bottom Row: Subject Name & Action Button */}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navLogo: {
    width: 38,
    height: 38,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  navBrandText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  navBrandAccent: {
    fontSize: 18,
    fontWeight: '900',
    color: NAMIBIA_BLUE,
  },
  navSubText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
      },
    }),
  },
  notificationIcon: {
    fontSize: 18,
  },
  notificationBadgeDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: NAMIBIA_RED,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // Header Section
  scrollListContent: {
    paddingBottom: 32,
  },
  headerSection: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  greetingCard: {
    borderRadius: 22,
    overflow: 'hidden',
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
        boxShadow: '0 6px 16px rgba(0, 43, 127, 0.2)',
      },
    }),
  },
  greetingGradient: {
    padding: 18,
    position: 'relative',
  },
  greetingTopSunBar: {
    position: 'absolute',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  greetingStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  greetingStatusIcon: {
    fontSize: 12,
  },
  greetingStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  editCurriculumBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  editCurriculumText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: '#E0E7FF',
    lineHeight: 19,
    fontWeight: '500',
  },
  infoPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  curriculumPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  curriculumPillIcon: {
    fontSize: 13,
  },
  curriculumPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Search
  searchSection: {
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
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
    color: '#0F172A',
  },
  clearSearchText: {
    fontSize: 13,
    color: '#94A3B8',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  categoryTabActive: {
    backgroundColor: NAMIBIA_BLUE,
    borderColor: NAMIBIA_BLUE,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  subjectCountBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: NAMIBIA_BLUE,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },

  // Landscape Subject Cards with Namibian Background Images
  cardContainer: {
    height: 185,
    marginHorizontal: 18,
    marginBottom: 16,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 6px 18px rgba(0, 0, 0, 0.14)',
      },
    }),
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  cardSunBar: {
    position: 'absolute',
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
    justifyContent: 'space-between',
    zIndex: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeIcon: {
    fontSize: 13,
  },
  badgeCategoryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  filesCountPill: {
    backgroundColor: 'rgba(0, 154, 68, 0.85)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  filesCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardMiddleRow: {
    marginTop: 10,
  },
  namibiaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  namibiaFlagIcon: {
    fontSize: 12,
  },
  namibiaTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.2,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitleBox: {
    flex: 1,
  },
  cardSubjectName: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 3,
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
      android: {
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },
  cardGradeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  cardActionBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: NAMIBIA_BLUE,
  },

  // Empty State
  emptyContainer: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
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
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pressedState: {
    opacity: 0.75,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeroImage: {
    height: 160,
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalHeroContent: {
    zIndex: 2,
  },
  modalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalCategoryBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  modalCategoryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalSubjectName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  modalContextText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  modalTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  modalTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  modalTabActive: {
    borderBottomColor: NAMIBIA_BLUE,
    backgroundColor: '#FFFFFF',
  },
  modalTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  modalTabTextActive: {
    color: NAMIBIA_BLUE,
  },
  modalScrollList: {
    paddingHorizontal: 18,
    paddingTop: 12,
    maxHeight: 260,
  },
  materialItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  materialIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  materialIcon: {
    fontSize: 18,
  },
  materialInfo: {
    flex: 1,
  },
  materialTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  materialMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  downloadChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  downloadChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: NAMIBIA_BLUE,
  },
  modalActionBtn: {
    marginHorizontal: 18,
    marginTop: 12,
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalActionGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  buttonTopSunBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: NAMIBIA_YELLOW,
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
