import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  Vibration,
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label?: string
  error?: string
  containerStyle?: any
  inputStyle?: any
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  error,
  containerStyle,
  inputStyle,
  ...textInputProps
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const togglePasswordVisibility = () => {
    // Add haptic feedback
    try {
      Vibration.vibrate(50) // Light vibration for 50ms
    } catch (error) {
      // Vibration not supported on all platforms
    }
    setIsPasswordVisible(!isPasswordVisible)
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        <TextInput
          {...textInputProps}
          style={[styles.input, inputStyle, error && styles.inputError]}
          secureTextEntry={!isPasswordVisible}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={togglePasswordVisibility}
          activeOpacity={0.7}
        >
          <Icon
            name={isPasswordVisible ? 'eye-off' : 'eye'}
            size={24}
            color={isPasswordVisible ? '#7C3AED' : '#9CA3AF'}
          />
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingRight: 50, 
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 13,
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
})