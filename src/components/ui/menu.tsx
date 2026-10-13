import Ellipsis from "@/assets/icons/dots-vertical-rounded.svg";
import { useRef, useState } from "react";
import { Modal, Pressable, Text, useWindowDimensions, View } from "react-native";
import type { SvgProps } from "react-native-svg";

export type MenuItem = {
  label: string;
  onPress: () => void;
  icon?: React.ComponentType<SvgProps> | null; // nullable
  type?: "default" | "destructive" | "disabled"; // optional, default is "default"
};

type MenuProps = {
  items: MenuItem[];
};

export default function Menu({ items }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<View>(null);
  const { width: windowWidth } = useWindowDimensions();

  const openMenu = () => {
    // Measure the trigger so the menu can be placed right under it
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setPosition({
        top: y + height + 4,
        right: windowWidth - (x + width),
      });
      setOpen(true);
    });
  };

  const closeMenu = () => setOpen(false);

  const handleItemPress = (item: MenuItem) => {
    closeMenu();
    item.onPress();
  };

  return (
    <View className="self-end">
      <Pressable
        ref={triggerRef}
        collapsable={false}
        onPress={() => (open ? closeMenu() : openMenu())}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Toggle menu"
      >
        <Ellipsis height={22} width={22} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        statusBarTranslucent
        onRequestClose={closeMenu} // Android back button
      >
        <Pressable className="flex-1" onPress={closeMenu}>
          <Pressable
            onPress={() => {}}
            style={{ top: position.top, right: position.right }}
            className="absolute min-w-[100px] rounded-lg bg-white overflow-hidden border border-border"
          >
            {items.map((item, index) => {
              const Icon = item.icon;
              return (
                <Pressable
                  key={`${item.label}-${index}`}
                  onPress={() => handleItemPress(item)}
                  className={`flex-row items-center px-3.5 py-2 active:bg-gray-100 
                    ${ item.type === "destructive" ? "bg-red-600/10" : "" }
                    ${item.type === "disabled" ? "opacity-50 pointer-events-none" : ""}`
                  }
                >
                  {Icon ? (
                    <View className="mr-2.5">
                      <Icon height={18} width={18} />
                    </View>
                  ) : null}
                  <Text className={`text-[10px] ${ item.type === "destructive" ? "text-red-600" : "text-muted" } `}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}