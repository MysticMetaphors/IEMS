
import Arrow from "@/assets/icons/arrow.svg";
import { Pressable, Text, View } from "react-native";

type PaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  itemLabel?: string;
  setPage: React.Dispatch<React.SetStateAction<number>>;
};

export default function Pagination({
  page,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  itemLabel = "items",
  setPage,
}: PaginationProps) {
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <View className="flex flex-row items-center justify-between gap-[10px]">
      <View className="flex flex-row gap-[10px]">
        {/* Previous page */}
        <Pressable
          disabled={isFirst}
          onPress={() => setPage((p) => Math.max(1, p - 1))}
          className={`px-[13px] py-[15px] bg-card rounded-[12px] border border-border ${
            isFirst ? "opacity-40" : ""
          }`}
        >
          <Arrow height={15} width={24} style={{ color: "#A9A9A9" }} />
        </Pressable>

        {/* Next page */}
        <Pressable
          disabled={isLast}
          onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
          className={`px-[13px] py-[15px] bg-card rounded-[12px] border border-border ${
            isLast ? "opacity-40" : ""
          }`}
        >
          <Arrow
            height={15}
            width={24}
            style={{
              color: "#A9A9A9",
              transform: [{ rotate: "180deg" }],
            }}
          />
        </Pressable>
      </View>

      <Text className="font-inter-semibold text-[12px]">
        {totalItems === 0
          ? "No results"
          : `Showing ${itemLabel} ${startIndex + 1}–${Math.min(
              endIndex,
              totalItems
            )} of ${totalItems}`}
      </Text>
    </View>
  );
}
