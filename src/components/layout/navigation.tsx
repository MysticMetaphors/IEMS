import Attendance from "@/assets/icons/sidebar/attendance.svg";
import Classes from "@/assets/icons/sidebar/classes.svg";
import Overview from "@/assets/icons/sidebar/overview.svg";
import Scheduling from "@/assets/icons/sidebar/scheduling.svg";
import Sparkle from "@/assets/icons/sidebar/sparkle.svg";
import Students from "@/assets/icons/sidebar/students.svg";

import ConcaveBorderAskSomething from "@/assets/navigation-concave.svg";

import { usePathname, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

const menus = [
  {
    label: "Overview",
    route: "/",
    icon: Overview,
  },
  {
    label: "Scheduling",
    route: "/scheduling",
    icon: Scheduling,
  },
  {
    label: "Classes",
    route: "/classes",
    icon: Classes,
  },
  {
    label: "Students",
    route: "/students",
    icon: Students,
  },
  {
    label: "Attendance",
    route: "/attendance",
    icon: Attendance,
  },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View className="bg-white relative pt-[15px] pb-[25px] px-[41px] flex flex-row items-center justify-center gap-[14px] border-t border-[#DFDFDF]">
      <View className="absolute bottom-full right-0 flex-row items-end z-10 translate-y-[1px] ">
        <View className="relative h-[75px] w-[200px] rounded-tl-[35px] pl-10 border-l border-t border-[#DFDFDF] bg-white">
          <ConcaveBorderAskSomething
            height={28}
            width={41}
            className="absolute left-[-39px] bottom-[-0.5px]"
          />
          <Pressable
            // onPress={() => router.push("/ask")}
            className="absolute right-[16px] top-[14px] flex h-[48px] w-[170px] flex-row items-center gap-[10px] rounded-full border border-[#DFDFDF] bg-card px-[17px]"
          >
            <Sparkle height={22} width={22} fill="#666666" />
            <Text className="font-inter text-[12px] font-normal text-muted">
              Ask something
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="absolute bottom-0 left-0 w-full bg-border h-[60%]"/>

      {menus.map((menu) => {
        const Icon = menu.icon;

        const active =
          menu.route === "/"
            ? pathname === "/" || pathname === "/index"
            : pathname.startsWith(menu.route);

        return (
          <Pressable
            key={menu.label}
            disabled={active}
            onPress={() => {
              if (!active) {
                router.push(menu.route as any);
              }
            }}
            className="h-[52px] w-[52px] items-center justify-center rounded-full border-[3px] border-border"
            style={{
              backgroundColor: active
                ? "#000000"
                : "#F1F1F1",
            }}
          >
            <Icon
              height={24}
              width={24}
              fill={active ? "#FFFFFF" : "#8E8E8E"}
            />
          </Pressable>
        );
      })}
    </View>
  );
}