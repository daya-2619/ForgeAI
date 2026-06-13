import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, Typography, GlassStyles } from '../theme';
import { useAppStore } from '../store/useAppStore';

export const BoardRoomScreen: React.FC = () => {
  const { activeStartup, debates, triggerDebate, fetchDebates, isLoading } = useAppStore();
  const [topic, setTopic] = useState('');

  useEffect(() => {
    if (activeStartup) {
      fetchDebates(activeStartup.id);
    }
  }, [activeStartup]);

  const handleDebate = () => {
    if (!topic.trim()) {
      alert('Please enter a question or topic for the board room.');
      return;
    }
    if (activeStartup) {
      triggerDebate(activeStartup.id, topic);
      setTopic('');
    }
  };

  if (!activeStartup) {
    return (
      <View style={styles.center}>
        <Text style={[Typography.body, { textAlign: 'center' }]}>
          No active venture. Build a startup first to convene the AI Board Room.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={GlassStyles.cardHighlight}>
        <Text style={Typography.h1}>AI Board Room</Text>
        <Text style={[Typography.body, { marginTop: 4 }]}>
          Submit strategic business decisions or feature prioritization conflicts. The CEO, CTO, Product, Marketing, and Finance agents will conduct a structured debate.
        </Text>
      </View>

      {/* Trigger Debate Panel */}
      <Text style={[Typography.h2, { marginTop: 15 }]}>Consult Board of Directors</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Should we launch with subscription billing or usage-based pricing?"
        placeholderTextColor={Colors.textMuted}
        value={topic}
        onChangeText={setTopic}
      />

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color={Colors.primary} size="small" />
          <Text style={[Typography.caption, { marginTop: 8 }]}>Agents debating strategic implications...</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.debateButton} onPress={handleDebate}>
          <Text style={styles.debateButtonText}>Initiate Agent Debate</Text>
        </TouchableOpacity>
      )}

      {/* Historical Debates */}
      <Text style={[Typography.h2, { marginVertical: 15 }]}>Debate History & Recommendations</Text>
      {debates.length === 0 ? (
        <Text style={Typography.body}>No strategic debates recorded yet.</Text>
      ) : (
        debates.map((d) => (
          <View key={d.id} style={GlassStyles.card}>
            <Text style={[Typography.h2, { fontSize: 16, color: Colors.primary }]}>TOPIC: {d.topic}</Text>
            
            {/* Debate Transcript */}
            <Text style={[Typography.caption, { marginTop: 10, marginBottom: 5 }]}>DEBATE TRANSCRIPT</Text>
            {d.transcript.map((msg, index) => (
              <View key={index} style={styles.messageRow}>
                <Text style={[Typography.caption, { color: Colors.secondary, fontWeight: 'bold' }]}>
                  {msg.agent}:
                </Text>
                <Text style={[Typography.body, { fontSize: 13, color: Colors.textPrimary }]}>
                  {msg.message}
                </Text>
              </View>
            ))}

            {/* Recommendation synthesis */}
            <View style={styles.consensusBox}>
              <Text style={[Typography.caption, { color: Colors.secondary, fontWeight: 'bold' }]}>
                CONSENSUS RECOMMENDATION
              </Text>
              <Text style={[Typography.body, { color: '#fff', fontSize: 13, marginTop: 4 }]}>
                {d.consensus}
              </Text>
            </View>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 24,
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
    marginVertical: 10,
  },
  debateButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginVertical: 8,
  },
  debateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  messageRow: {
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
    paddingLeft: 10,
    marginVertical: 6,
  },
  consensusBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  }
});
