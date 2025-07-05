import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface AudioOption {
  id: string
  name: string
  description: string
  type: 'generated' | 'file'
  source?: any // For require() imports
  stretchDescription?: string // Alternative description for stretching context
}

type AudioContext = 'breathing' | 'stretching'

interface AudioSelectorProps {
  visible: boolean
  onClose: () => void
  onSelectAmbient: (option: AudioOption) => void
  onSelectGuidance: (option: AudioOption) => void
  currentAmbient?: string
  currentGuidance?: string
  context?: AudioContext // New prop for context
}

const ambientOptions: AudioOption[] = [
  {
    id: 'generated-ambient',
    name: 'Generated Ambient',
    description: 'Synthesized calming tones',
    stretchDescription: 'Synthesized gentle energy tones',
    type: 'generated'
  },
  {
    id: 'angelical',
    name: 'Angelical',
    description: 'Ethereal angelic soundscape for deep relaxation',
    stretchDescription: 'Peaceful angelic sounds for mindful movement',
    type: 'file',
    source: require('../assets/audio/ambient/angelical.mp3')
  },
  {
    id: 'forest',
    name: 'Forest Sounds',
    description: 'Birds and rustling leaves for meditation',
    stretchDescription: 'Natural forest ambience for flowing movement',
    type: 'file',
    source: require('../assets/audio/ambient/forest.mp3')
  },
  {
    id: 'rain',
    name: 'Gentle Rain',
    description: 'Soft rainfall for deep breathing',
    stretchDescription: 'Rhythmic rain sounds for gentle stretching',
    type: 'file',
    source: require('../assets/audio/ambient/rain.mp3')
  }
]

const guidanceOptions: AudioOption[] = [
  {
    id: 'generated-chime',
    name: 'Generated Chime',
    description: 'Synthesized bell tone',
    type: 'generated'
  }
  // Additional guidance options can be added when audio files are available
]

export const AudioSelector: React.FC<AudioSelectorProps> = ({
  visible,
  onClose,
  onSelectAmbient,
  onSelectGuidance,
  currentAmbient,
  currentGuidance,
  context = 'breathing' // Default to breathing for backward compatibility
}) => {
  if (!visible) return null

  const renderOption = (
    option: AudioOption, 
    isSelected: boolean, 
    onSelect: (option: AudioOption) => void,
    isDisabled: boolean = false
  ) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.option,
        isSelected && styles.optionSelected,
        isDisabled && styles.optionDisabled
      ]}
      onPress={() => !isDisabled && onSelect(option)}
      disabled={isDisabled}
    >
      <View style={styles.optionContent}>
        <Text style={[
          styles.optionName,
          isSelected && styles.optionNameSelected,
          isDisabled && styles.optionNameDisabled
        ]}>
          {option.name}
          {option.type === 'file' && !option.source && ' (Not Available)'}
        </Text>
        <Text style={[
          styles.optionDescription,
          isDisabled && styles.optionDescriptionDisabled
        ]}>
          {context === 'stretching' && option.stretchDescription 
            ? option.stretchDescription 
            : option.description}
        </Text>
      </View>
      {isSelected && <Text style={styles.checkmark}>✓</Text>}
    </TouchableOpacity>
  )

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {context === 'stretching' ? 'Stretch Audio Settings' : 'Breathing Audio Settings'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {context === 'stretching' ? 'Stretching Background Music' : 'Meditation Background Sound'}
          </Text>
          {ambientOptions.map(option => 
            renderOption(
              option,
              currentAmbient === option.id,
              onSelectAmbient,
              false // All ambient options are now available
            )
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Breath Guidance Sound</Text>
          {guidanceOptions.map(option => 
            renderOption(
              option,
              currentGuidance === option.id,
              onSelectGuidance,
              false // Only showing available options
            )
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your ambient sounds: Angelical, Forest, Rain ✓
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 20,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  optionSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F8F7FF',
  },
  optionDisabled: {
    opacity: 0.5,
    backgroundColor: '#F9FAFB',
  },
  optionContent: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  optionNameSelected: {
    color: '#7C3AED',
  },
  optionNameDisabled: {
    color: '#9CA3AF',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  optionDescriptionDisabled: {
    color: '#9CA3AF',
  },
  checkmark: {
    fontSize: 20,
    color: '#7C3AED',
    fontWeight: 'bold',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
})