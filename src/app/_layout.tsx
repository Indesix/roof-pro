import { Stack } from "expo-router";

export default function RootLayout() {
  console.log("Root layout chargé");
  return <Stack screenOptions={{ headerShown: false }} />;
}