import Attendance from "@/assets/icons/sidebar/attendance.svg";
import { Text, View } from "react-native";

export default function KPI() {
  return (
    <View className="flex gap-[30px] p-[30px] w-full bg-primary rounded-[12px]">
      <View className="flex flex-row justify-between">
        <View>
          <Text className="text-white font-inter-semibold">
            Class Completed
          </Text>
          <Text className="text-white">
            vs. last month
          </Text>
        </View>
        <Attendance
          height={30}
          width={30}
          style={{ color: "#FFFFFF" }}
        />
      </View>
      <View className="flex flex-row items-center justify-between">
        <Text className="text-white font-inter-semibold text-4xl">
          546
        </Text>
        <View>
          <Text className="text-white text-[10px]">
            increased by
          </Text>
          <Text className="text-white font-inter-semibold text-[10px]">
            +12.84%
          </Text>
        </View>
      </View>
    </View>
  )
}