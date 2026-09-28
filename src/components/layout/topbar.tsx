import Notification from "@/assets/icons/topbar/bell.svg";
import Mail from "@/assets/icons/topbar/mail.svg";
import Menu from "@/assets/icons/topbar/menu.svg";

import { Image, Pressable, Text, View } from "react-native";

export default function Topbar({ onMenuPress }: { onMenuPress: () => void}) {
  return (
    <View className="flex flex-row justify-between items-center pb-[15px]">
      <Pressable onPress={onMenuPress}>
        <Menu
          height={34}
          width={34}
        />
      </Pressable>
      <View className="flex flex-row items-center gap-[7px]">
        <View className="border border-border bg-card rounded-full h-[48px] w-[48px] flex flex-row gap-[10px] items-center justify-center">
          <Mail 
            height={24}
            width={24}
          />
        </View>
        <View className="border border-border bg-card rounded-full h-[48px] px-[17px] flex flex-row gap-[10px] items-center">
          <Notification 
            height={24}
            width={24}
          />
          <Text className="text-muted font-inter-semibold text-[12px]">Notifications</Text>
        </View>
        <View className="bg-border/20 rounded-full w-[2px] h-[30px]"/>
        <Image
          source={require("@/assets/images/placeholder.png")}
          style={{
            width: 47,
            height: 47,
          }}
          className="rounded-full border border-white"
          resizeMode="cover"
        />
      </View>
    </View>
  )
}