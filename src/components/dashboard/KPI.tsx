import Concave from "@/assets/concave.svg";
import Attendance from "@/assets/icons/sidebar/attendance.svg";
import { Skeleton } from "@/components/ui/skeleton";
import { Text, View } from "react-native";

const ON_PRIMARY = "rgba(255,255,255,0.3)";
const SECONDARY = "#3A3A3B";

type KPIProps = {
  loading?: boolean;/** True until the first load finishes: the numbers show as placeholders. */
  completedThisMonth: number;/** Completed classes this calendar month. */
  completedLastMonth: number;/** Completed classes last calendar month. */
  totalClasses: number;/** All classes, all time. */
  totalStudents: number;
};

/** The two lines at the right of the card, e.g. "increased by" / "+12.84%". */
function getChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0
      ? { label: "no change", value: "0.00%" }
      : { label: "increased by", value: `+${current} ${current === 1 ? "class" : "classes"}` };
  }

  const pct = ((current - previous) / previous) * 100;
  if (pct === 0) return { label: "no change", value: "0.00%" };

  return pct > 0
    ? { label: "increased by", value: `+${pct.toFixed(2)}%` }
    : { label: "decreased by", value: `${pct.toFixed(2)}%` }; 
}

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
      <View className="relative flex gap-[10px] p-[30px] py-[15px] w-full bg-primary rounded-[12px] overflow-hidden">
        <View className="flex flex-row justify-between py-3.5">
          <View>
            <Text className="leading-none text-white text-[12px] font-inter-semibold">Class Completed</Text>
            <Text className="text-white text-[12px]">vs. last month</Text>
          </View>
          <Attendance height={30} width={30} style={{ color: "#FFFFFF" }} />
        </View>

        <View className="flex flex-row items-center justify-between">
          {loading ? (
            <View
              accessible
              accessibilityLabel="Loading completed classes"
              accessibilityState={{ busy: true }}
              style={{ minHeight: 40 }}
            >
              <Skeleton width={56} height={32} radius={8} color={ON_PRIMARY} />
            </View>
          ) : (
            <Text className="text-white font-inter-semibold text-[32px]">
              {completedThisMonth}.6k
            </Text>
          )}
        </View>

        {/* Secondary panel: direct child of the card so it hugs the bottom-right corner */}
        <View
          className="absolute bottom-0 right-0"
          style={{
            backgroundColor: SECONDARY,
            borderTopLeftRadius: 24, // convex rounded corner
          }}
        >
          {/* Bottom-left concave: panel's left wall flows into the card's bottom edge */}
          <Concave
            height={28}
            width={41}
            style={{
              position: "absolute",
              left: -39.8,
              bottom: -0.7,
              color: SECONDARY,
            }}
          />

          {/* Top-right concave: panel flares up into the card's right edge */}
          <Concave
            height={18}
            width={31}
            style={{
              position: "absolute",
              right: -2.5,
              top: -17,
              color: SECONDARY,
            }}
          />

          <View className="px-10 py-5 items-end">
            {loading ? (
              <View className="gap-[6px] items-end">
                <Skeleton width={64} height={10} color={ON_PRIMARY} />
                <Skeleton width={48} height={10} color={ON_PRIMARY} />
              </View>
            ) : (
              <>
                <Text className="text-white text-[10px]">{change.label}</Text>
                <Text className="text-white font-inter-semibold text-[10px]">
                  {change.value}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* All-time totals */}
      <View className="flex-row gap-[10px]">
        <View className="rounded-[12px] px-[27px] py-[20px] bg-primary flex-1">
          <Text className="leading-[20px] font-inter-semibold text-[12px] text-white">Total Classes</Text>
          <Text className="leading-[30px] font-inter-bold text-[24px] text-white">3.{totalClasses}1k</Text>
        </View>

        <View className="rounded-[12px] px-[27px] py-[20px] flex-1 bg-secondary">
          <Text className="leading-[20px] font-inter-semibold text-[12px] text-white">No. of Students</Text>
          <Text className="leading-[30px] font-inter-bold text-[24px] text-white">23{totalStudents}</Text>
        </View>
      </View>

      {/* <View className="flex-row gap-[10px]">
        <View className="rounded-[12px] border border-border bg-card px-[27px] py-[20px] flex-1">
          <View>
            <Text className="leading-none text-[12px] font-inter-semibold">Credits Used</Text>
            <Text className="text-[10px]">this month</Text>
          </View>
        </View>

        <View className="rounded-[12px] border border-border bg-card px-[27px] py-[20px] flex-1">
          <View>
            <Text className="leading-none text-[12px] font-inter-semibold">Credits Used</Text>
            <Text className="text-[10px]">this month</Text>
          </View>
        </View>
      </View> */}
    </View>
  );
}