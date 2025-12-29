import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';

type TabIconProps = {
  focused: boolean;
  icon: string;
  label: string;
};

function TabIcon({ focused, icon, label }: TabIconProps) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="🏠" label="Trang chủ" />
          ),
        }}
      />
      <Tabs.Screen
        name="print"
        options={{
          title: 'In tài liệu',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="📄" label="In tài liệu" />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Lịch sử',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="📋" label="Lịch sử" />
          ),
        }}
      />
      <Tabs.Screen
        name="balance"
        options={{
          title: 'Số dư',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="💳" label="Số dư" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="👤" label="Cá nhân" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabIcon: {
    fontSize: 22,
  },
  tabIconActive: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});
