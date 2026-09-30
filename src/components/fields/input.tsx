import { TextInput, View } from "react-native";
import { SvgProps } from "react-native-svg";

interface AuroraInputProps {
  value: string;
  onChangeText: (text: string) => void;
  className?: string;
  LeftIcon?: React.FC<SvgProps>;
  RightIcon?: React.FC<SvgProps>;
  placeholder?: string;
}

export default function AuroraInput({ value, onChangeText, className, LeftIcon, RightIcon, placeholder }: AuroraInputProps) {
  return (
    <View className={`flex flex-row w-fit items-center gap-[10px] border border-border bg-card rounded-[12px] px-[13px] h-[44px] ${className}`}>
      {LeftIcon && <LeftIcon width={18} height={18} />}
      <TextInput
        className="font-inter-semibold text-[12px] w-[100%]"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
      />
      {RightIcon && <RightIcon width={18} height={18} />}
    </View>
  )
}