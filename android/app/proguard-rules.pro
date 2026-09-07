# ReRide / Capacitor — R8 rules for release (mapping.txt → Play Console deobfuscation)

# Readable deobfuscated stack traces (upload mapping.txt with each release)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

-keepattributes Signature, *Annotation*, InnerClasses, EnclosingMethod, Exceptions

# WebView JS bridge
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Local Capacitor plugin (Google OAuth opens in system browser)
-keep class com.reride.app.OAuthExternalBrowserPlugin { *; }

# Capacitor core + Cordova shim
-keep class com.getcapacitor.** { *; }
-keep class org.apache.cordova.** { *; }

# Community plugins (adjust if you add/remove plugins)
-keep class com.getcapacitor.community.** { *; }

# Capawesome Google Sign-In
-keep class io.capawesome.** { *; }
-dontwarn io.capawesome.**

# Aparajita Secure Storage
-keep class com.aparajita.** { *; }
-dontwarn com.aparajita.**

# Google Play / Firebase (used when google-services is applied)
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Google Sign-In / Play Services (native Google auth)
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# OkHttp / Conscrypt (common transitive warnings)
-dontwarn org.conscrypt.**
