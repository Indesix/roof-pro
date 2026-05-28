import { Tabs } from "expo-router";

export default function TabsLayout() {
    console.log("Tabs layout chargé");
    return (
        <Tabs
        screenOptions={{
            headerShown: true,
        }}
        >
        <Tabs.Screen
            name="dashboard"
            options={{ title: "Dashboard" }}
        />
        <Tabs.Screen
            name="clients"
            options={{ title: "Clients" }}
        />
        <Tabs.Screen
            name="devis"
            options={{ title: "Devis" }}
        />
        <Tabs.Screen
            name="produits"
            options={{ title: "Produits" }}
        />
        <Tabs.Screen
            name="agenda"
            options={{ title: "Agenda" }}
        />
        <Tabs.Screen
            name="settings"
            options={{ title: "Réglages" }}
        />
        </Tabs>
  );
}