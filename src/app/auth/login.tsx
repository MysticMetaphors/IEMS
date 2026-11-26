import AuthField from "@/components/auth/auth-field";
import SocialSignIn from "@/components/auth/social-sign-in";
import { useAuth } from "@/lib/auth/auth-context";
import { validateSignIn } from "@/lib/auth/validation";
import { errorMessage } from "@/lib/utils/error-message";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";

export default function Login() {
  const { height } = useWindowDimensions();
  const { signIn, state } = useAuth();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<ReturnType<typeof validateSignIn>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (submitting) return;

    const nextErrors = validateSignIn({ email, password });
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      // On success the route guard leaves this screen.
      await signIn(email, password);
    } catch (error) {
      setFormError(errorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" className="flex flex-col flex-1">
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

        <AuthField
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <AuthField
          ref={passwordRef}
          label="Password"
          placeholder="Your password"
          password
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
          labelAction={
            <Pressable
              accessibilityRole="button"
              onPress={() => setNotice("Password reset isn't available: your account is stored only on this device.")}
            >
              <Text className="text-[14px] text-text underline">Forgot password?</Text>
            </Pressable>
          }
        />

        {notice && <Text className="text-[12px] text-text">{notice}</Text>}
        {formError && (
          <Text accessibilityRole="alert" className="text-[12px] text-[#D92D20]">{formError}</Text>
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
          className={`px-[18px] py-[16px] rounded-[12px] bg-foreground ${submitting ? "opacity-60" : ""}`}
        >
          <Text className="text-[14px] text-white font-semibold text-center">
            {submitting ? "Signing in..." : "Sign-in"}
          </Text>
        </Pressable>

        <SocialSignIn />

        {!state?.hasAccount && (
          <View className="flex-row justify-center gap-[4px]">
            <Text className="text-[14px] text-text">Don&apos;t have an account?</Text>
            <Link href="/auth/register" className="text-[14px] text-foreground font-semibold underline">Sign-up</Link>
          </View>
        )}

        <View className="h-[10px]" />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}