import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors, Typography } from './src/theme';
import { StartupBuilderScreen } from './src/screens/StartupBuilderScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { BoardRoomScreen } from './src/screens/BoardRoomScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<'builder' | 'dashboard' | 'boardroom'>('builder');

  const renderContent = () => {
    switch (activeTab) {
      case 'builder':
        return <StartupBuilderScreen onSuccess={() => setActiveTab('dashboard')} />;
      case 'dashboard':
        return <DashboardScreen />;
      case 'boardroom':
        return <BoardRoomScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header Banner */}
      <View style={styles.header}>
        <Text style={styles.logoText}>ForgeAI</Text>
        <View style={styles.statusIndicator}>
          <View style={styles.greenDot} />
          <Text style={styles.statusLabel}>Workforce Online</Text>
        </View>
      </View>

      {/* Main View Area */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Glassmorphic Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'builder' && styles.activeNavItem]} 
          onPress={() => setActiveTab('builder')}
        >
          <Text style={[styles.navText, activeTab === 'builder' && styles.activeNavText]}>
            Builder
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'dashboard' && styles.activeNavItem]} 
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.navText, activeTab === 'dashboard' && styles.activeNavText]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'boardroom' && styles.activeNavItem]} 
          onPress={() => setActiveTab('boardroom')}
        >
          <Text style={[styles.navText, activeTab === 'boardroom' && styles.activeNavText]}>
            Board Room
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
    marginRight: 6,
  },
  statusLabel: {
    color: Colors.secondary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  navBar: {
    height: 65,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeNavItem: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 1,
  },
  navText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  activeNavText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
