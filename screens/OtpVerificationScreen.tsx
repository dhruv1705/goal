import React, { useState, useRef } from 'react'
import { View, Text, TextInput, Button, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { StackNavigationProp, StackScreenProps } from '@react-navigation/stack'; 
import { RootStackParamList } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface OtpVerificationScreenProps extends StackScreenProps<RootStackParamList, 'OtpVerification'> {}

const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({ route, navigation }) => {
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const { signIn } = useAuth();

  const { phoneNumber } = route.params; 

  const handleOtpChange = (text: string, index: number) => {
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = text;
    setOtpDigits(newOtpDigits);

    if (text.length > 0 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (text.length === 0 && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpVerification = async () => {
    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      Alert.alert('Mandatory', 'Please enter the complete 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`https://ebdvpahpuefimdcfuvru.supabase.co/functions/v1/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZHZwYWhwdWVmaW1kY2Z1dnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjM5NTMsImV4cCI6MjA2Njc5OTk1M30.8V52GocdThP5StIJ5ImZL3PwXPD8QWkJsj465QA2vI4'}`,
        },
        body: JSON.stringify({ phoneNumber: phoneNumber, otpCode: otp }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', data.message || 'Phone number verified!', [
          {
            text: 'OK',
            onPress: async () => {
              try {

                const tempEmail = `${phoneNumber.replace(/\D/g, '')}@temp.com`;
                const tempPassword = 'TempPass123!'; 
                
                await supabase.auth.signUp({
                  email: tempEmail,
                  password: tempPassword,
                  options: {
                    data: {
                      phone_number: phoneNumber,
                      auth_method: 'phone'
                    }
                  }
                });

                await supabase.auth.signInWithPassword({
                  email: tempEmail,
                  password: tempPassword,
                });

              } catch (authError) {
                console.error('Error creating user session:', authError);
                try {
                  const tempEmail = `${phoneNumber.replace(/\D/g, '')}@temp.com`;
                  const tempPassword = 'TempPass123!';
                  await supabase.auth.signInWithPassword({
                    email: tempEmail,
                    password: tempPassword,
                  });
                } catch (signInError) {
                  console.error('Error signing in existing user:', signInError);
                  // Fallback: navigate to signup screen to complete registration
                  navigation.navigate('SignUp');
                }
              }
            }
          }
        ]);
      } else {
        console.error('Error verifying OTP:', data);
        Alert.alert('Verification Failed', data.error || 'Invalid OTP.');
      }
    } catch (error: any) {
      console.error('Network error during OTP verification:', error);
      Alert.alert('Error', 'An unexpected error occurred during OTP verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`https://ebdvpahpuefimdcfuvru.supabase.co/functions/v1/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZHZwYWhwdWVmaW1kY2Z1dnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjM5NTMsImV4cCI6MjA2Njc5OTk1M30.8V52GocdThP5StIJ5ImZL3PwXPD8QWkJsj465QA2vI4'}`,
        },
        body: JSON.stringify({ phoneNumber: phoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Resend Success', 'New OTP sent to your phone.');
      } else {
        console.error('Error resending OTP:', data);
        Alert.alert('Resend Failed', data.error || 'Failed to resend OTP.');
      }
    } catch (error: any) {
      console.error('Network error resending OTP:', error);
      Alert.alert('Error', 'An unexpected error occurred while resending OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Verify Phone</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to {phoneNumber}</Text>

        <View style={styles.otpContainer}>
          {otpDigits.map((digit, index) => (
            <TextInput
              key={index}
              style={styles.otpInput}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              keyboardType="number-pad"
              maxLength={1}
              ref={(ref: TextInput | null) => { inputRefs.current[index] = ref; }} 
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && digit === '' && index > 0) {
                  inputRefs.current[index - 1]?.focus();
                }
              }}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleOtpVerification}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendButton} onPress={handleResendOtp} disabled={loading}>
          <Text style={styles.resendButtonText}>Resend Code</Text>
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  form: {
    padding: 20,
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 45,
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  button: {
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    marginTop: 10,
    padding: 10,
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default OtpVerificationScreen;