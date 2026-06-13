import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, SafeAreaView } from 'react-native';
import { Colors, Typography, GlassStyles } from '../theme';
import { useAppStore } from '../store/useAppStore';

// Helper to safely parse python dict string outputs stored in tasks
const parsePythonDict = (str: string | undefined): any => {
  if (!str) return null;
  try {
    const jsonStr = str
      .replace(/'/g, '"')
      .replace(/True/g, 'true')
      .replace(/False/g, 'false')
      .replace(/None/g, 'null');
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
};

export const DashboardScreen: React.FC = () => {
  const { activeStartup, tasks, incidents, totalCost, isLoading, fetchDashboard } = useAppStore();
  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'prd' | 'architecture'>('logs');

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

  // Find generated task outputs
  const prdTask = tasks.find(t => t.name.includes("Product Requirements"));
  const archTask = tasks.find(t => t.name.includes("System Architecture"));

  const prdData = parsePythonDict(prdTask?.output);
  const archData = parsePythonDict(archTask?.output);

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'prd':
        if (!prdData) {
          return (
            <Text style={[Typography.body, { paddingVertical: 20 }]}>
              PRD is being compiled by the Product Manager agent. Check back shortly.
            </Text>
          );
        }
        return (
          <View>
            {/* Problem Statement */}
            <View style={GlassStyles.card}>
              <Text style={styles.sectionTitle}>Problem Statement</Text>
              <Text style={[Typography.body, { color: Colors.textPrimary, marginTop: 4 }]}>
                {prdData.problem_statement}
              </Text>
            </View>

            {/* Pain Points */}
            <View style={GlassStyles.card}>
              <Text style={styles.sectionTitle}>Key Pain Points</Text>
              {prdData.pain_points && prdData.pain_points.map((point: string, idx: number) => (
                <View key={idx} style={styles.painRow}>
                  <Text style={styles.bulletSymbol}>✦</Text>
                  <Text style={[Typography.body, { flex: 1, fontSize: 14 }]}>{point}</Text>
                </View>
              ))}
            </View>

            {/* Market Opportunity */}
            <View style={GlassStyles.card}>
              <Text style={styles.sectionTitle}>Financial Opportunity (Bottom-up)</Text>
              <View style={styles.marketGrid}>
                <View style={styles.marketCell}>
                  <Text style={Typography.caption}>TAM</Text>
                  <Text style={styles.marketValue}>{prdData.tam_sam_som?.tam || '$0'}</Text>
                </View>
                <View style={styles.marketCell}>
                  <Text style={Typography.caption}>SAM</Text>
                  <Text style={styles.marketValue}>{prdData.tam_sam_som?.sam || '$0'}</Text>
                </View>
                <View style={styles.marketCell}>
                  <Text style={Typography.caption}>SOM</Text>
                  <Text style={[styles.marketValue, { color: Colors.secondary }]}>
                    {prdData.tam_sam_som?.som || '$0'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Features list */}
            <View style={GlassStyles.card}>
              <Text style={styles.sectionTitle}>Core Venture Features</Text>
              {prdData.features && prdData.features.map((feat: any, idx: number) => (
                <View key={idx} style={styles.featRow}>
                  <Text style={[Typography.body, { fontWeight: 'bold', flex: 1 }]}>{feat.name}</Text>
                  <View style={[
                    styles.priorityBadge, 
                    { backgroundColor: feat.priority === 'high' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(124, 58, 237, 0.15)' }
                  ]}>
                    <Text style={[
                      styles.priorityBadgeText, 
                      { color: feat.priority === 'high' ? Colors.accent : Colors.primary }
                    ]}>
                      {feat.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        );

      case 'architecture':
        if (!archData) {
          return (
            <Text style={[Typography.body, { paddingVertical: 20 }]}>
              System Architecture is being mapped by the Software Architect agent. Check back shortly.
            </Text>
          );
        }
        return (
          <View>
            {/* Database Tables */}
            <View style={GlassStyles.card}>
              <View style={styles.dbHeader}>
                <Text style={styles.sectionTitle}>Database Blueprint</Text>
                <View style={styles.dbTypeBadge}>
                  <Text style={styles.dbTypeText}>{archData.database_type || 'SQL'}</Text>
                </View>
              </View>
              {archData.tables && archData.tables.map((table: string, idx: number) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={styles.tableIcon}>📁</Text>
                  <Text style={styles.tableText}>{table}</Text>
                </View>
              ))}
            </View>

            {/* API Endpoints */}
            <View style={GlassStyles.card}>
              <Text style={styles.sectionTitle}>API Specifications</Text>
              {archData.endpoints && archData.endpoints.map((route: string, idx: number) => {
                const parts = route.split(' - ');
                const routeInfo = parts[0] || '';
                const desc = parts[1] || '';
                const method = routeInfo.split(' ')[0] || 'GET';
                const path = routeInfo.split(' ')[1] || '';

                return (
                  <View key={idx} style={styles.endpointCard}>
                    <View style={styles.routeRow}>
                      <View style={[
                        styles.methodBadge,
                        { backgroundColor: method === 'POST' ? 'rgba(124,58,237,0.15)' : 'rgba(16,185,129,0.15)' }
                      ]}>
                        <Text style={[
                          styles.methodText,
                          { color: method === 'POST' ? Colors.primary : Colors.secondary }
                        ]}>
                          {method}
                        </Text>
                      </View>
                      <Text style={styles.routePath}>{path}</Text>
                    </View>
                    <Text style={styles.routeDesc}>{desc}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        );

      case 'logs':
      default:
        return (
          <View>
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
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.wrapper}>
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
            <Text style={[Typography.caption, { color: Colors.secondary, fontWeight: 'bold' }]}>
              STATUS: {activeStartup.status.toUpperCase()}
            </Text>
            <Text style={[Typography.caption, { color: Colors.accent, fontWeight: 'bold' }]}>
              BUDGET: ${activeStartup.budget_limit}.00
            </Text>
          </View>
        </View>

        {/* Aggregates */}
        <View style={styles.grid}>
          <View style={[GlassStyles.card, { flex: 1, marginRight: 8 }]}>
            <Text style={Typography.caption}>ACCUMULATED COSTS</Text>
            <Text style={[Typography.h1, { color: Colors.secondary, marginVertical: 4 }]}>
              ${totalCost.toFixed(4)}
            </Text>
            <Text style={Typography.caption}>LLM token billing</Text>
          </View>

          <View style={[GlassStyles.card, { flex: 1, marginLeft: 8 }]}>
            <Text style={Typography.caption}>SYSTEM INCIDENTS</Text>
            <Text style={[Typography.h1, { color: incidents.length > 0 ? Colors.accent : Colors.secondary, marginVertical: 4 }]}>
              {incidents.length}
            </Text>
            <Text style={Typography.caption}>{incidents.length > 0 ? 'Incidents outstanding' : 'No errors'}</Text>
          </View>
        </View>

        {/* Dynamic Sub-tab Selector */}
        <View style={styles.subTabBar}>
          <TouchableOpacity 
            style={[styles.subTabButton, activeSubTab === 'logs' && styles.activeSubTabButton]}
            onPress={() => setActiveSubTab('logs')}
          >
            <Text style={[styles.subTabText, activeSubTab === 'logs' && styles.activeSubTabText]}>Logs</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.subTabButton, activeSubTab === 'prd' && styles.activeSubTabButton]}
            onPress={() => setActiveSubTab('prd')}
          >
            <Text style={[styles.subTabText, activeSubTab === 'prd' && styles.activeSubTabText]}>PRD Blueprint</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.subTabButton, activeSubTab === 'architecture' && styles.activeSubTabButton]}
            onPress={() => setActiveSubTab('architecture')}
          >
            <Text style={[styles.subTabText, activeSubTab === 'architecture' && styles.activeSubTabText]}>Architecture</Text>
          </TouchableOpacity>
        </View>

        {/* Sub-tab content */}
        <View style={styles.contentArea}>
          {renderSubTabContent()}
        </View>

        {/* Incident Alerts Panel */}
        {incidents.length > 0 && (
          <View style={{ marginTop: 15 }}>
            <Text style={[Typography.h2, { color: Colors.accent, marginVertical: 8 }]}>System Incident Log</Text>
            {incidents.map((incident) => (
              <View key={incident.id} style={[GlassStyles.card, { borderColor: Colors.accent }]}>
                <View style={styles.taskHeader}>
                  <Text style={[Typography.h2, { fontSize: 15, color: Colors.accent }]}>{incident.type.toUpperCase()}</Text>
                  <Text style={[Typography.caption, { color: Colors.accent }]}>{incident.severity.toUpperCase()}</Text>
                </View>
                <Text style={[Typography.body, { marginTop: 4 }]}>{incident.details}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Sync */}
        <TouchableOpacity style={styles.syncButton} onPress={handleRefresh}>
          <Text style={styles.syncButtonText}>Refresh Control Room</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
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
    backgroundColor: 'rgba(255,255,255,0.02)',
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
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 20,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    padding: 3,
    marginVertical: 15,
  },
  subTabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 18,
  },
  activeSubTabButton: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
  },
  subTabText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activeSubTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  contentArea: {
    marginTop: 5,
  },
  sectionTitle: {
    ...Typography.h2,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  painRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  bulletSymbol: {
    color: Colors.secondary,
    marginRight: 8,
    fontSize: 14,
  },
  marketGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  marketCell: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 4,
  },
  marketValue: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  featRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  dbHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dbTypeBadge: {
    backgroundColor: 'rgba(124,58,237,0.1)',
    borderColor: 'rgba(124,58,237,0.2)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dbTypeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  tableIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  tableText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  endpointCard: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
    borderColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  methodText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  routePath: {
    color: Colors.textPrimary,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  routeDesc: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    paddingLeft: 4,
  }
});
