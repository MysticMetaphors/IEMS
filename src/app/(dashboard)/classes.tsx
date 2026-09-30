import Ellipsis from "@/assets/icons/dots-vertical-rounded.svg";
import Filter from "@/assets/icons/filter.svg";
import Check from "@/assets/icons/status/check.svg";
import Close from "@/assets/icons/status/close.svg";
import Not_Tagged from "@/assets/icons/status/not_tagged.svg";
import Warning from "@/assets/icons/status/warning.svg";
import Button from "@/components/button";
import SearchInput from "@/components/search-input";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

const classes = [
  {
    name: "Jonathan Freeman",
    date: "Aug 7, 2026",
    time: "10:00 AM–10:30 AM",
    icon: Warning
  },
  {
    name: "Sophia Bennett",
    date: "Aug 7, 2026",
    time: "10:30 AM–11:00 AM",
    icon: Check
  },
  {
    name: "Ethan Carter",
    date: "Aug 7, 2026",
    time: "11:00 AM–11:30 AM",
    icon: Not_Tagged
  },
  {
    name: "Olivia Mitchell",
    date: "Aug 8, 2026",
    time: "9:00 AM–9:30 AM",
    icon: Close
  },
  {
    name: "Liam Anderson",
    date: "Aug 8, 2026",
    time: "9:30 AM–10:00 AM",
    icon: Check
  },
  {
    name: "Emma Richardson",
    date: "Aug 8, 2026",
    time: "10:00 AM–10:30 AM",
    icon: Check
  },
  {
    name: "Noah Thompson",
    date: "Aug 8, 2026",
    time: "2:00 PM–2:30 PM",
    icon: Check
  },
  {
    name: "Ava Williams",
    date: "Aug 9, 2026",
    time: "8:00 AM–8:30 AM",
    icon: Not_Tagged
  },
  {
    name: "Lucas Morgan",
    date: "Aug 9, 2026",
    time: "9:00 AM–9:30 AM",
    icon: Close
  },
  {
    name: "Mia Parker",
    date: "Aug 9, 2026",
    time: "10:30 AM–11:00 AM",
    icon: Not_Tagged
  },
  {
    name: "James Cooper",
    date: "Aug 10, 2026",
    time: "8:30 AM–9:00 AM",
    icon: Check
  },
  {
    name: "Charlotte Evans",
    date: "Aug 10, 2026",
    time: "10:00 AM–10:30 AM",
    icon: Close
  },
  {
    name: "Benjamin Scott",
    date: "Aug 10, 2026",
    time: "1:00 PM–1:30 PM",
    icon: Not_Tagged
  },
  {
    name: "Amelia Turner",
    date: "Aug 11, 2026",
    time: "9:00 AM–9:30 AM",
    icon: Check
  },
  {
    name: "Henry Collins",
    date: "Aug 11, 2026",
    time: "10:00 AM–10:30 AM",
    icon: Check
  },
  {
    name: "Harper Stewart",
    date: "Aug 11, 2026",
    time: "11:00 AM–11:30 AM",
    icon: Close
  },
  {
    name: "Daniel Brooks",
    date: "Aug 12, 2026",
    time: "8:00 AM–8:30 AM",
    icon: Close
  },
  {
    name: "Evelyn Murphy",
    date: "Aug 12, 2026",
    time: "9:30 AM–10:00 AM",
    icon: Check
  },
  {
    name: "Alexander Reed",
    date: "Aug 12, 2026",
    time: "10:30 AM–11:00 AM",
    icon: Close
  },
  {
    name: "Grace Foster",
    date: "Aug 12, 2026",
    time: "2:00 PM–2:30 PM",
    icon: Check
  },
];

export default function Classes() {
  const [search, setSearch] = useState("")

  return (
    <ScrollView
      className="flex-1 bg-white "
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-[18px] pb-[200px]"
    >
      <View className="flex flex-row gap-[10px] max-w-full">
        <SearchInput
          value={search}
          onChangeText={setSearch}
          className="flex-1"
        />
        <Button LeftIcon={Filter} />
        
      </View>
      <Button label="Schedule new Class" classname="justify-center w-[100%]"/>
      <View className="flex flex-row items-center justify-between h-fit w-full">
        <Text className="font-inter-semibold text-[12px]">Classes</Text>
        <Text className="font-inter-semibold text-[12px]">Actions</Text>
      </View>

      <View className="flex gap-[10px]">
        {classes.map((classItem, index) => {
          const Icon = classItem.icon 
          const status = Icon == Close ? 'red-500' : Icon == Check ? 'green-500' : Icon == Warning ? 'orange-500' : 'gray-500' 

          return (
            <View key={index} className="px-[16px] py-[13px] flex flex-row justify-between items-center rounded-[12px] border border-border bg-card">
            <View className="flex w-fit flex-row items-center gap-[10px]">
              <View className={`p-[4px] rounded-full bg-${status}/30`}>
                <Icon 
                  height={26}
                  width={26}
                />
              </View>
              <View>
                <Text className="font-inter-bold text-[12px] text-foreground">
                  {classItem.name}
                </Text>
                <Text className="font-inter text-[10px] font-normal text-muted">
                  {classItem.date} • {classItem.time}
                </Text>
              </View>
            </View>

            <Ellipsis
              height={22}
              width={22}
            />
          </View>
          )
        })}
      </View>
    </ScrollView>
  );
}