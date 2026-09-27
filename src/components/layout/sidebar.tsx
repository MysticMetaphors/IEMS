import Attendance from "@/assets/icons/sidebar/attendance.svg";
import Chevron from "@/assets/icons/sidebar/chevron.svg";
import Classes from "@/assets/icons/sidebar/classes.svg";
import Information from "@/assets/icons/sidebar/information.svg";
import Logout from "@/assets/icons/sidebar/logout.svg";
import Overview from "@/assets/icons/sidebar/overview.svg";
import Scheduling from "@/assets/icons/sidebar/scheduling.svg";
import Settings from "@/assets/icons/sidebar/settings.svg";
import Sparkle from "@/assets/icons/sidebar/sparkle.svg";
import Students from "@/assets/icons/sidebar/students.svg";
import { usePathname, useRouter } from "expo-router";

import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Image, Pressable, ScrollView, Text, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH - 8, 335);

type SidebarProps = {
  visible: boolean;
  onClose: () => void;
};

const menus = [
  {
    label: "Overview",
    icon: Overview,
  },
  {
    label: "Scheduling",
    icon: Scheduling,
  },
  {
    label: "Classes",
    icon: Classes,
  },
  {
    label: "Students",
    icon: Students,
  },
  {
    label: "Attendance",
    icon: Attendance,
  },
  {
    label: "Settings",
    icon: Settings,
  },
];

export default function Sidebar({ visible, onClose }: SidebarProps) {
  const [mounted, setMounted] = useState(visible);
  const router = useRouter();
  const pathname = usePathname();

  const translateX = useRef(
    new Animated.Value(-DRAWER_WIDTH)
  ).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);

      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 180,
        mass: 0.8,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: -DRAWER_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setMounted(false);
        }
      });
    }
  }, [visible, translateX]);

  if (!mounted) {
    return null;
  }

  return (
    <View className="absolute bottom-0 left-0 right-0 top-0 z-50">
      {/* <Pressable
        className="absolute bottom-0 left-0 right-0 top-0"
        onPress={onClose}
      /> */}

      <Animated.View
        style={{
          width: "100%",
          height: "100%",
          transform: [{ translateX }],
        }}
        className="absolute bottom-0 left-0 top-0"
      >
        <View className="h-full flex gap-[10px] border-r border-border bg-white px-[23px] py-[50px]">

          {/* Logo */}
          <View className="relative w-full">
            <Text className="w-full text-center font-oleo text-[32px]">
              Aurora
            </Text>

            <Pressable
              className="absolute right-0 top-1/2 -translate-y-1/2"
              onPress={onClose}
            >
              <Chevron height={34} width={34} />
            </Pressable>
          </View>

          {/* User */}
          <View className="flex w-full flex-row items-center">
            <Image
              source={require("@/assets/images/placeholder.png")}
              style={{
                width: 47,
                height: 47,
              }}
              className="rounded-full border border-white"
              resizeMode="cover"
            />

            <View className="ml-3">
              <Text className="font-inter text-[13px] font-semibold text-foreground">
                Hunter Ramos
              </Text>

              <Text className="font-inter text-[10px] font-normal text-muted">
                Standard Plan
              </Text>
            </View>
          </View>

          {/* Ask */}
          <Pressable onPress={() => router.push("/assistant")} className="flex w-full flex-row items-center gap-[10px] rounded-full border border-border bg-card px-[17px] py-[15px]">
            <Sparkle height={24} width={24} />

            <Text className="font-inter text-[12px] font-semibold text-muted">
              Ask something
            </Text>
          </Pressable>

          {/* Menu label */}
          <View className="flex flex-row items-center gap-[10px] overflow-hidden">
            <Text className="font-inter-medium text-[12px] text-foreground">
              Menu
            </Text>

            <View className="h-[1px] flex-1 bg-[#E7E7E7]" />
          </View>

          {/* Scrollable menu */}
          <ScrollView
            className="w-full flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerClassName="gap-[10px] pb-[10px]"
          >
            {menus.map((menu) => {
              const Icon = menu.icon;
              const lowercaseLabel = menu.label.toLowerCase();

              const targetPath =
                lowercaseLabel === "overview"
                  ? "/"
                  : `/${lowercaseLabel}`;

              const active = pathname === targetPath;

              return (
                <Pressable
                  key={menu.label}
                  onPress={() => {
                    onClose();
                    router.push(targetPath as any);
                  }}
                  className="w-full"
                >
                  {({ hovered }) => {
                    const highlighted = active || hovered;

                    return (
                      <View
                        className={`flex w-full flex-row items-center gap-[4px] rounded-[12px] border p-[17px] ${highlighted
                            ? "border-black bg-black"
                            : "border-border bg-card"
                          }`}
                      >
                        <Icon
                          height={19}
                          width={19}
                          fill={highlighted ? "#FFFFFF" : "#8E8E8E"}
                        />

                        <Text
                          className={`font-inter-semibold text-[12px] ${highlighted ? "text-white" : "text-muted"
                            }`}
                        >
                          {menu.label}
                        </Text>
                      </View>
                    );
                  }}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Fixed bottom actions */}
          <View className="w-full gap-[10px]">
            <Pressable className="flex w-full flex-row items-center gap-[4px] rounded-[12px] border border-border bg-card p-[17px]">
              <Information
                height={19}
                width={19}
                fill="#8E8E8E"
              />

              <Text className="font-inter-semibold text-[12px] text-foreground">
                Help & Information
              </Text>
            </Pressable>

            <Pressable className="flex w-full flex-row items-center gap-[4px] rounded-[12px] border border-border bg-card p-[17px]">
              <Logout
                height={19}
                width={19}
                fill="#8E8E8E"
              />

              <Text className="font-inter-semibold text-[12px] text-foreground">
                Logout
              </Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}