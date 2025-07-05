import { Theme } from '@react-navigation/native';

const DarkThemes: Theme = {
    dark: true,
    colors: {
        primary: '#7C3AED',
        background: '#121212',
        card: '#1f1f1f',
        text: '#ffffff',
        border: '#272727',
        notification: '#7C3AED',
    },
      fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700',
    },
    heavy: {
      fontFamily: 'System',
      fontWeight: '900',
    },
  },
};
export default DarkThemes;