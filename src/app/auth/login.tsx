import CloseEye from "@/assets/icons/auth/eye-closed.svg";
import OpenEye from "@/assets/icons/auth/eye-open.svg";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";

export default function Login() {
  const { height } = useWindowDimensions();
  const [show, setShow] = useState(false)

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
          <Text className="text-[38px] leading-[34px] font-instrument text-foreground">Welcome Back!</Text>
          <Text className="text-[14px] text-text">Sign-in to your account</Text>
        </View>

        <View className="flex gap-[4px]">
          <Text className="text-[14px] text-text">Email</Text>
          <View className="flex flex-row justify-between px-[18px] py-[16px] rounded-[12px] border border-border bg-[#E9E9E9]">
            <Text className="text-[14px] text-[#ABABAB]">you@example.com</Text>
          </View>
        </View>
        <View className="flex gap-[4px]">
          <View className="flex flex-row justify-between">
            <Text className="text-[14px] text-text">Password</Text>
            <Link href="/auth/forgot-password" className="text-[14px] text-text underline">Forgot password?</Link>
          </View>
          <View className="flex flex-row justify-between px-[18px] py-[16px] rounded-[12px] border border-border bg-[#E9E9E9]">
            <Text className="text-[14px] text-[#ABABAB]">
              {show ? "Hsdi*3n40dn" : "••••••••"}
            </Text>

            <Pressable onPress={() => setShow(!show)}>
              {show ? <OpenEye /> : <CloseEye />}
            </Pressable>
          </View>

        </View>

        <Link href="/(dashboard)/overview" className="px-[18px] py-[16px] rounded-[12px] bg-foreground">
          <Text className="text-[14px] text-white font-semibold text-center">Sign-in</Text>
        </Link>

        <View className="flex-row items-center gap-[16px]">
          <View className="bg-muted flex-1 h-[0.5px]" />
          <Text className="text-foreground text-[14px] text-center">
            or continue with
          </Text>
          <View className="bg-muted flex-1 h-[0.5px]" />
        </View>

        <View className="flex flex-row gap-[16px]">
          <View className="flex-1 flex-row items-center justify-center gap-[10px] px-[18px] py-[16px] rounded-[12px] border border-border bg-[#E9E9E9]">
            <Image source={require("@/assets/google.png")} style={{ height: 24, width: 24 }} />
            <Text className="text-foreground text-[14px] font-semibold">Google</Text>
          </View>

          <View className="flex-1 flex-row items-center justify-center gap-[10px] px-[18px] py-[16px] rounded-[12px] border border-border bg-[#E9E9E9]">
            <Image source={require("@/assets/apple.png")} style={{ height: 24, width: 24 }} />
            <Text className="text-foreground text-[14px] font-semibold">Apple</Text>
          </View>
        </View>

        <View className="flex-row justify-center gap-[4px]">
          <Text className="text-[14px] text-text">Don&apos;t have an account?</Text>
          <Link href="/auth/register" className="text-[14px] text-foreground font-semibold underline">Sign-up</Link>
        </View>

        <View className="h-[10px]" />
      </ScrollView>
    </View>
  )
}