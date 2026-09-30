import Search from "@/assets/icons/search.svg";
import { TextInput, View } from "react-native";

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  className?: string
}

export default function SearchInput({ value, onChangeText, className }: SearchInputProps) {
  return (
    <View className={`flex flex-row w-fit items-center gap-[10px] border border-border bg-card rounded-[12px] px-[13px] h-[44px] ${className}`}>
      <Search height={17} width={17} />

      <TextInput
        className="font-inter-semibold text-[12px] w-[100%]"
        placeholder="Search..."
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}