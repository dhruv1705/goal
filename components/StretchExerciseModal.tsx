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

interface StretchExerciseModalProps {
  visible: boolean
  onComplete: () => void
  onCancel: () => void
}

interface StretchPhase {
  id: string
  name: string
  instruction: string
  emoji: string
  duration: number
  description: string
  breathingCue: string
}

const stretchPhases: StretchPhase[] = [
  {
    id: 'neck-shoulders',
    name: 'Neck & Shoulders',
    instruction: 'Gentle neck rolls and shoulder shrugs',
    emoji: '🤷‍♂️',
    duration: 30,
    description: 'Roll your neck slowly, then lift and drop your shoulders',
    breathingCue: 'Breathe deeply as you release tension'
  },
  {
    id: 'arms-torso',
    name: 'Arms & Torso',
    instruction: 'Reach up high and stretch your arms',
    emoji: '🙆‍♂️',
    duration: 30,
    description: 'Reach both arms overhead, then gently lean left and right',
    breathingCue: 'Inhale as you reach up, exhale as you lean'
  },
  {
    id: 'side-twists',
    name: 'Side Bends & Twists',
    instruction: 'Gentle torso twists and side bends',
    emoji: '🤸‍♂️',
    duration: 30,
    description: 'Place hands on hips, gently twist your torso left and right',
    breathingCue: 'Breathe steadily through each movement'
  },
  {
    id: 'legs-hips',
    name: 'Legs & Hips',
    instruction: 'Simple leg and hip movements',
    emoji: '🦵',
    duration: 30,
    description: 'Gentle leg swings or marching in place',
    breathingCue: 'Keep breathing naturally as you move'
  }
]

