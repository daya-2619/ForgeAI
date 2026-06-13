import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, Typography, GlassStyles } from '../theme';
import { useAppStore } from '../store/useAppStore';

export const DashboardScreen: React.FC = () => {
  const { activeStartup, tasks, incidents, totalCost, isLoading, fetchDashboard } = useAppStore();

  const handleRefresh = () => {
    if (activeStartup) {
      fetchDashboard(activeStartup.id);
    }
  };

  if (!activeStartup) {
    return (
      <View style={styles.center}>
        <Text style={[Typography.body, { textAlign: 'center' }]}>
          No venture active. Go to the Startup Builder to create a new AI startup blueprint!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Venture Header */}
      <View style={GlassStyles.cardHighlight}>
        <Text style={Typography.caption}>ACTIVE VENTURE CANVAS</Text>
        <Text style={[Typography.h1, { color: Colors.textPrimary, marginTop: 4 }]}>
          {activeStartup.name}
        </Text>
        <Text style={[Typography.body, { marginTop: 6, color: Colors.textSecondary }]}>
          {activeStartup.description}
        </Text>
        <View style={styles.row}>
          <Text style={[Typography.caption, { color: Colors.secondary }]}>
            Status: {activeStartup.status.toUpperCase()}
          </Text>
          <Text style={[Typography.caption, { color: Colors.accent }]}>
            Budget Limit: ${activeStartup.budget_limit}.00
          </Text>
        </View>
      </View>

      {/* Observability Aggregates */}
      <Text style={[Typography.h2, { marginVertical: 10 }]}>Operations Control Room</Text>
      <View style={styles.grid}>
        <View style={[GlassStyles.card, { flex: 1, marginRight: 8 }]}>
          <Text style={Typography.caption}>ACCUMULATED COSTS</Text>
          <Text style={[Typography.h1, { color: Colors.secondary, marginVertical: 4 }]}>
            ${totalCost.toFixed(4)}
          </Text>
          <Text style={Typography.caption}>LLM token billing</Text>
        </View>

        <View style={[GlassStyles.card, { flex: 1, marginLeft: 8 }]}>
          <Text style={Typography.caption}>SYSTEM ALERTERS</Text>
          <Text style={[Typography.h1, { color: incidents.length > 0 ? Colors.accent : Colors.secondary, marginVertical: 4 }]}>
            {incidents.length}
          </Text>
          <Text style={Typography.caption}>{incidents.length > 0 ? 'Incidents open' : 'No issues'}</Text>
        </View>
      </View>

      {/* Task Checklist */}
      <View style={styles.sectionHeader}>
        <Text style={Typography.h2}>Workforce Execution logs</Text>
        {isLoading && <ActivityIndicator color={Colors.primary} size="small" />}
      </View>

      {tasks.length === 0 ? (
        <Text style={Typography.body}>No tasks logged. Initialize generation to assign agents work.</Text>
      ) : (
        tasks.map((task) => (
          <View key={task.id} style={GlassStyles.card}>
            <View style={styles.taskHeader}>
              <View style={[styles.badge, { backgroundColor: Colors.primary }]}>
                <Text style={styles.badgeText}>{task.agent_role}</Text>
              </View>
              <Text style={[Typography.caption, { color: task.confidence_score >= 0.7 ? Colors.secondary : Colors.accent }]}>
                Confidence: {(task.confidence_score * 100).toFixed(0)}%
              </Text>
            </View>
            <Text style={[Typography.h2, { fontSize: 16, marginVertical: 4 }]}>{task.name}</Text>
            <Text style={[Typography.body, { fontSize: 13, marginBottom: 8 }]}>{task.description}</Text>
            
            {task.output && (
              <View style={styles.codeContainer}>
                <Text style={styles.codeText}>{task.output.substring(0, 180)}...</Text>
              </View>
            )}
          </View>
        ))
      )}

      {/* Incident Panel */}
      {incidents.length > 0 && (
        <View style={{ marginTop: 15 }}>
          <Text style={[Typography.h2, { color: Colors.accent }]}>System Incident Alerts</Text>
          {incidents.map((incident) => (
            <View key={incident.id} style={[GlassStyles.card, { borderColor: Colors.accent }]}>
              <View style={styles.taskHeader}>
                <Text style={[Typography.h2, { fontSize: 15, color: Colors.accent }]}>{incident.type.toUpperCase()}</Text>
                <Text style={[Typography.caption, { color: Colors.accent }]}>{incident.severity.toUpperCase()}</Text>
              </View>
              <Text style={Typography.body}>{incident.details}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Sync Panel */}
      <TouchableOpacity style={styles.syncButton} onPress={handleRefresh}>
        <Text style={styles.syncButtonText}>Refresh Control Panel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  codeContainer: {
    backgroundColor: '#0F0E16',
    padding: 10,
    borderRadius: 8,
    borderColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
  },
  codeText: {
    color: '#34D399',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  syncButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  syncButtonText: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
  }
});
