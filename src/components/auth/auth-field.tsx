import CloseEye from "@/assets/icons/auth/eye-closed.svg";
import OpenEye from "@/assets/icons/auth/eye-open.svg";
import { ReactNode, Ref, useState } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";

type AuthFieldProps = TextInputProps & {
  label: string;
  error?: string;
  /** Hides the text and shows the eye toggle. */
  password?: boolean;
  /** Rendered at the right end of the label row. */
  labelAction?: ReactNode;
  ref?: Ref<TextInput>;
};

export default function AuthField({ label, error, password, labelAction, ref, ...props }: AuthFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <View className="gap-[4px]">
      <View className="flex-row justify-between">
        <Text className="text-[14px] text-text">{label}</Text>
        {labelAction}
      </View>

      <View
        className={`flex-row items-center gap-[10px] px-[18px] rounded-[12px] border bg-[#E9E9E9] ${
          error ? "border-[#D92D20]" : "border-border"
        }`}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          className="flex-1 min-w-0 py-[16px] text-[14px] text-foreground"
          placeholderTextColor="#ABABAB"
          secureTextEntry={password && !show}
          autoCapitalize={password ? "none" : undefined}
          autoCorrect={password ? false : undefined}
          {...props}
        />

        {password && (
          <Pressable
            onPress={() => setShow(!show)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          >
            {show ? <OpenEye /> : <CloseEye />}
          </Pressable>
        )}
      </View>

      {error && <Text className="text-[12px] text-[#D92D20]">{error}</Text>}
    </View>
  );
}
