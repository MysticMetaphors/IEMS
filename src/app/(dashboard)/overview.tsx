import Arrow from "@/assets/icons/arrow.svg";
import Ellipsis from "@/assets/icons/dots-vertical-rounded.svg";
import Check from "@/assets/icons/status/check.svg";
import Close from "@/assets/icons/status/close.svg";
import Not_Tagged from "@/assets/icons/status/not_tagged.svg";
import Warning from "@/assets/icons/status/warning.svg";
import KPI from "@/components/dashboard/KPI";
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
];

const issues = [
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
    icon: Close
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
    icon: Close
  },
];

export default function Overview() {
  return (
    <ScrollView
      className="flex-1 bg-white "
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-[18px] pb-[200px]"
    >
      {/* <View className="flex gap-[8px] pt-[5px]">
          <Text className="font-inter-bold text-[20px]">Welcome Back, Hunter!</Text>
          <Text className="font-inter-semibold text-[12px] text-foreground/80">August 10, 2026. 10:34 PM</Text>
        </View> */}
      <KPI />
      <View className="flex flex-row items-center justify-between h-fit w-full">
        <Text className="font-inter-semibold text-[12px]">Today's Classes</Text>
        <Text className="font-inter-semibold text-[12px] underline">View all</Text>
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

      <View className="flex flex-row items-center justify-between h-fit w-full">
        <Text className="font-inter-semibold text-[12px]">Class Issues</Text>
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

              <Arrow
                height={8}
                width={8}
                style={{
                  color: "#808080",
                  transform: [{ rotate: '90deg' }]
                }}
              />
            </View>
          )
        })}
      </View>
    </ScrollView>
  );
}