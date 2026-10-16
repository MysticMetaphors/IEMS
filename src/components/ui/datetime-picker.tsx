import { formatDate, formatTime } from "@/lib/utils/datetime-formater";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";

import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

export default function DatetimePickerField({ label, value, mode, disabled, onChange,  }: {
  label: string;
  value: Date;
  mode: "date" | "time";
  disabled: boolean;
  onChange: (next: Date) => void;
}) {
  const [showIos, setShowIos] = useState(false);

  function handlePress() {
    if (disabled) return;

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value,
        mode,
        is24Hour: false,
        onChange: (event, selected) => {
          if (event.type === "set" && selected) {
            onChange(selected);
          }
        },
      });
    } else if (Platform.OS === "ios") {
      setShowIos((prev) => !prev);
    }
  }

  function handleWebChange(rawValue: string) {
    if (!rawValue) return;

    const next = new Date(value);

    if (mode === "date") {
      const [year, month, day] = rawValue.split("-").map(Number);
      next.setFullYear(year, month - 1, day);
    } else {
      const [hours, minutes] = rawValue.split(":").map(Number);
      next.setHours(hours, minutes, 0, 0);
    }

    onChange(next);
  }

  const webValue =
    mode === "date"
      ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
      : `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;

  return (
    <View className="gap-[8px]">
      <Text className="font-inter-semibold text-[12px]">
        {label}
      </Text>

      {Platform.OS === "web" ? (
        <View className="border border-border rounded-[12px] px-[14px] py-[13px] font-inter text-[12px] text-foreground">
          <input
            type={mode}
            value={webValue}
            disabled={disabled}
            onChange={(event) => handleWebChange(event.target.value)}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              backgroundColor: "transparent",
              color: "inherit",
              fontSize: 12,
              fontFamily: "inherit",
            }}
          />
        </View>
      ) : (
        <>
          <Pressable
            onPress={handlePress}
            disabled={disabled}
            className="border border-border rounded-[12px] px-[14px] py-[13px] font-inter text-[12px] text-foreground"
          >
            <Text className="font-inter text-[12px] text-foreground">
              {mode === "date" ? formatDate(value) : formatTime(value)}
            </Text>
          </Pressable>

          {Platform.OS === "ios" && showIos && !disabled ? (
            <DateTimePicker
              value={value}
              mode={mode}
              display={mode === "date" ? "inline" : "spinner"}
              onChange={(_, selected) => {
                if (selected) onChange(selected);
              }}
            />
          ) : null}
        </>
      )}
    </View>
  );
}