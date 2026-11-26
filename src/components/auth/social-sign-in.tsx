import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

const PROVIDERS = [
  { name: "Google", icon: require("@/assets/google.png") },
  { name: "Apple", icon: require("@/assets/apple.png") },
];

/** Not available: accounts are local to the device. Says so when tapped. */
export default function SocialSignIn() {
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <>
      <View className="flex-row items-center gap-[16px]">
        <View className="bg-muted flex-1 h-[0.5px]" />
        <Text className="text-foreground text-[14px] text-center">or continue with</Text>
        <View className="bg-muted flex-1 h-[0.5px]" />
      </View>

      <View className="flex-row gap-[16px]">
        {PROVIDERS.map(({ name, icon }) => (
          <Pressable
            key={name}
            accessibilityRole="button"
            onPress={() => setNotice(`${name} sign-in isn't available yet. Use your email and password.`)}
            className="flex-1 flex-row items-center justify-center gap-[10px] px-[18px] py-[16px] rounded-[12px] border border-border bg-[#E9E9E9]"
          >
            <Image source={icon} style={{ height: 24, width: 24 }} />
            <Text className="text-foreground text-[14px] font-semibold">{name}</Text>
          </Pressable>
        ))}
      </View>

      {notice && <Text className="text-[12px] text-text text-center">{notice}</Text>}
    </>
  );
}
