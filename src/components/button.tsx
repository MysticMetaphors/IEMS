import { Pressable, PressableProps, Text } from "react-native";
import { SvgProps } from "react-native-svg";

type ButtonProps = PressableProps & {
  LeftIcon?: React.FC<SvgProps>;
  RightIcon?: React.FC<SvgProps>;
  label?: string;
  disabled?: boolean;
  classname?: string;
};

export default function Button({ LeftIcon, RightIcon, label, disabled, classname, ...props }: ButtonProps) {
  return (
    <Pressable {...props} disabled={disabled} className={`px-[17px] rounded-[12px] h-[44px] bg-black flex flex-row gap-[8px] items-center w-fit ${classname}`}>
      {LeftIcon && <LeftIcon width={18} height={18} />}
      {label && <Text className="font-inter-semibold text-[12px] text-white">{label}</Text>}
      {RightIcon && <RightIcon width={18} height={18} />}
    </Pressable>
  );
}