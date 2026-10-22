import Attendance from "@/assets/icons/sidebar/attendance.svg";
import { Text, View } from "react-native";

type KPIProps = {
  /** Completed classes this calendar month. */
  completedThisMonth: number;
  /** Completed classes last calendar month. */
  completedLastMonth: number;
  /** All classes, all time. */
  totalClasses: number;
  totalStudents: number;
};

/** The two lines at the right of the card, e.g. "increased by" / "+12.84%". */
function getChange(current: number, previous: number) {
  if (previous === 0) {
    // no base to compute a percentage from
    return current === 0
      ? { label: "no change", value: "0.00%" }
      : { label: "increased by", value: `+${current} ${current === 1 ? "class" : "classes"}` };
  }

  const pct = ((current - previous) / previous) * 100;
  if (pct === 0) return { label: "no change", value: "0.00%" };

  return pct > 0
    ? { label: "increased by", value: `+${pct.toFixed(2)}%` }
    : { label: "decreased by", value: `${pct.toFixed(2)}%` }; // already has the minus sign
}

const CARD = "rounded-[12px] border border-border bg-card px-[16px] py-[14px]";

export default function KPI({
  completedThisMonth,
  completedLastMonth,
  totalClasses,
  totalStudents,
}: KPIProps) {
  const change = getChange(completedThisMonth, completedLastMonth);

  return (
    <View className="gap-[10px]">
      {/* Class Completed (this month vs last month) */}
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
            {completedThisMonth}
          </Text>
          <View>
            <Text className="text-white text-[10px]">
              {change.label}
            </Text>
            <Text className="text-white font-inter-semibold text-[10px]">
              {change.value}
            </Text>
          </View>
        </View>
      </View>

      {/* All-time totals */}
      {/* <View className="flex-row gap-[10px]">
        <View className={`${CARD} bg-primary flex-1 gap-[4px]`}>
          <Text className="font-inter-semibold text-[12px] text-white">Total Classes</Text>
          <Text className="font-inter-bold text-[24px] text-white">{totalClasses}</Text>
        </View>

        <View className={`${CARD} flex-1 gap-[4px]`}>
          <Text className="font-inter-semibold text-[12px] text-white">Total Students</Text>
          <Text className="font-inter-bold text-[24px] text-white">{totalStudents}</Text>
        </View>
      </View> */}
    </View>
  );
}