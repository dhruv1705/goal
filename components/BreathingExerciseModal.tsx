import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Animated,
  Easing,
  StatusBar,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Audio } from 'expo-av'
import * as Speech from 'expo-speech'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AudioSelector } from './AudioSelector'

const { width, height } = Dimensions.get('window')

interface BreathingExerciseModalProps {
  visible: boolean
  onComplete: () => void
  onCancel: () => void
}

export const BreathingExerciseModal: React.FC<BreathingExerciseModalProps> = ({
  visible,
  onComplete,
  onCancel,
}) => {
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'exhale' | 'hold'>('inhale')
  const [breathCount, setBreathCount] = useState(0)
  const [breathingText, setBreathingText] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [ambientSound, setAmbientSound] = useState<Audio.Sound | null>(null)
  const [breathSound, setBreathSound] = useState<Audio.Sound | null>(null)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [audioStatus, setAudioStatus] = useState('not started')
  const [showAudioSelector, setShowAudioSelector] = useState(false)
  const [selectedAmbient, setSelectedAmbient] = useState('angelical') // Default to new angelical sound
  const [selectedGuidance, setSelectedGuidance] = useState('generated-chime')
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)
  const [voiceLanguage, setVoiceLanguage] = useState('en-US')
  const insets = useSafeAreaInsets()

  // Animation refs
  const breathingAnim = useRef(new Animated.Value(0.6)).current
  const backgroundAnim = useRef(new Animated.Value(0)).current
  const particleAnim1 = useRef(new Animated.Value(0)).current
  const particleAnim2 = useRef(new Animated.Value(0)).current
  const particleAnim3 = useRef(new Animated.Value(0)).current
  const particleAnim4 = useRef(new Animated.Value(0)).current
  const particleAnim5 = useRef(new Animated.Value(0)).current
  const particleOpacity = useRef(new Animated.Value(0)).current
  const modalAnim = useRef(new Animated.Value(0)).current

  // Breathing guidance texts
  const encouragingTexts = [
    "Welcome to your breathing space...",
    "Feel the calm flowing through you...",
    "Let go of any tension...",
    "You're doing wonderfully...",
    "Almost there, stay focused..."
  ]

  // Load and manage ambient audio
  useEffect(() => {
    const loadAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        })

        // Create ambient sounds based on user selection
        if (isAudioEnabled) {
          console.log('Loading audio with isAudioEnabled:', isAudioEnabled)
          console.log('Selected ambient audio:', selectedAmbient)
          await createAmbientAudio()
        } else {
          console.log('Audio disabled, skipping audio creation')
        }
        
        console.log('Audio system ready')
      } catch (error) {
        console.log('Audio setup error:', error)
        setIsAudioEnabled(false)
      }
    }

    if (visible) {
      loadAudio()
    }

    return () => {
      cleanupAudio()
    }
  }, [visible, isAudioEnabled, selectedAmbient, selectedGuidance])

  const getAmbientAudioSource = () => {
    try {
      switch (selectedAmbient) {
        case 'angelical':
          return require('../assets/audio/ambient/angelical.mp3')
        case 'forest':
          return require('../assets/audio/ambient/forest.mp3')
        case 'rain':
          return require('../assets/audio/ambient/rain.mp3')
        case 'generated-ambient':
        default:
          return { uri: createWorkingAmbientSound() }
      }
    } catch (error) {
      console.log('Error loading audio source:', error)
      return { uri: createWorkingAmbientSound() }
    }
  }

  // Removed guidance audio source - now using dynamic breathing sounds

  const createAmbientAudio = async () => {
    try {
      console.log('Creating ambient audio for:', selectedAmbient)
      
      const ambientSource = getAmbientAudioSource()
      console.log('Ambient source:', ambientSource)
      
      const { sound: newAmbientSound } = await Audio.Sound.createAsync(
        ambientSource,
        {
          isLooping: true,
          volume: 0.4, // Slightly higher for music files
          rate: 1.0,
        }
      )
      
      console.log('Ambient sound created successfully')
      setAmbientSound(newAmbientSound)
      
      // Skip creating breath guidance sounds - we'll create them dynamically
      console.log('Skipping guidance audio creation - using dynamic breath sounds')
      setBreathSound(null) // We'll create sounds dynamically
      
    } catch (error) {
      console.log('Audio creation error:', error)
      console.log('Falling back to generated audio...')
      // Fallback to generated audio if file loading fails
      await createFallbackAudio()
    }
  }
  
  const createFallbackAudio = async () => {
    try {
      const ambientUri = createWorkingAmbientSound()
      const { sound: newAmbientSound } = await Audio.Sound.createAsync(
        { uri: ambientUri },
        {
          isLooping: true,
          volume: 0.3,
          rate: 1.0,
        }
      )
      setAmbientSound(newAmbientSound)
      
      // No need to create guidance sounds in fallback
      setBreathSound(null)
      
      console.log('Fallback audio created successfully')
    } catch (error) {
      console.log('Fallback audio creation error:', error)
      setIsAudioEnabled(false)
    }
  }
  
  const createWorkingAmbientSound = () => {
    try {
      // Create a gentle ambient sound with multiple frequencies
      const sampleRate = 22050
      const duration = 2 // 2 second loop
      const samples = Math.floor(sampleRate * duration)
      const buffer = new ArrayBuffer(samples * 2)
      const view = new DataView(buffer)
      
      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate
        
        // Create layered ambient sound
        const lowFreq = Math.sin(2 * Math.PI * 40 * t) * 0.1 // Very low rumble
        const midFreq = Math.sin(2 * Math.PI * 200 * t) * 0.05 // Mid tone
        const noise = (Math.random() - 0.5) * 0.03 // Gentle white noise
        
        // Combine and apply envelope
        const envelope = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.25 * t) // Slow breathing-like modulation
        const sample = (lowFreq + midFreq + noise) * envelope
        
        const clampedSample = Math.max(-1, Math.min(1, sample))
        view.setInt16(i * 2, clampedSample * 16383, true) // Reduced amplitude for safety
      }
      
      const wav = createWavFile(buffer, sampleRate)
      return arrayBufferToBase64(wav)
    } catch (error) {
      console.log('Error creating ambient sound:', error)
      return null
    }
  }
  
  const createBreathingSoundForPhase = (phase: 'inhale' | 'exhale' | 'hold') => {
    try {
      const sampleRate = 22050
      let duration, samples
      
      switch (phase) {
        case 'inhale':
          duration = 4.0 // 4 seconds for inhale
          break
        case 'exhale':
          duration = 4.0 // 4 seconds for exhale
          break
        case 'hold':
          duration = 1.0 // 1 second for hold
          break
      }
      
      samples = Math.floor(sampleRate * duration)
      const buffer = new ArrayBuffer(samples * 2)
      const view = new DataView(buffer)
      
      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate
        let sample = 0
        
        if (phase === 'inhale') {
          // Create inhaling sound - air flowing in
          // White noise with low-pass filter, volume increasing
          const noise = (Math.random() - 0.5) * 0.4
          const lowPass = Math.sin(t * 100) * 0.1 // Low frequency movement
          const envelope = Math.min(1, t / 2) * Math.exp(-t * 0.3) // Gradual increase then decrease
          const airFlow = Math.sin(2 * Math.PI * 0.5 * t) * 0.15 // Breathing rhythm
          sample = (noise * 0.3 + lowPass + airFlow) * envelope
          
        } else if (phase === 'exhale') {
          // Create exhaling sound - air flowing out (different texture)
          const noise = (Math.random() - 0.5) * 0.5
          const breath = Math.sin(2 * Math.PI * 0.3 * t) * 0.2 // Slower, deeper
          const envelope = Math.exp(-t * 0.4) * (1 - t / 4) // Gradual decrease
          const airFlow = Math.sin(2 * Math.PI * 0.4 * t) * 0.1
          sample = (noise * 0.4 + breath + airFlow) * envelope
          
        } else if (phase === 'hold') {
          // Create gentle hold sound - very subtle
          const subtle = Math.sin(2 * Math.PI * 60 * t) * 0.02 // Very quiet tone
          const envelope = Math.exp(-t * 2) // Quick fade
          sample = subtle * envelope
        }
        
        const clampedSample = Math.max(-1, Math.min(1, sample))
        view.setInt16(i * 2, clampedSample * 8192, true) // Reduced amplitude
      }
      
      const wav = createWavFile(buffer, sampleRate)
      return arrayBufferToBase64(wav)
    } catch (error) {
      console.log('Error creating breathing sound:', error)
      return null
    }
  }
  
  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const uint8Array = new Uint8Array(buffer)
    let binaryString = ''
    const chunkSize = 1024
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize)
      binaryString += String.fromCharCode.apply(null, Array.from(chunk))
    }
    
    return `data:audio/wav;base64,${btoa(binaryString)}`
  }

  const createAmbientSoundDataUri = () => {
    try {
      // Create a simple ambient sound using Web Audio API concepts
      const sampleRate = 44100
      const duration = 1 // 1 second loop (shorter for better performance)
      const samples = sampleRate * duration
      const buffer = new ArrayBuffer(samples * 2) // 16-bit
      const view = new DataView(buffer)
      
      for (let i = 0; i < samples; i++) {
        // Create gentle white noise with low-pass filter effect
        const noise = (Math.random() - 0.5) * 0.05 // Reduced volume
        const sine = Math.sin(i * 0.0001) * 0.02 // Low frequency sine
        const sample = Math.max(-32767, Math.min(32767, (noise + sine) * 32767))
        view.setInt16(i * 2, sample, true)
      }
      
      // Convert to WAV format
      const wav = createWavFile(buffer, sampleRate)
      const uint8Array = new Uint8Array(wav)
      let binaryString = ''
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i])
      }
      return `data:audio/wav;base64,${btoa(binaryString)}`
    } catch (error) {
      console.log('Error creating ambient sound:', error)
      return null
    }
  }

  const createBreathSoundDataUri = () => {
    try {
      // Create a gentle chime for breath guidance
      const sampleRate = 44100
      const duration = 0.3 // 0.3 seconds (shorter)
      const samples = sampleRate * duration
      const buffer = new ArrayBuffer(samples * 2)
      const view = new DataView(buffer)
      
      for (let i = 0; i < samples; i++) {
        // Create a gentle bell-like tone
        const t = i / sampleRate
        const frequency = 523 // C note (higher, more pleasant)
        const envelope = Math.exp(-t * 4) // Faster decay
        const sample = Math.max(-32767, Math.min(32767, Math.sin(2 * Math.PI * frequency * t) * envelope * 0.2 * 32767))
        view.setInt16(i * 2, sample, true)
      }
      
      const wav = createWavFile(buffer, sampleRate)
      const uint8Array = new Uint8Array(wav)
      let binaryString = ''
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i])
      }
      return `data:audio/wav;base64,${btoa(binaryString)}`
    } catch (error) {
      console.log('Error creating breath sound:', error)
      return null
    }
  }

  const createWavFile = (audioBuffer: ArrayBuffer, sampleRate: number) => {
    const length = audioBuffer.byteLength
    const buffer = new ArrayBuffer(44 + length)
    const view = new DataView(buffer)
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, length, true)
    
    // Copy audio data
    const audioView = new Uint8Array(audioBuffer)
    const wavView = new Uint8Array(buffer, 44)
    wavView.set(audioView)
    
    return buffer
  }

  const cleanupAudio = async () => {
    try {
      if (ambientSound) {
        await ambientSound.stopAsync()
        await ambientSound.unloadAsync()
        setAmbientSound(null)
      }
      if (breathSound) {
        await breathSound.unloadAsync()
        setBreathSound(null)
      }
    } catch (error) {
      console.log('Audio cleanup error:', error)
    }
  }

  const speakInstruction = async (instruction: string) => {
    if (isVoiceEnabled && isAudioEnabled) {
      try {
        console.log('Speaking:', instruction)
        
        // Stop any currently speaking voice
        await Speech.stop()
        
        // Configure voice options
        const speechOptions = {
          language: voiceLanguage,
          pitch: 0.8, // Slightly lower pitch for calming effect
          rate: 0.7, // Slower speech for meditation
          quality: Speech.VoiceQuality.Enhanced,
        }
        
        // Speak the instruction
        await Speech.speak(instruction, speechOptions)
        
        console.log('Voice instruction completed:', instruction)
      } catch (error) {
        console.log('Voice instruction error:', error)
      }
    }
  }
  
  const stopVoiceInstructions = async () => {
    try {
      await Speech.stop()
      console.log('Voice instructions stopped')
    } catch (error) {
      console.log('Error stopping voice:', error)
    }
  }

  const toggleAudio = async () => {
    const newAudioState = !isAudioEnabled
    setIsAudioEnabled(newAudioState)
    
    if (newAudioState) {
      // Audio was turned on
      console.log('Enabling audio...')
      if (!ambientSound) {
        await createAmbientAudio()
      }
      if (isActive && ambientSound) {
        try {
          console.log('Re-starting ambient audio after toggle...')
          await ambientSound.playAsync()
          await ambientSound.setVolumeAsync(0.1)
          console.log('Audio re-started successfully')
        } catch (error) {
          console.log('Audio enable error:', error)
        }
      }
    } else {
      // Audio was turned off
      console.log('Disabling audio...')
      if (ambientSound) {
        try {
          await ambientSound.stopAsync()
        } catch (error) {
          console.log('Audio disable error:', error)
        }
      }
    }
  }

  // Modal entrance animation
  useEffect(() => {
    if (visible) {
      Animated.timing(modalAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start()
    } else {
      modalAnim.setValue(0)
    }
  }, [visible])

  const startBreathingExercise = async () => {
    setIsActive(true)
    setBreathCount(0)
    
    // Start ambient audio with simplified approach
    if (ambientSound && isAudioEnabled) {
      try {
        console.log('Starting ambient audio...')
        setAudioStatus('playing')
        await ambientSound.playAsync()
        console.log('Ambient audio started successfully')
        // Set audible volume
        await ambientSound.setVolumeAsync(0.3)
        console.log('Ambient volume set to 0.3')
      } catch (error) {
        console.log('Ambient sound start error:', error)
      }
    }
    
    // Start particle animations
    const startParticles = () => {
      const particles = [particleAnim1, particleAnim2, particleAnim3, particleAnim4, particleAnim5]
      
      particles.forEach((particle, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 800),
            Animated.timing(particle, {
              toValue: 1,
              duration: 6000,
              useNativeDriver: true,
            }),
            Animated.timing(particle, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ).start()
      })

      Animated.timing(particleOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start()
    }

    startParticles()
    breathingCycle()
  }

  const breathingCycle = () => {
    const currentBreathIndex = breathCount
    const encouragingText = encouragingTexts[Math.min(currentBreathIndex, encouragingTexts.length - 1)]
    setBreathingText(encouragingText)
    
    // Inhale phase
    setBreathingPhase('inhale')
    // No voice instructions - just background music
    
    Animated.parallel([
      Animated.timing(breathingAnim, {
        toValue: 1.0,
        duration: 4000,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }),
      Animated.timing(backgroundAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: false,
      })
    ]).start(() => {
      // Brief hold
      setBreathingPhase('hold')
      // No voice instructions - just background music
      setTimeout(() => {
        // Exhale phase
        setBreathingPhase('exhale')
        // No voice instructions - just background music
        
        Animated.parallel([
          Animated.timing(breathingAnim, {
            toValue: 0.6,
            duration: 4000,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
          }),
          Animated.timing(backgroundAnim, {
            toValue: 0,
            duration: 4000,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: false,
          })
        ]).start(() => {
          setBreathCount(prev => {
            const newCount = prev + 1
            if (newCount >= 5) {
              completeExercise()
              return 5
            }
            setTimeout(breathingCycle, 1000) // Brief pause between breaths
            return newCount
          })
        })
      }, 1000) // Hold at top of inhale
    })
  }

  const completeExercise = async () => {
    setIsActive(false)
    setBreathingText("Beautiful work! 🌟")
    
    // No voice instructions to stop
    
    // Stop ambient audio
    if (ambientSound && isAudioEnabled) {
      try {
        console.log('Stopping ambient audio...')
        setAudioStatus('stopped')
        await ambientSound.stopAsync()
        console.log('Ambient audio stopped successfully')
      } catch (error) {
        console.log('Audio stop error:', error)
      }
    }
    
    // Celebration animation
    Animated.sequence([
      Animated.timing(breathingAnim, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(breathingAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()

    setTimeout(() => {
      onComplete()
    }, 2000)
  }

  const handleCancel = async () => {
    setIsActive(false)
    setBreathCount(0)
    setBreathingText('')
    breathingAnim.setValue(0.6)
    backgroundAnim.setValue(0)
    particleOpacity.setValue(0)
    
    // No voice instructions to stop
    
    // Stop ambient audio
    if (ambientSound && isAudioEnabled) {
      try {
        await ambientSound.stopAsync()
      } catch (error) {
        console.log('Audio stop error:', error)
      }
    }
    
    onCancel()
  }

  const getPhaseText = () => {
    switch (breathingPhase) {
      case 'inhale': return 'Breathe In...'
      case 'hold': return 'Hold...'
      case 'exhale': return 'Breathe Out...'
      default: return ''
    }
  }

  const renderParticles = () => {
    const particles = [particleAnim1, particleAnim2, particleAnim3, particleAnim4, particleAnim5]
    const positions = [
      { top: '20%', left: '15%' },
      { top: '30%', right: '20%' },
      { top: '60%', left: '10%' },
      { top: '70%', right: '15%' },
      { top: '45%', left: '80%' },
    ]

    return particles.map((particle, index) => (
      <Animated.View
        key={index}
        style={[
          styles.fullScreenParticle,
          positions[index],
          {
            opacity: particleOpacity,
            transform: [
              {
                translateY: particle.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -100]
                })
              },
              {
                scale: particle.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 1, 0]
                })
              }
            ]
          }
        ]}
      />
    ))
  }

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={false}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: modalAnim,
            transform: [{ scale: modalAnim }]
          }
        ]}
      >
        <Animated.View style={[
          styles.backgroundGradient,
          {
            backgroundColor: backgroundAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['#1E1B4B', '#312E81']
            })
          }
        ]}>
          <LinearGradient
            colors={['#1E1B4B', '#312E81', '#1E1B4B']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Close button */}
        <TouchableOpacity 
          style={[styles.closeButton, { top: insets.top + 20 }]}
          onPress={handleCancel}
        >
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
        
        {/* Audio toggle button with status */}
        <TouchableOpacity 
          style={[styles.audioButton, { top: insets.top + 20 }]}
          onPress={toggleAudio}
        >
          <Text style={styles.audioButtonText}>{isAudioEnabled ? '🔊' : '🔇'}</Text>
        </TouchableOpacity>
        
        {/* Audio settings button */}
        <TouchableOpacity 
          style={[styles.audioSettingsButton, { top: insets.top + 80 }]}
          onPress={() => setShowAudioSelector(true)}
        >
          <Text style={styles.audioButtonText}>⚙️</Text>
        </TouchableOpacity>
        
        {/* Voice toggle button - hidden for now */}
        
        {/* Audio status indicator for debugging */}
        {__DEV__ && (
          <View style={[styles.audioStatus, { top: insets.top + 200 }]}>
            <Text style={styles.audioStatusText}>Audio: {audioStatus}</Text>
            {/* Voice status hidden */}
          </View>
        )}

        {/* Particles */}
        {renderParticles()}

        {/* Main content */}
        <View style={styles.content}>
          {!isActive ? (
            <View style={styles.startContainer}>
              <Text style={styles.welcomeTitle}>Deep Breathing</Text>
              <Text style={styles.welcomeSubtitle}>
                Take a moment to center yourself with 5 mindful breaths
              </Text>
              
              <TouchableOpacity
                style={styles.startButton}
                onPress={startBreathingExercise}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                  style={styles.startButtonGradient}
                >
                  <Text style={styles.startButtonText}>Begin</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.breathingContainer}>
              {/* Main breathing circle */}
              <Animated.View style={[
                styles.breathingCircleContainer,
                {
                  transform: [{ scale: breathingAnim }]
                }
              ]}>
                <LinearGradient
                  colors={['#60A5FA', '#8B5CF6', '#3B82F6']}
                  style={styles.breathingCircle}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.breathingEmoji}>🌬️</Text>
                </LinearGradient>
              </Animated.View>

              {/* Breathing instructions */}
              <View style={styles.instructionsContainer}>
                <Text style={styles.phaseText}>{getPhaseText()}</Text>
                <Text style={styles.encouragementText}>{breathingText}</Text>
                
                {/* Progress indicator */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressDots}>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <View
                        key={num}
                        style={[
                          styles.progressDot,
                          breathCount >= num && styles.progressDotCompleted
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.progressText}>{breathCount}/5</Text>
                </View>
              </View>
            </View>
          )}
        </View>
        
        {/* Audio Selector Modal */}
        <AudioSelector
          visible={showAudioSelector}
          onClose={() => setShowAudioSelector(false)}
          onSelectAmbient={async (option) => {
            console.log('Selecting ambient:', option.name)
            setSelectedAmbient(option.id)
            
            // Recreate audio with new selection
            if (ambientSound) {
              await ambientSound.unloadAsync()
              setAmbientSound(null)
            }
            
            // Recreate audio with new selection
            if (isAudioEnabled) {
              await createAmbientAudio()
              
              // If currently playing, restart with new audio
              if (isActive && ambientSound) {
                try {
                  await ambientSound.playAsync()
                  await ambientSound.setVolumeAsync(0.4)
                } catch (error) {
                  console.log('Error restarting audio:', error)
                }
              }
            }
          }}
          onSelectGuidance={(option) => {
            // Guidance selection disabled - using realistic breathing sounds
            console.log('Guidance selection: using breathing sounds instead')
          }}
          currentAmbient={selectedAmbient}
          currentGuidance={selectedGuidance}
        />
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  audioButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioButtonText: {
    fontSize: 20,
  },
  audioSettingsButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioStatus: {
    position: 'absolute',
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  audioStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  startContainer: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#C7D2FE',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 26,
  },
  startButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  startButtonGradient: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  breathingContainer: {
    alignItems: 'center',
  },
  breathingCircleContainer: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  breathingCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 140,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  breathingEmoji: {
    fontSize: 48,
  },
  instructionsContainer: {
    alignItems: 'center',
  },
  phaseText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  encouragementText: {
    fontSize: 18,
    color: '#C7D2FE',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 32,
    minHeight: 24,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  progressDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotCompleted: {
    backgroundColor: '#8B5CF6',
    borderColor: '#A78BFA',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  progressText: {
    fontSize: 16,
    color: '#A78BFA',
    fontWeight: '600',
  },
  fullScreenParticle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#A78BFA',
  },
})