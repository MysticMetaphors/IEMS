import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Modal as RNModal,
  ScrollView,
  Text,
  View,
} from "react-native";

type ModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  /** Buttons / actions rendered at the bottom, e.g. <Button /> components */
  footer?: ReactNode;
  /** Tapping the dark backdrop closes the modal (default: true) */
  dismissOnBackdrop?: boolean;
  /** Show the ✕ button in the header (default: true) */
  showClose?: boolean;
  className?: string;
};

export default function Modal({
  visible,
  onClose,
  title,
  description,
  children,
  footer,
  dismissOnBackdrop = true,
  showClose = true,
  className = "",
}: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      statusBarTranslucent
      onRequestClose={onClose} // Android back button
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 items-center justify-center px-[20px]">
          {/* Backdrop */}
          <Pressable
            className="absolute inset-0 bg-black/20"
            onPress={dismissOnBackdrop ? onClose : undefined}
          />

          {/* Card */}
          <View className={`w-full p-[10px] max-w-[420px] max-h-[80%] rounded-[12px] border border-border bg-card ${className}`}>
            {(title || showClose) && (
              <View className="flex flex-row items-start justify-between gap-[10px] px-[16px] pt-[16px]">
                <View className="flex-1">
                  {title ? (
                    <Text className="font-inter-bold text-[14px] text-foreground">
                      {title}
                    </Text>
                  ) : null}
                  {description ? (
                    <Text className="mt-[4px] font-inter text-[10px] font-normal text-muted">
                      {description}
                    </Text>
                  ) : null}
                </View>

                {showClose && (
                  <Pressable
                    onPress={onClose}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    className="h-[26px] w-[26px] items-center justify-center rounded-full border border-border"
                  >
                    <Text className="font-inter-semibold text-[12px] text-muted">✕</Text>
                  </Pressable>
                )}
              </View>
            )}

            {children ? (
              <ScrollView
                className="flex-grow-0"
                contentContainerClassName="gap-[10px] px-[16px] py-[13px]"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </ScrollView>
            ) : null}

            {footer ? (
              <View className="flex flex-row justify-end gap-[10px] px-[16px] py-[10px]">
                {footer}
              </View>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

/*
  ── Usage ──────────────────────────────────────────────

  import Modal from "@/components/modal";

  const [open, setOpen] = useState(false);

  <Modal
    visible={open}
    onClose={() => setOpen(false)}
    title="Update attendance"
    description="Aug 7, 2026 • 10:00 AM–10:30 AM"
    footer={
      <>
        <Pressable
          onPress={() => setOpen(false)}
          className="px-[16px] py-[10px] rounded-[12px] border border-border bg-card"
        >
          <Text className="font-inter-semibold text-[12px]">Cancel</Text>
        </Pressable>
        <Pressable
          onPress={save}
          className="px-[16px] py-[10px] rounded-[12px] bg-foreground"
        >
          <Text className="font-inter-semibold text-[12px] text-white">Save</Text>
        </Pressable>
      </>
    }
  >
    <Text className="font-inter text-[12px] text-foreground">Modal content here</Text>
  </Modal>
*/