import type { BottomTabBarProps } from "expo-router/tabs";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AITeacherIcon,
  ChatIcon,
  HomeIcon,
  LearnIcon,
  ProfileIcon,
} from "@/components/icons";
import { colors, typography } from "@/theme/tokens";

type TabIcon = (props: { size?: number; color?: string }) => React.ReactNode;

// Maps each tab route name to its label and icon.
const TAB_META: Record<string, { label: string; Icon: TabIcon }> = {
  home: { label: "Home", Icon: HomeIcon },
  learn: { label: "Learn", Icon: LearnIcon },
  "ai-teacher": { label: "AI Teacher", Icon: AITeacherIcon },
  chat: { label: "Chat", Icon: ChatIcon },
  profile: { label: "Profile", Icon: ProfileIcon },
};

const CIRCLE_SIZE = 52;
const ROW_HEIGHT = 58;
const ICON_SIZE = 24;

export default function TabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);

  const tabCount = state.routes.length;
  const tabWidth = barWidth / tabCount;

  // Animated horizontal position of the active circle.
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring(state.index * tabWidth, {
      damping: 16,
      stiffness: 140,
      mass: 0.6,
    });
  }, [state.index, tabWidth, translateX]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const activeRouteName = state.routes[state.index]?.name;
  const ActiveIcon = TAB_META[activeRouteName]?.Icon;

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom || 12 }]}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      <View style={styles.row}>
        {/* Moving active circle (only icon, no label) */}
        {barWidth > 0 && ActiveIcon && (
          <Animated.View
            pointerEvents="none"
            style={[styles.circleLayer, { width: tabWidth }, circleStyle]}
          >
            <View style={styles.circle}>
              <ActiveIcon size={ICON_SIZE} color="#ffffff" />
            </View>
          </Animated.View>
        )}

        {state.routes.map((route, index) => {
          const meta = TAB_META[route.name];
          if (!meta) return null;

          const { label, Icon } = meta;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
            >
              {/* Hidden while focused — the moving circle shows the icon instead */}
              <View style={[styles.tabContent, isFocused && styles.hidden]}>
                <Icon size={ICON_SIZE} color={colors.neutral.textSecondary} />
                <Text style={styles.label} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral.background,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    height: ROW_HEIGHT,
    alignItems: "center",
  },
  circleLayer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.lingua.purple,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.lingua.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: ROW_HEIGHT,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  hidden: {
    opacity: 0,
  },
  label: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.neutral.textSecondary,
  },
});
