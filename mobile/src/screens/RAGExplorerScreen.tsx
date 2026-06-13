import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Typography, GlassStyles } from '../theme';
import { useAppStore } from '../store/useAppStore';

export const RAGExplorerScreen: React.FC = () => {
  const { ragResults, searchRAG, isLoading } = useAppStore();
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim()) {
      searchRAG(query);
    }
  };

  const categories = [
    { label: 'All Playbooks', query: 'SaaS' },
    { label: 'Validation', query: 'Validation' },
    { label: 'Pricing Strategy', query: 'Pricing' },
    { label: 'Engineering Details', query: 'Database' }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingVertical: 20 }}>
      <View style={GlassStyles.cardHighlight}>
        <Text style={Typography.h1}>YC Playbook Explorer</Text>
        <Text style={[Typography.body, { marginTop: 4 }]}>
          Query the semantic vector database. Retrieve relevant playbook recommendations and case studies from Y-Combinator, pricing manuals, and database design patterns.
        </Text>
      </View>

      <Text style={[Typography.h2, { marginTop: 15 }]}>Search Knowledge Base</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="e.g. SaaS bottom-up billing logic"
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Filters */}
      <View style={styles.quickFilters}>
        {categories.map((cat, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.filterChip}
            onPress={() => {
              setQuery(cat.query);
              searchRAG(cat.query);
            }}
          >
            <Text style={styles.filterChipText}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={[Typography.caption, { marginTop: 10 }]}>Querying vector indexes...</Text>
        </View>
      )}

      {/* Search Results */}
      <Text style={[Typography.h2, { marginVertical: 15 }]}>Matching Knowledge Nodes</Text>
      {ragResults.length === 0 ? (
        <Text style={Typography.body}>No search results. Type a query or click a filter chip to retrieve playbook information.</Text>
      ) : (
        ragResults.map((res, idx) => (
          <View key={idx} style={GlassStyles.card}>
            <View style={styles.resultHeader}>
              <View style={styles.sourceBadge}>
                <Text style={styles.sourceBadgeText}>{res.metadata.source}</Text>
              </View>
              <View style={[styles.sourceBadge, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <Text style={[styles.sourceBadgeText, { color: Colors.secondary }]}>
                  {res.metadata.category.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={[Typography.body, { color: Colors.textPrimary, marginTop: 8 }]}>
              "{res.text}"
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 12,
    color: Colors.textPrimary,
    padding: 14,
    fontSize: 15,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  quickFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  filterChip: {
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  loader: {
    alignItems: 'center',
    marginVertical: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 6,
  },
  sourceBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sourceBadgeText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
  }
});
