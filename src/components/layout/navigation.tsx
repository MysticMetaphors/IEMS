import Attendance from "@/assets/icons/sidebar/attendance.svg";
import Classes from "@/assets/icons/sidebar/classes.svg";
import Overview from "@/assets/icons/sidebar/overview.svg";
import Scheduling from "@/assets/icons/sidebar/scheduling.svg";
import Sparkle from "@/assets/icons/sidebar/sparkle.svg";
import Students from "@/assets/icons/sidebar/students.svg";

import ConcaveBorderAskSomething from "@/assets/navigation-concave.svg";

import { usePathname, useRouter } from "expo-router";
import React, { memo, useCallback, useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import type { SvgProps } from "react-native-svg";

type MenuItem = {
  label: string;
  route: string;
  icon: React.FC<SvgProps>;
};

const menus: MenuItem[] = [
  { label: "Overview", route: "/overview", icon: Overview },
  { label: "Scheduling", route: "/scheduling", icon: Scheduling },
  { label: "Classes", route: "/classes", icon: Classes },
  { label: "Students", route: "/students", icon: Students },
  { label: "Attendance", route: "/attendance", icon: Attendance },
];

function isActiveRoute(pathname: string, route: string) {
  return route === "/"
    ? pathname === "/" || pathname === "/index"
    : pathname.startsWith(route);
}

/**
 * Each button subscribes to the route on its own via usePathname().
 * That means navigating only re-renders the one or two NavItems whose
 * `active` flag actually flips - the parent Navigation (the "Ask
 * something" panel, background strip, etc.) never re-renders at all.
 */
const NavItem = memo(function NavItem({ label, route, icon: Icon }: MenuItem) {
  const pathname = usePathname();
  const router = useRouter();
  const active = isActiveRoute(pathname, route);

  const handlePress = useCallback(() => {
    if (!active) router.replace(route as any);
  }, [active, route, router]);

  return (
    <Pressable
      disabled={active}
      onPress={handlePress}
      className="h-[54px] w-[54px] items-center justify-center rounded-full border-[2px] border-border"
      style={{ backgroundColor: active ? "#000000" : "#FFFFFF" }}
    >
      <Icon
        height={24}
        width={24}
        style={{ color: active ? "#FFFFFF" : "#656565" }}
      />
    </Pressable>
  );
});


function Navigation() {
  const router = useRouter();
  const pathname = usePathname();

  const slideAnim = useRef(new Animated.Value(0)).current;
  const isAssistant = pathname === "/assistant";

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isAssistant ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isAssistant, slideAnim]);

  const handleAskSomething = useCallback(() => {
    router.replace("/assistant");
  }, [router]);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 240],
  });

  return (
    <View className="bg-white relative pt-[15px] pb-[50px] px-[41px] flex flex-row items-center justify-center gap-[14px] border-t border-border">
      <Animated.View
        pointerEvents={isAssistant ? "none" : "auto"}
        style={{
          position: "absolute",
          bottom: 118,
          right: 0,
          zIndex: 10,
          transform: [{ translateX }],
        }}
      >
        <View className="relative h-[75px] w-[200px] rounded-tl-[35px] pl-10 border-l border-t border-border bg-white">
          <ConcaveBorderAskSomething
            height={28}
            width={41}
            style={{
              position: "absolute",
              left: -40.1,
              bottom: -0.7,
              color: "#DFDFDF",
            }}
          />

          <Pressable
            onPress={handleAskSomething}
            className="absolute right-[16px] top-[14px] flex h-[48px] w-[170px] flex-row items-center gap-[10px] rounded-full border border-[#DFDFDF] bg-card px-[17px]"
          >
            <Sparkle height={22} width={22} fill="#666666" />
            <Text className="font-inter text-[12px] font-normal text-muted">
              Ask something
            </Text>
          </Pressable>
        </View>
      </Animated.View>

      <View className="absolute bottom-0 left-0 w-[100vw] bg-border h-[88px]" />

      {menus.map((menu) => (
        <NavItem key={menu.route} {...menu} />
      ))}
    </View>
  );
}


// No props, so once the parent layout has mounted this once, it will
// never re-render again unless React is forced to (e.g. a key change).
export default memo(Navigation);