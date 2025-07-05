import { Tables } from './supabase'; 
type Goal = Tables<'goals'>;

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  SignUp: undefined;
  OtpVerification: { phoneNumber: string };
  Categories: undefined;
  Schedule: undefined;
  AddEdit: undefined; 
  Profile: undefined;
  Goals: undefined;
  AddEditGoal: { goalId?: string }; 
  GoalDetail: { goal: Goal }; 
  Feedback: undefined;
  Onboarding: { onComplete: () => void };
  Demo: undefined;
  Choice: undefined;
  Welcome: undefined;
  Talk: undefined;
}; 