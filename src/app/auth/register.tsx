import AuthField from "@/components/auth/auth-field";
import SocialSignIn from "@/components/auth/social-sign-in";
import { useAuth } from "@/lib/auth/auth-context";
import { passwordStrength, RegistrationInput, validateRegistration } from "@/lib/auth/validation";
import { errorMessage } from "@/lib/utils/error-message";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";

export default function Register() {
  const { height } = useWindowDimensions();
  const { register } = useAuth();
  const [values, setValues] = useState<RegistrationInput>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<ReturnType<typeof validateRegistration>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const strength = passwordStrength(values.password);
  const setValue = (key: keyof RegistrationInput) => (text: string) =>
    setValues((current) => ({ ...current, [key]: text }));

  async function handleSubmit() {
    if (submitting) return;

    const nextErrors = validateRegistration(values);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      // On success the route guard leaves this screen.
      await register(values);
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
          <Text className="text-[38px] leading-[34px] font-instrument text-foreground">Get Started!</Text>
          <Text className="text-[14px] text-text">create a new account</Text>
        </View>

        <View className="flex flex-row gap-[15px] w-full">
          <View className="flex-1">
            <AuthField
              label="Name"
              placeholder="Your name"
              value={values.name}
              onChangeText={setValue("name")}
              error={errors.name}
              autoComplete="name"
              textContentType="name"
            />
          </View>

          <View className="flex-1">
            <AuthField
              label="Email"
              placeholder="you@example.."
              value={values.email}
              onChangeText={setValue("email")}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
            />
          </View>
        </View>

        <View className="gap-[4px]">
          <AuthField
            label="Password"
            placeholder="At least 8 characters"
            password
            value={values.password}
            onChangeText={setValue("password")}
            error={errors.password}
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <View
            className="py-[2px] flex flex-row gap-[2px] w-full"
            accessible
            accessibilityLabel={`Password strength ${strength} of 4`}
          >
            {[1, 2, 3, 4].map((level) => (
              <View
                key={level}
                className={`flex-1 opacity-70 rounded-full h-[7px] ${level <= strength ? "bg-[#24C911]" : "bg-muted"}`}
              />
            ))}
          </View>
        </View>

        <AuthField
          label="Confirm Password"
          placeholder="Repeat your password"
          password
          value={values.confirmPassword}
          onChangeText={setValue("confirmPassword")}
          error={errors.confirmPassword}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />

        <Text className="text-[12px] text-text">
          Your account is stored only on this device. A forgotten password can&apos;t be recovered.
        </Text>

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
            {submitting ? "Creating account..." : "Sign-Up"}
          </Text>
        </Pressable>

        <SocialSignIn />

        <View className="flex-row justify-center gap-[4px]">
          <Text className="text-[14px] text-text">Already have account?</Text>
          <Link href="/auth/login" className="text-[14px] text-foreground font-semibold underline">Sign-in</Link>
        </View>

        <View className="h-[10px]" />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}