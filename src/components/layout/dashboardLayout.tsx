import { ReactNode, useState } from "react";
import { View } from "react-native";
import Navigation from "./navigation";
import Sidebar from "./sidebar";
import Topbar from "./topbar";

export default function DashboardLayout({ children }: { children: ReactNode; }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <View className="flex-1 bg-white pt-[50px] px-[23px]">
      <Topbar onMenuPress={() => setSidebarOpen(true)} />

      {children}

      <View className="absolute bottom-0 left-0 w-[100vw]">
        <Navigation />
      </View>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </View>
  )
}