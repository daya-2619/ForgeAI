import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Typography, GlassStyles } from '../theme';
import { useAppStore } from '../store/useAppStore';

interface StartupBuilderProps {
  onSuccess: () => void;
}

export const StartupBuilderScreen: React.FC<StartupBuilderProps> = ({ onSuccess }) => {
  const { createStartup, isLoading, error } = useAppStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('10.0');

  const handleBuild = async () => {
    if (!name.trim() || !description.trim()) {
      alert('Please fill out both the Venture Name and the description prompt.');
      return;
    }
    const resultId = await createStartup(name, description, parseFloat(budget) || 10.0);
    if (resultId) {
      onSuccess(); // Switch tab to dashboard on success
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingVertical: 20 }}>
      <View style={GlassStyles.cardHighlight}>
        <Text style={Typography.h1}>Venture Builder</Text>
        <Text style={[Typography.body, { marginTop: 4 }]}>
          Input your business hypothesis. The ForgeAI autonomous agent workforce will generate your PRD, system architecture, database models, and API specifications.
        </Text>
      </View>

      <Text style={[Typography.h2, { marginTop: 15 }]}>Venture Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. MedFlow AI"
        placeholderTextColor={Colors.textMuted}
        value={name}
        onChangeText={setName}
      />

      <Text style={[Typography.h2, { marginTop: 10 }]}>Business Prompt / Description</Text>
      <TextInput
        style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
        placeholder="Describe what you want to build (e.g. I want to build an AI platform for hospital operations, scheduling, and billing context...)"
        placeholderTextColor={Colors.textMuted}
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <Text style={[Typography.h2, { marginTop: 10 }]}>Simulated Model Budget Limit ($)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="10.00"
        placeholderTextColor={Colors.textMuted}
        value={budget}
        onChangeText={setBudget}
      />

      {error && <Text style={[Typography.caption, { color: Colors.accent, marginVertical: 8 }]}>{error}</Text>}

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={[Typography.body, { marginTop: 10, textAlign: 'center' }]}>
            Orchestrating agents... Product Manager, Software Architect, and QA are validating database constraints.
          </Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.buildButton} onPress={handleBuild}>
          <Text style={styles.buildButtonText}>Launch Autonomous Workforce</Text>
        </TouchableOpacity>
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
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 12,
    color: Colors.textPrimary,
    padding: 14,
    fontSize: 15,
    marginVertical: 8,
  },
  loaderContainer: {
    alignItems: 'center',
    marginVertical: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
  },
  buildButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  buildButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
