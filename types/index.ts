import { Tables } from './supabase'; 
import { HabitTemplate, UserHabitProgress } from './habits';

type Goal = Tables<'goals'>;

export type RootStackParamList = {
  Home: undefined;
  Learn: undefined;
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
  Progress: undefined;
  Journey: undefined;
  HabitCompletion: {
    habitTemplate: HabitTemplate;
    habitProgress: UserHabitProgress;
  };
}; 