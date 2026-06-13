import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, Typography, GlassStyles } from '../theme';
import { useAppStore } from '../store/useAppStore';

export const BoardRoomScreen: React.FC = () => {
  const { activeStartup, debates, triggerDebate, fetchDebates, isLoading } = useAppStore();
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<'Collaborative' | 'Adversarial' | 'Pragmatic' | 'Academic'>('Collaborative');
  const [selectedAgents, setSelectedAgents] = useState<string[]>(['CEO', 'CTO', 'Finance', 'Marketing']);

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
    if (selectedAgents.length === 0) {
      alert('Please select at least one agent to participate in the debate.');
      return;
    }
    if (activeStartup) {
      triggerDebate(activeStartup.id, topic, tone, selectedAgents);
      setTopic('');
    }
  };

  const toggleAgent = (agent: string) => {
    if (selectedAgents.includes(agent)) {
      setSelectedAgents(selectedAgents.filter(a => a !== agent));
    } else {
      setSelectedAgents([...selectedAgents, agent]);
    }
  };

  const tones: ('Collaborative' | 'Adversarial' | 'Pragmatic' | 'Academic')[] = [
    'Collaborative',
    'Adversarial',
    'Pragmatic',
    'Academic'
  ];

  const agentsList = ['CEO', 'CTO', 'Finance', 'Marketing', 'PM', 'QA', 'DevOps'];

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
          Submit strategic business decisions or feature prioritization conflicts. The chosen agent directors will conduct a structured debate based on your configured tone and budget limits.
        </Text>
      </View>

      {/* Trigger Debate Panel */}
      <View style={GlassStyles.card}>
        <Text style={Typography.h2}>Consult Board of Directors</Text>
        
        <Text style={[Typography.caption, { marginTop: 10, marginBottom: 5 }]}>DEBATE TOPIC / PROMPT</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Should we launch with subscription billing or usage-based pricing?"
          placeholderTextColor={Colors.textMuted}
          value={topic}
          onChangeText={setTopic}
        />

        {/* Tone Selector */}
        <Text style={[Typography.caption, { marginTop: 10, marginBottom: 8 }]}>DEBATE TONE</Text>
        <View style={styles.chipRow}>
          {tones.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, tone === t && styles.activeChip]}
              onPress={() => setTone(t)}
            >
              <Text style={[styles.chipText, tone === t && styles.activeChipText]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Agent Selectors */}
        <Text style={[Typography.caption, { marginTop: 10, marginBottom: 8 }]}>PARTICIPATING BOARD DIRECTORS</Text>
        <View style={styles.chipRow}>
          {agentsList.map((agent) => {
            const isSelected = selectedAgents.includes(agent);
            return (
              <TouchableOpacity
                key={agent}
                style={[styles.agentChip, isSelected && styles.activeAgentChip]}
                onPress={() => toggleAgent(agent)}
              >
                <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                  {agent} Agent
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color={Colors.primary} size="small" />
            <Text style={[Typography.caption, { marginTop: 8, color: Colors.secondary }]}>
              Directors conducting debate ({tone} tone)...
            </Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.debateButton} onPress={handleDebate}>
            <Text style={styles.debateButtonText}>Initiate Board Debate</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Historical Debates */}
      <Text style={[Typography.h2, { marginVertical: 15 }]}>Debate History & Recommendations</Text>
      {debates.length === 0 ? (
        <Text style={Typography.body}>No strategic debates recorded yet.</Text>
      ) : (
        debates.map((d) => (
          <View key={d.id} style={GlassStyles.card}>
            <View style={styles.debateCardHeader}>
              <Text style={[Typography.h2, { fontSize: 16, color: Colors.primary, flex: 1 }]}>TOPIC: {d.topic}</Text>
            </View>
            
            {/* Debate Transcript */}
            <Text style={[Typography.caption, { marginTop: 10, marginBottom: 5 }]}>DEBATE TRANSCRIPT</Text>
            {d.transcript && d.transcript.map((msg, index) => (
              <View key={index} style={styles.messageRow}>
                <Text style={[Typography.caption, { color: Colors.secondary, fontWeight: 'bold' }]}>
                  {msg.agent}:
                </Text>
                <Text style={[Typography.body, { fontSize: 13, color: Colors.textPrimary, marginTop: 2 }]}>
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
    marginVertical: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  activeChip: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderColor: Colors.primary,
  },
  agentChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  activeAgentChip: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Colors.secondary,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  activeChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loaderContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  debateButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 15,
  },
  debateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
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
  },
  debateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
  }
});
