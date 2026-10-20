import React, { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TouchableWithoutFeedback, View } from "react-native";

export type DropdownOption<T = string> = {
  label: string;
  value: T;
  description?: string;
  disabled?: boolean;
};

type CustomDropdownProps<T = string> = {
  label?: string;
  placeholder?: string;
  value: T | null;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  renderItem?: (
    option: DropdownOption<T>,
    selected: boolean
  ) => React.ReactNode;
};

export default function Dropdown<T = string>({
  label,
  placeholder = "Select an option",
  value,
  options,
  onChange,
  disabled = false,
  renderItem,
}: CustomDropdownProps<T>) {
  const [visible, setVisible] = useState(false);

  const selectedOption = options.find(
    (option) => option.value === value
  );

  return (
    <>
      <View className="w-full">
        {label && (
          <Text className="mb-2 font-inter-medium text-sm text-foreground">
            {label}
          </Text>
        )}

        {/* Dropdown trigger */}
        <Pressable
          disabled={disabled}
          onPress={() => setVisible(true)}
          className={`min-h-[48px] flex-row items-center justify-between rounded-xl border border-border bg-card px-4 py-3 ${
            disabled ? "opacity-50" : ""
          }`}
        >
          <Text
            className={`flex-1 font-inter text-sm ${
              selectedOption ? "text-foreground" : "text-muted"
            }`}
            numberOfLines={1}
          >
            {selectedOption?.label ?? placeholder}
          </Text>

          <Text className="ml-3 text-muted">
            {visible ? "▲" : "▼"}
          </Text>
        </Pressable>
      </View>

      {/* Dropdown modal */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View className="flex-1 justify-center px-6">
          <TouchableWithoutFeedback
            onPress={() => setVisible(false)}
          >
            <View className="absolute inset-0 bg-black/40" />
          </TouchableWithoutFeedback>

          <View className="max-h-[70%] overflow-hidden rounded-2xl border border-border bg-card">
            {/* Header */}
            <View className="border-b border-border px-4 py-4">
              <Text className="font-inter-bold text-base text-foreground">
                {label ?? "Select an option"}
              </Text>
            </View>

            {/* Options */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {options.map((option) => {
                const selected = option.value === value;

                return (
                  <Pressable
                    key={String(option.value)}
                    disabled={option.disabled}
                    onPress={() => {
                      onChange(option.value);
                      setVisible(false);
                    }}
                    className={`border-b border-border px-4 py-3 ${
                      selected ? "bg-primary/10" : "bg-card"
                    } ${
                      option.disabled ? "opacity-40" : ""
                    }`}
                  >
                    {renderItem ? (
                      renderItem(option, selected)
                    ) : (
                      <View>
                        <Text
                          className={`font-inter-medium text-sm ${
                            selected
                              ? "text-primary"
                              : "text-foreground"
                          }`}
                        >
                          {option.label}
                        </Text>

                        {option.description && (
                          <Text className="mt-1 font-inter text-xs text-muted">
                            {option.description}
                          </Text>
                        )}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Cancel button */}
            <Pressable
              onPress={() => setVisible(false)}
              className="items-center border-t border-border px-4 py-3"
            >
              <Text className="font-inter-medium text-sm text-muted">
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}