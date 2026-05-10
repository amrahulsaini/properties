import 'package:flutter/material.dart';

const kAccent = Color(0xFFF97316);
const kAccentLight = Color(0xFFFFF7ED);
const kAccentDark = Color(0xFFC2410C);
const kBg = Color(0xFFFFFAF5);
const kSurface = Color(0xFFFFFFFF);
const kInk = Color(0xFF1C1917);
const kMuted = Color(0xFF78716C);
const kLine = Color(0xFFE7E5E4);
const kSuccess = Color(0xFF16A34A);
const kSuccessLight = Color(0xFFDCFCE7);
const kWarning = Color(0xFFD97706);
const kWarningLight = Color(0xFFFEF3C7);
const kError = Color(0xFFDC2626);
const kErrorLight = Color(0xFFFEE2E2);

ThemeData buildTheme() => ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: kAccent,
        primary: kAccent,
        surface: kSurface,
        background: kBg,
      ),
      scaffoldBackgroundColor: kBg,
      appBarTheme: const AppBarTheme(
        backgroundColor: kBg,
        foregroundColor: kInk,
        elevation: 0,
        scrolledUnderElevation: 0,
        titleTextStyle: TextStyle(
          color: kInk, fontSize: 17, fontWeight: FontWeight.w700,
        ),
      ),
      cardTheme: CardThemeData(
        color: kSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: kLine),
        ),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: kAccent,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(vertical: 14),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
          elevation: 0,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: kBg,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: kLine, width: 1.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: kLine, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: kAccent, width: 1.5),
        ),
        labelStyle: const TextStyle(color: kMuted, fontSize: 13),
        hintStyle: const TextStyle(color: kMuted),
      ),
      drawerTheme: const DrawerThemeData(
        backgroundColor: kBg,
        width: 285,
      ),
      fontFamily: 'Roboto',
    );

BoxDecoration get kCardDecoration => BoxDecoration(
      color: kSurface,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: kLine),
      boxShadow: [
        BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2)),
      ],
    );

Color badgeBg(String value) {
  switch (value.toLowerCase()) {
    case 'active': case 'paid': case 'present': case 'sold': case 'completed': return kSuccessLight;
    case 'pending': case 'partial': case 'in_progress': case 'planned': return kWarningLight;
    case 'inactive': case 'absent': return kErrorLight;
    default: return kAccentLight;
  }
}

Color badgeFg(String value) {
  switch (value.toLowerCase()) {
    case 'active': case 'paid': case 'present': case 'sold': case 'completed': return kSuccess;
    case 'pending': case 'partial': case 'in_progress': case 'planned': return kWarning;
    case 'inactive': case 'absent': return kError;
    default: return kAccentDark;
  }
}
