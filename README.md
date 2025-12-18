# Capacitor (Android) – Vue 3 Quick Start

This project is a **Vue 3 application wrapped with Capacitor** to run as a **native Android app**.

Capacitor loads your built Vue app into a native Android WebView, allowing you to access native APIs while keeping a web-based codebase.

---

## Requirements

### Node.js

- **Node.js 20+** (recommended)
- Check version:
  ```bash
  node -v
  ```

Android Studio

Install Android Studio

Includes:

Android SDK

Platform tools

Emulator

Required for building and running Android apps

Java (JDK) for Android Builds

Gradle and the Android Gradle Plugin require a supported JDK.

✅ Recommended JDK

Temurin JDK 21 (best choice for modern Android projects)

Temurin JDK 17 (also supported and stable)

⚠️ About JBR (JetBrains Runtime)

Android Studio includes JBR

JBR may work inside Android Studio

❌ Not reliable for CLI builds (./gradlew, npx cap run android)

If you see errors like:

```
  brew install --cask temurin@21
  Or install JDK 17:
  brew install --cask temurin@17

  Verify installed JDKs
  /usr/libexec/java_home -V

  Force Gradle to use the correct JDK (recommended)
  android/gradle.properties

  //android/gradle.properties
  org.gradle.java.home=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home

  cd android
  ./gradlew -version

```

```
  1) Install Project Dependencies

    npm install
    npm run dev
    npm run build

  2) Install Capacitor ( Optional this is already have in package.json) 
      npm i @capacitor/core @capacitor/cli
      npx cap init

  3) Add Android Platform
      npx cap add androind 
      npm run build &&  npx cap sync android

  4) Open Android Studio
      npx cap open android

  5) Run on Android Device or Emulator
      Option A: Android Studio
      Select a device or emulator

      Click ▶ Run
      npx cap run android

      Common Workflow

      # Build web app
      npm run build

      # Sync web assets to Android
      npx cap sync android

      # Run on device
      npx cap run android

      Useful Commands

      # Sync web build → native

      npm run build
      npx cap sync

      # Open Android Studio
      npx cap open android

      # Run on Android
      npx cap run android

      # Verify Gradle Java version
      cd android && ./gradlew -version

```
