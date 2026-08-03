# iMobile SDK 不混淆
-keep class com.supermap.** { *; }
-keep class com.supermap.data.** { *; }
-keep class com.supermap.mapping.** { *; }
-keep class com.supermap.services.** { *; }
-keep class com.supermap.analyst.** { *; }

# Retrofit / Gson 不混淆 DTO
-keep class com.at.mobile.data.remote.dto.** { *; }
-keepattributes Signature
-keepattributes *Annotation*
