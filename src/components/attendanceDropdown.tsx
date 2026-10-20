import { AttendanceStatus } from "@/db/classes/attendance";
import { useRef, useState } from "react";
import { Dimensions, Modal, Pressable, Text, View } from "react-native";
import { ATTENDANCE_OPTIONS } from "./ui/class-session-drawer";

const NOT_MARKED = { label: "Not marked", color: "#A9A9A9" };

export default function AttendanceDropdown({ value, onChange }: { value: AttendanceStatus | null; onChange: (status: AttendanceStatus) => void }) {
  const triggerRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number; w: number; h: number } | null>(
    null
  );

  function openMenu() {
    triggerRef.current?.measureInWindow((x, y, w, h) => setAnchor({ x, y, w, h }));
  }

  const close = () => setAnchor(null);

  const MENU_ITEM_HEIGHT = 40;
  const MENU_MIN_WIDTH = 140;

  // menu position
  const menuHeight = ATTENDANCE_OPTIONS.length * MENU_ITEM_HEIGHT + 8;
  let top = 0;
  let left = 0;
  let width = MENU_MIN_WIDTH;

  if (anchor) {
    const win = Dimensions.get("window");
    width = Math.max(anchor.w, MENU_MIN_WIDTH);
    // right edges aligned with the trigger, kept inside the screen
    left = Math.min(Math.max(8, anchor.x + anchor.w - width), win.width - width - 8);
    const below = anchor.y + anchor.h + 4;
    top =
      below + menuHeight > win.height - 8
        ? Math.max(8, anchor.y - menuHeight - 4)
        : below;
  }

  return (
    <>
      <Pressable
        ref={triggerRef}
        collapsable={false}
        onPress={openMenu}
        className="min-w-[80px] flex-row items-center justify-between gap-[10px] rounded-[10px] border border-border px-[10px] py-[7px]"
      >
        <StatusLabel status={value} />
      </Pressable>

      <Modal
        transparent
        visible={anchor !== null}
        statusBarTranslucent
        onRequestClose={close}
      >
        <Pressable className="flex-1" onPress={close}>
          <View
            style={{ position: "absolute", top, left, width }}
            className="rounded-[12px] border border-border bg-white p-[4px] shadow-lg"
          >
            {ATTENDANCE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  close();
                }}
                style={{ height: MENU_ITEM_HEIGHT }}
                className={`justify-center rounded-[8px] px-[10px] ${value === option.value ? "bg-card" : ""
                  }`}
              >
                <StatusLabel status={option.value} />
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function StatusLabel({ status }: { status: AttendanceStatus | null }) {
  const option = ATTENDANCE_OPTIONS.find((o) => o.value === status) ?? NOT_MARKED;

  return (
    <View className="flex-row items-center gap-[6px]">
      <View style={{ backgroundColor: option.color }} className="h-[8px] w-[8px] rounded-full" />
      <Text className="font-inter-semibold text-[10px] text-foreground">{option.label}</Text>
    </View>
  );
}