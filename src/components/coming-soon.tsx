import Sparkle from "@/assets/icons/sidebar/sparkle.svg";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

type ComingSoonProps = {
  title: string;
  description: string;
};

/**
 * Full-height placeholder for features that are not built yet.
 * Sits inside the dashboard layout, so it leaves room at the bottom
 * for the floating navigation bar.
 */
export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <View className="mb-[135px] flex-1 items-center justify-center overflow-hidden rounded-[12px] border border-border bg-card px-[28px]">
      <Image
        source={require("@/assets/images/bg.png")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        accessible={false}
      />
      <View className="absolute bottom-0 left-0 right-0 top-0 bg-black/50" />

      <View className="items-center gap-[14px]">
        <View className="h-[64px] w-[64px] items-center justify-center rounded-full border border-white/30 bg-white/15">
          <Sparkle height={32} width={32} style={{ color: "#FFFFFF" }} />
        </View>

        <View className="rounded-full border border-white/30 bg-white/20 px-[12px] py-[6px]">
          <Text className="font-inter-semibold text-[10px] text-white">
            Coming soon
          </Text>
        </View>

        <Text
          accessibilityRole="header"
          className="font-inter-bold text-[20px] text-white"
        >
          {title}
        </Text>

        <Text className="max-w-[280px] text-center font-inter text-[12px] leading-[18px] text-white/80">
          {description}
        </Text>
      </View>
    </View>
  );
}
