import { Theme } from '@react-navigation/native';

const LightTheme: Theme = {
    dark: false,
    colors: {
        primary: '#7C3AED',
        background: '#fff',
        card: '#fff',
        text: '#000',
        border: '#ccc',
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
export default LightTheme;