import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Modal, Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH;

type DrawerProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode; /** Optional actions shown on the left side of the footer. */
  footer?: React.ReactNode;
  visible_closeButton?: boolean;
  closeLabel?: string;
};

function CloseIcon({ size = 20, color = "#64748B" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 6l12 12M18 6L6 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function Drawer({ visible, onClose, title, children, footer, visible_closeButton, closeLabel = "Close" }: DrawerProps) {
  const [mounted, setMounted] = useState(visible);
  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);

      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 180,
        mass: 0.8,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: DRAWER_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setMounted(false);
        }
      });
    }
  }, [visible, translateX]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  if (!mounted) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={handleClose}
    >
      <View className="flex-1">
        {/* Panel (covers the whole screen) */}
        <Animated.View
          style={{
            width: "100%",
            height: "100%",
            transform: [{ translateX }],
          }}
          className="absolute bottom-0 left-0 right-0 top-0"
        >
          <View className="h-full w-full bg-white">
            {/* Header */}
            <View className="flex flex-row items-center justify-between border-b border-border px-[30px] pb-[16px] pt-[44px]">
              <Text
                className="flex-1 font-inter-bold text-[20px] text-foreground"
                numberOfLines={1}
              >
                {title}
              </Text>

              <Pressable
                onPress={handleClose}
                hitSlop={12}
                className="ml-3"
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <CloseIcon />
              </Pressable>
            </View>

            {/* Scrollable body */}
            <ScrollView
              className="w-full flex-1"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerClassName="gap-[16px] px-[30px] py-[24px]"
            >
              {children}
            </ScrollView>

            {/* Footer */}
            <View className="flex flex-row items-center justify-between border-t border-border px-[30px] pt-[18px] pb-[50px]">
              {footer}

              {!visible_closeButton && (
                <Pressable onPress={handleClose} hitSlop={8}>
                  <Text className="font-inter-medium text-[14px] text-muted">
                    {closeLabel}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default memo(Drawer);