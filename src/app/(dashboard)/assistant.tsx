import { Image } from "expo-image";
import { ScrollView, Text, View } from "react-native";

export default function Assistant() {
  return (
    <View className="flex flex-1 w-full" style={{ width: "100%", height: "100%", }}>
      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-[18px] pb-[200px]"
      >
        <View className="relative px-[28px] py-[36px] rounded-[12px]" style={{ width: "100%", height: "100%", }}>
          <Text>djsandkaksdhbkjasndkj</Text>
          <Image
            source={require("@/assets/images/bg.png")}
            style={{
              width: "100%",
              height: "100%",
            }}
            className="absolute"
          />
        </View>
      </ScrollView>
    </View>
  );
}