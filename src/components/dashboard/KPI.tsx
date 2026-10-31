import Attendance from "@/assets/icons/sidebar/attendance.svg";
import { Skeleton } from "@/components/ui/skeleton";
import { Text, View } from "react-native";

// Placeholder color on the brown card (translucent white, like the card's text)
const ON_PRIMARY = "rgba(255,255,255,0.3)";

type KPIProps = {
  /** True until the first load finishes: the numbers show as placeholders. */
  loading?: boolean;
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
  loading = false,
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
          {loading ? (
            // same height as the 4xl number, so nothing jumps when the real value arrives
            <View
              accessible
              accessibilityLabel="Loading completed classes"
              accessibilityState={{ busy: true }}
              className="flex-1 flex-row items-center justify-between"
              style={{ minHeight: 40 }}
            >
              <Skeleton width={56} height={32} radius={8} color={ON_PRIMARY} />
              <View className="gap-[6px] items-start">
                <Skeleton width={64} height={10} color={ON_PRIMARY} />
                <Skeleton width={48} height={10} color={ON_PRIMARY} />
              </View>
            </View>
          ) : (
            <>
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
            </>
          )}
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