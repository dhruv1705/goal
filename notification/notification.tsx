import {useState,useEffect,useRef} from 'react'

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface PushNotification {
    notification: Notifications.Notification;
    expoPushToken: Notifications.ExpoPushToken;
}

export interface PushNotificationState {
    expoPushToken?: Notifications.ExpoPushToken;
    notification?: Notifications.Notification;
}

export const usePushNotifications = (): PushNotificationState =>{
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldPlaySound:true,
            shouldSetBadge:false,
            shouldShowAlert:true,
            shouldShowBanner:true,
            shouldShowList:true,
        }),
    });

    const [expoPushToken, setExpoPushToken] = useState<Notifications.ExpoPushToken | undefined>();
    const [notification, setNotification] = useState<Notifications.Notification | undefined>();

    const notificationListener = useRef<Notifications.Subscription>(null);
    const responseListener = useRef<Notifications.Subscription>(null);

    async function registerForPushNotificationsAsync() {
        let token;

        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        console.log('Notification permissions existing status:', existingStatus); // Added log
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
            console.log('Notification permissions requested status:', status); // Added log
        }
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification! Final status:', finalStatus); // Added log
            return;
        }
        const projectId = Constants.expoConfig?.extra?.eas?.projectId; // Capture projectId
        console.log('Project ID from Constants.expoConfig:', projectId); // Added log
        try {
            console.log('Attempting to get Expo push token...'); // New log before the call
            token = await Notifications.getExpoPushTokenAsync({
                projectId: projectId,
            });
            console.log('Raw token from getExpoPushTokenAsync:', token); // Added detailed log
            console.log(token);
        } catch (error) {
            console.log('Error getting Expo push token:', error); // New error log
        }

        return token;
    }

useEffect(()=>{
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log(response);
    });

    return () => {
        Notifications.removeNotificationSubscription(notificationListener.current!);
        Notifications.removeNotificationSubscription(responseListener.current!);
    }
},[]);

return {
    expoPushToken,
    notification,
};
};