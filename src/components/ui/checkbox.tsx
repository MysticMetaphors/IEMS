import { Text, View } from "react-native";

export default function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View className={`h-[20px] w-[20px] items-center justify-center rounded-[6px] border ${checked ? "bg-foreground border-foreground" : "bg-white border-border" }`}>
      {checked ? <Text className="text-[12px] leading-[14px] text-white">✓</Text> : null}
    </View>
  );
}