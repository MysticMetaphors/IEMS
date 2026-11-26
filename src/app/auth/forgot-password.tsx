import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";

export default function Forgotpassword() {
  const { height } = useWindowDimensions();

  return (
    <View className="flex flex-col flex-1">
      <View className="items-center justify-center" style={{ height: height * 0.4 }}>
        <Image
          source={require("@/assets/images/login.png")}
          style={{
            height: height * 0.4,
            width: "100%",
            position: "absolute"
          }}
          contentFit="cover"
          accessible={false}
        />
        <Text className="font-oleo text-white text-[44px]">Aurora</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-[38px] gap-[15px]"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="pb-[23px]">
          <Text className="text-[38px] leading-[45px] font-instrument text-foreground">Forgot Password?</Text>
          <Text className="text-[14px] text-text">
            Enter your email address and we’ll
            send 5-digit verification code
          </Text>
        </View>

        <View className="flex gap-[4px]">
          <Text className="text-[14px] text-text">Email</Text>
          <View className="w-fit flex-row px-[18px] py-[16px] rounded-[12px] border border-border bg-[#E9E9E9]">
            <Text className="text-[14px] text-[#ABABAB]">you@example..</Text>
          </View>
        </View>

        <Pressable className="px-[18px] py-[16px] rounded-[12px] bg-foreground">
          <Text className="text-[14px] text-white font-semibold text-center">Send Code</Text>
        </Pressable>

        <View className="flex-row justify-center gap-[4px]">
          <Text className="text-[14px] text-text">Already have account?</Text>
          <Link href="/auth/login" className="text-[14px] text-foreground font-semibold underline">Sign-in</Link>
        </View>

        <View className="h-[10px]" />
      </ScrollView>
    </View>
  )
}