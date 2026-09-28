import { Pressable, PressableProps, Text } from "react-native";
import { SvgProps } from "react-native-svg";

type ButtonProps = PressableProps & {
  LeftIcon?: React.FC<SvgProps>;
  RightIcon?: React.FC<SvgProps>;
  label: string;
};

export default function Button({ LeftIcon, RightIcon, label, ...props }: ButtonProps) {
  return (
    <Pressable {...props} className="px-[17px] rounded-[12px] h-[44px] bg-black flex flex-row gap-[8px] items-center w-fit">
      {LeftIcon && <LeftIcon width={18} height={18} />}
      <Text className="font-inter-semibold text-[12px] text-white">{label}</Text>
      {RightIcon && <RightIcon width={18} height={18} />}
    </Pressable>
  );
}