export const StretchExerciseModal: React.FC<StretchExerciseModalProps> = ({
  visible,
  onComplete,
  onCancel,
}) => {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [phaseTimer, setPhaseTimer] = useState(30)
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [ambientSound, setAmbientSound] = useState<Audio.Sound | null>(null)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)
  const [exerciseText, setExerciseText] = useState('')
  const [showAudioSelector, setShowAudioSelector] = useState(false)
  const [selectedAmbient, setSelectedAmbient] = useState('forest') // Default to forest for stretching
  const insets = useSafeAreaInsets()

  // Animation refs
  const modalAnim = useRef(new Animated.Value(0)).current
  const phaseAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(0.8)).current
  const progressAnim = useRef(new Animated.Value(0)).current
  const particleAnim1 = useRef(new Animated.Value(0)).current
  const particleAnim2 = useRef(new Animated.Value(0)).current
  const particleAnim3 = useRef(new Animated.Value(0)).current
  const particleOpacity = useRef(new Animated.Value(0)).current
  const backgroundAnim = useRef(new Animated.Value(0)).current

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Load audio
  useEffect(() => {
    const loadAudio = async () => {
      if (!isAudioEnabled) return
      
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        })

        // Create ambient audio based on user selection
        if (isAudioEnabled) {
          console.log('Loading stretch audio with selection:', selectedAmbient)
          await createAmbientAudio()
        } else {
          console.log('Audio disabled, skipping audio creation')
        }
      } catch (error) {
        console.log('Audio setup error:', error)
        setIsAudioEnabled(false)
      }
    }

    if (visible) {
      loadAudio()
    }

    return () => {
      // Aggressive cleanup when component unmounts
      console.log('🔥 Stretch modal useEffect cleanup triggered')
      cleanupAudio().catch(error => {
        console.log('❌ Error in useEffect cleanup:', error)
      })
    }
  }, [visible, isAudioEnabled, selectedAmbient])

  // CRITICAL: Cleanup audio immediately when modal becomes invisible
  useEffect(() => {
    if (!visible) {
      console.log('🔥 Stretch modal became invisible - triggering immediate audio cleanup')
      cleanupAudio().catch(error => {
        console.log('❌ Error in stretch visibility cleanup:', error)
      })
    }
  }, [visible])

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
          return { uri: createEnergivingAmbientSound() }
      }
    } catch (error) {
      console.log('Error loading audio source:', error)
      return { uri: createEnergivingAmbientSound() }
    }
  }

  const createAmbientAudio = async () => {
    try {
      console.log('Creating ambient audio for stretching:', selectedAmbient)
      
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
      
    } catch (error) {
      console.log('Audio creation error:', error)
      console.log('Falling back to generated audio...')
      // Fallback to generated audio if file loading fails
      await createFallbackAudio()
    }
  }
  
  const createFallbackAudio = async () => {
    try {
      const ambientUri = createEnergivingAmbientSound()
      if (ambientUri) {
        const { sound: newAmbientSound } = await Audio.Sound.createAsync(
          { uri: ambientUri },
          {
            isLooping: true,
            volume: 0.3,
            rate: 1.0,
          }
        )
        setAmbientSound(newAmbientSound)
      }
      
      console.log('Fallback audio created successfully')
    } catch (error) {
      console.log('Fallback audio creation error:', error)
      setIsAudioEnabled(false)
    }
  }

  const createEnergivingAmbientSound = () => {
    try {
      // Create uplifting ambient sound for stretching
      const sampleRate = 22050
      const duration = 3 // 3 second loop
      const samples = Math.floor(sampleRate * duration)
      const buffer = new ArrayBuffer(samples * 2)
      const view = new DataView(buffer)
      
      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate
        
        // Create gentle, energizing ambient sound
        const lowFreq = Math.sin(2 * Math.PI * 60 * t) * 0.15 // Slightly higher base frequency
        const midFreq = Math.sin(2 * Math.PI * 220 * t) * 0.08 // Brighter mid tone
        const highFreq = Math.sin(2 * Math.PI * 440 * t) * 0.03 // Subtle high sparkle
        const noise = (Math.random() - 0.5) * 0.02 // Minimal noise
        
        // Add gentle rhythm for movement
        const rhythmMod = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.8 * t) // Gentle pulse
        const sample = (lowFreq + midFreq + highFreq + noise) * rhythmMod
        
        const clampedSample = Math.max(-1, Math.min(1, sample))
        view.setInt16(i * 2, clampedSample * 16383, true)
      }
      
      const wav = createWavFile(buffer, sampleRate)
      return arrayBufferToBase64(wav)
    } catch (error) {
      console.log('Error creating stretch ambient sound:', error)
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

  const cleanupAudio = async () => {
    try {
      console.log('🧹 Starting stretch exercise audio cleanup...')
      
      // Stop and unload ambient sound
      if (ambientSound) {
        try {
          const status = await ambientSound.getStatusAsync()
          if (status.isLoaded) {
            if (status.isPlaying) {
              await ambientSound.stopAsync()
              console.log('✅ Stretch ambient sound stopped')
            }
            await ambientSound.unloadAsync()
            console.log('✅ Stretch ambient sound unloaded')
          }
        } catch (error) {
          console.log('❌ Error cleaning stretch ambient sound:', error)
        }
        setAmbientSound(null)
      }
      
      // Stop any voice instructions
      try {
        await Speech.stop()
        console.log('✅ Voice instructions stopped')
      } catch (error) {
        console.log('❌ Error stopping voice:', error)
      }
      
      console.log('🎯 Stretch exercise audio cleanup completed')
    } catch (error) {
      console.log('❌ Stretch audio cleanup error:', error)
    }
  }

  const speakInstruction = async (instruction: string) => {
    if (isVoiceEnabled && isAudioEnabled) {
      try {
        await Speech.stop()
        await Speech.speak(instruction, {
          language: 'en-US',
          pitch: 1.0,
          rate: 0.8,
        })
      } catch (error) {
        console.log('Voice instruction error:', error)
      }
    }
  }

  const toggleAudio = async () => {
    const newAudioState = !isAudioEnabled
    console.log('Toggling stretch audio from', isAudioEnabled, 'to', newAudioState)
    
    if (newAudioState) {
      // Audio was turned on
      console.log('Enabling stretch audio...')
      setIsAudioEnabled(true)
      
      // Create audio if it doesn't exist
      let audioToUse = ambientSound
      if (!audioToUse) {
        console.log('No existing stretch audio, creating new audio...')
        try {
          await createAmbientAudio()
          // Wait a bit for state to update
          await new Promise(resolve => setTimeout(resolve, 100))
          audioToUse = ambientSound
        } catch (error) {
          console.log('Error creating stretch audio during toggle:', error)
          return
        }
      }
      
      // If exercise is active, start playing immediately
      if (isActive) {
        try {
          console.log('Stretch exercise is active, starting audio immediately...')
          if (audioToUse) {
            await audioToUse.playAsync()
            await audioToUse.setVolumeAsync(0.4)
            console.log('Stretch audio started successfully after toggle')
          } else {
            console.log('Stretch audio object not available yet, retrying...')
            // Retry with a slight delay
            setTimeout(async () => {
              if (ambientSound && isAudioEnabled) {
                try {
                  await ambientSound.playAsync()
                  await ambientSound.setVolumeAsync(0.4)
                  console.log('Stretch audio started successfully after retry')
                } catch (retryError) {
                  console.log('Stretch audio retry failed:', retryError)
                }
              }
            }, 200)
          }
        } catch (error) {
          console.log('Stretch audio enable error:', error)
        }
      }
    } else {
      // Audio was turned off
      console.log('Disabling stretch audio...')
      setIsAudioEnabled(false)
      
      if (ambientSound) {
        try {
          await ambientSound.stopAsync()
          console.log('Stretch audio stopped successfully')
        } catch (error) {
          console.log('Stretch audio disable error:', error)
        }
      }
    }
  }

  // Modal entrance animation and cleanup
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
      // CRITICAL: Cleanup audio immediately when modal becomes invisible
      if (!visible) {
        console.log('🚨 Stretch modal became invisible, triggering immediate audio cleanup')
        cleanupAudio().catch(error => {
          console.log('❌ Error in immediate stretch cleanup:', error)
        })
      }
    }
  }, [visible])

  const startStretchExercise = async () => {
    setIsActive(true)
    setCurrentPhaseIndex(0)
    setPhaseTimer(30)
    setExerciseText("Let's get your body moving! 💪")
    
    // Start ambient audio
    if (ambientSound && isAudioEnabled) {
      try {
        await ambientSound.playAsync()
      } catch (error) {
        console.log('Ambient sound start error:', error)
      }
    }
    
    // Start particle animations
    startParticleAnimations()
    
    // Start first phase
    startPhase(0)
  }

  const startParticleAnimations = () => {
    const particles = [particleAnim1, particleAnim2, particleAnim3]
    
    particles.forEach((particle, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 600),
          Animated.timing(particle, {
            toValue: 1,
            duration: 4000,
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

  const startPhase = async (phaseIndex: number) => {
    if (phaseIndex >= stretchPhases.length) {
      completeExercise()
      return
    }

    const phase = stretchPhases[phaseIndex]
    setCurrentPhaseIndex(phaseIndex)
    setPhaseTimer(phase.duration)
    setExerciseText(phase.instruction)

    // Speak phase instruction
    await speakInstruction(`${phase.name}. ${phase.description}`)

    // Phase entrance animation
    Animated.sequence([
      Animated.timing(phaseAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(phaseAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start()

    // Background color transition
    Animated.timing(backgroundAnim, {
      toValue: phaseIndex / (stretchPhases.length - 1),
      duration: 1000,
      useNativeDriver: false,
    }).start()

    // Start timer and progress animation
    progressAnim.setValue(0)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: phase.duration * 1000,
      useNativeDriver: false,
    }).start()

    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start()

    // Start countdown timer
    timerRef.current = setInterval(() => {
      setPhaseTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          setTimeout(() => startPhase(phaseIndex + 1), 1000)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const completeExercise = async () => {
    setIsActive(false)
    setExerciseText("Fantastic work! Your body feels amazing! ✨")
    
    // CRITICAL: Properly cleanup all audio resources
    await cleanupAudio()
    
    // Celebration animation
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.3,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1.0,
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
    setCurrentPhaseIndex(0)
    setPhaseTimer(30)
    setExerciseText('')
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    // Stop voice instructions
    await Speech.stop()
    
    // CRITICAL: Properly cleanup all audio resources
    await cleanupAudio()
    
    onCancel()
  }

  const getCurrentPhase = () => stretchPhases[currentPhaseIndex] || stretchPhases[0]

  const renderParticles = () => {
    const particles = [particleAnim1, particleAnim2, particleAnim3]
    const positions: any[] = [
      { top: '25%', left: '20%' },
      { top: '35%', right: '25%' },
      { top: '65%', left: '15%' },
    ]

    return particles.map((particle, index) => (
      <Animated.View
        key={index}
        style={[
          styles.particle,
          positions[index],
          {
            opacity: particleOpacity,
            transform: [
              {
                translateY: particle.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -80]
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
              outputRange: ['#065F46', '#047857'] // Green energizing gradient
            })
          }
        ]}>
          <LinearGradient
            colors={['#065F46', '#047857', '#059669']}
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
        
        {/* Audio toggle button */}
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

        {/* Particles */}
        {renderParticles()}

        {/* Main content */}
        <View style={styles.content}>
          {!isActive ? (
            <View style={styles.startContainer}>
              <Text style={styles.welcomeTitle}>2-Minute Stretch</Text>
              <Text style={styles.welcomeSubtitle}>
                Let's get your body moving with gentle full-body stretches
              </Text>
              
              <TouchableOpacity
                style={styles.startButton}
                onPress={startStretchExercise}
              >
                <LinearGradient
                  colors={['#10B981', '#059669', '#047857']}
                  style={styles.startButtonGradient}
                >
                  <Text style={styles.startButtonText}>Let's Stretch!</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.stretchContainer}>
              {/* Main stretch indicator */}
              <Animated.View style={[
                styles.stretchIndicatorContainer,
                {
                  opacity: phaseAnim,
                  transform: [
                    { scale: pulseAnim },
                    { translateY: phaseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0]
                    })}
                  ]
                }
              ]}>
                <LinearGradient
                  colors={['#34D399', '#10B981', '#059669']}
                  style={styles.stretchIndicator}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.stretchEmoji}>{getCurrentPhase().emoji}</Text>
                </LinearGradient>
              </Animated.View>

              {/* Stretch instructions */}
              <View style={styles.instructionsContainer}>
                <Text style={styles.phaseTitle}>{getCurrentPhase().name}</Text>
                <Text style={styles.phaseDescription}>{getCurrentPhase().description}</Text>
                <Text style={styles.breathingCue}>{getCurrentPhase().breathingCue}</Text>
                
                {/* Timer */}
                <View style={styles.timerContainer}>
                  <Text style={styles.timerText}>{phaseTimer}s</Text>
                  <View style={styles.timerProgress}>
                    <Animated.View style={[
                      styles.timerProgressFill,
                      { 
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%']
                        })
                      }
                    ]} />
                  </View>
                </View>

                {/* Phase progress */}
                <View style={styles.phaseProgressContainer}>
                  <View style={styles.phaseProgressDots}>
                    {stretchPhases.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.phaseProgressDot,
                          index <= currentPhaseIndex && styles.phaseProgressDotCompleted
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.phaseProgressText}>
                    Phase {currentPhaseIndex + 1} of {stretchPhases.length}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.encouragementText}>{exerciseText}</Text>
            </View>
          )}
        </View>
        
        {/* Audio Selector Modal */}
        <AudioSelector
          visible={showAudioSelector}
          onClose={() => setShowAudioSelector(false)}
          context="stretching"
          onSelectAmbient={async (option) => {
            console.log('Selecting ambient for stretching:', option.name)
            setSelectedAmbient(option.id)
            
            // Store whether we need to restart audio after creation
            const shouldRestartAudio = isActive && isAudioEnabled && ambientSound
            let wasPlaying = false
            
            // Check if current audio is playing
            if (shouldRestartAudio) {
              try {
                const status = await ambientSound.getStatusAsync()
                wasPlaying = status.isLoaded && status.isPlaying
                console.log('Current stretch audio playing status:', wasPlaying)
              } catch (error) {
                console.log('Error checking stretch audio status:', error)
                wasPlaying = true // Assume it was playing
              }
            }
            
            // Unload old audio
            if (ambientSound) {
              try {
                await ambientSound.stopAsync()
                await ambientSound.unloadAsync()
                setAmbientSound(null)
              } catch (error) {
                console.log('Error unloading old stretch audio:', error)
              }
            }
            
            // Create new audio if audio is enabled
            if (isAudioEnabled) {
              try {
                console.log('Creating new stretch ambient audio for:', option.id)
                
                // Get the audio source
                const getNewAudioSource = () => {
                  switch (option.id) {
                    case 'angelical':
                      return require('../assets/audio/ambient/angelical.mp3')
                    case 'forest':
                      return require('../assets/audio/ambient/forest.mp3')
                    case 'rain':
                      return require('../assets/audio/ambient/rain.mp3')
                    case 'generated-ambient':
                    default:
                      return { uri: createEnergivingAmbientSound() }
                  }
                }
                
                const audioSource = getNewAudioSource()
                const { sound: newAmbientSound } = await Audio.Sound.createAsync(
                  audioSource,
                  {
                    isLooping: true,
                    volume: 0.4,
                    rate: 1.0,
                  }
                )
                
                console.log('New stretch ambient sound created successfully')
                setAmbientSound(newAmbientSound)
                
                // If exercise was active and audio was playing, restart immediately
                if (shouldRestartAudio && wasPlaying) {
                  console.log('Restarting stretch audio immediately...')
                  await newAmbientSound.playAsync()
                  await newAmbientSound.setVolumeAsync(0.4)
                  console.log('Stretch audio restarted successfully with new selection')
                }
                
              } catch (error) {
                console.log('Error creating new stretch audio:', error)
                // Fallback to generated audio
                try {
                  const fallbackUri = createEnergivingAmbientSound()
                  if (fallbackUri) {
                    const { sound: fallbackSound } = await Audio.Sound.createAsync(
                      { uri: fallbackUri },
                      {
                        isLooping: true,
                        volume: 0.3,
                        rate: 1.0,
                      }
                    )
                    setAmbientSound(fallbackSound)
                    
                    if (shouldRestartAudio && wasPlaying) {
                      await fallbackSound.playAsync()
                      console.log('Fallback stretch audio restarted')
                    }
                  }
                } catch (fallbackError) {
                  console.log('Fallback stretch audio creation failed:', fallbackError)
                  setIsAudioEnabled(false)
                }
              }
            }
          }}
          onSelectGuidance={(option) => {
            // Guidance selection disabled for stretching
            console.log('Guidance selection disabled for stretching')
          }}
          currentAmbient={selectedAmbient}
          currentGuidance=""
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
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34D399',
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
    color: '#A7F3D0',
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
  stretchContainer: {
    alignItems: 'center',
  },
  stretchIndicatorContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  stretchIndicator: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  stretchEmoji: {
    fontSize: 64,
  },
  instructionsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  phaseTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  phaseDescription: {
    fontSize: 16,
    color: '#A7F3D0',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  breathingCue: {
    fontSize: 14,
    color: '#6EE7B7',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  timerProgress: {
    width: 200,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerProgressFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 3,
  },
  phaseProgressContainer: {
    alignItems: 'center',
  },
  phaseProgressDots: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  phaseProgressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  phaseProgressDotCompleted: {
    backgroundColor: '#34D399',
    borderColor: '#6EE7B7',
  },
  phaseProgressText: {
    fontSize: 14,
    color: '#A7F3D0',
    fontWeight: '500',
  },
  encouragementText: {
    fontSize: 16,
    color: '#A7F3D0',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
  },
})