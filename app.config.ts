import { ConfigContext, ExpoConfig } from "@expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return "com.kakebe.shop.dev";
  }
  if (IS_PREVIEW) {
    return "com.kakebe.shop.preview";
  }
  return "com.kakebe.shop";
};

const getAppName = () => {
  if (IS_DEV) {
    return "KakebeShop Dev";
  }
  if (IS_PREVIEW) {
    return "KakebeShop prev";
  }

  return "KakebeShop";
};

export default ({config}: ConfigContext): ExpoConfig => ({
    ...config,
    name:  getAppName(),
    slug: "KakebeShop",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "kakebeshop",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      "supportsTablet": true,
      bundleIdentifier: getUniqueIdentifier(),
      usesAppleSignIn: true,
      icon: {
        dark: "./assets/icons/ios-dark.png",
        light: "./assets/icons/ios-light.png",
        tinted: "./assets/icons/ios-tinted.png",
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        "NSLocationWhenInUseUsageDescription": "We need your location to help you set delivery addresses.",
        "NSLocationAlwaysUsageDescription": "We need your location to help you set delivery addresses."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icons/adaptive-icon.png",
        monochromeImage: "./assets/icons/adaptive-icon.png",
        backgroundColor: "#E60549"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: getUniqueIdentifier(),
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location to set delivery addresses."
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera",
          "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone",
          "recordAudioAndroid": true
        },
        
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "The app accesses your photos to let you share them with your friends."
        }
      ],
      "expo-router",
      "expo-apple-authentication",
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme:
            "com.googleusercontent.apps.1031020224121-trmppfnusv7kp4690idkku75jbh0os1h",
        },
      ],
      [
        "expo-notifications",
       {
          icon: "./assets/icons/notification_logo_black.png",
          color: "#E60549",
          defaultChannel: "default",
          enableBackgroundRemoteNotifications: true
        }
      ],
      [
        "expo-splash-screen",
        {
         image:"./assets/icons/splash-icon-dark.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            image: "./assets/icons/splash-icon-light.png",
            backgroundColor: "#E60549",
          }
        }
      ],
      [
        "expo-secure-store",
        {
          configureAndroidBackup: true,
          faceIDPermission:
            "Allow $(PRODUCT_NAME) to access your Face ID biometric data.",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      router: {},
      eas: {
        "projectId": "9ad7b9b6-b609-47ac-a133-a48b0a5de66a"
      }
    },
    owner: "pkasemer"
});
