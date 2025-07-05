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
  Goals: { refresh?: number; updatedGoal?: Goal; newGoal?: Goal; };
  AddEditGoal: { goalId?: string }; 
  GoalDetail: { goal: Goal }; 
  Feedback: undefined;
  Onboarding: { onComplete: () => void };
  Talk: undefined;
}; 