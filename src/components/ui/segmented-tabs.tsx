import { Pressable, Text, View } from "react-native";

type Tab = {
  label: string;
};

type SegmentedTabsProps = {
  tabs: Tab[];
  activeTab: string;
  onChange: (tab: string) => void;
};

export default function SegmentedTabs({ tabs, activeTab, onChange }: SegmentedTabsProps) {
  return (
    <View className="flex-row rounded-[12px] border border-border bg-card p-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.label;

        return (
          <Pressable
            key={tab.label}
            onPress={() => onChange(tab.label)}
            className={`flex-1 flex-row items-center justify-center rounded-[8px] px-4 py-2.5 ${
              isActive ? "bg-foreground" : "bg-transparent"
            }`}
          >
            <Text
              className={`text-[10px] font-inter-bold ${
                isActive ? "text-white" : "text-muted"
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}