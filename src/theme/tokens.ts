export const colors = {
  lingua: {
    purple: "#6c4ef5",
    deepPurple: "#5b3bf6",
    blue: "#4d88ff",
    green: "#21c168",
  },
  semantic: {
    success: "#21c168",
    warning: "#ffcb00",
    streak: "#ff8a00",
    error: "#ff4d4f",
    info: "#4d88ff",
  },
  neutral: {
    textPrimary: "#001328",
    textSecondary: "#6b7280",
    border: "#e5e7eb",
    surface: "#f6f7fb",
    background: "#ffffff",
  },
} as const;

export const typography = {
  fonts: {
    regular: "Poppins-Regular",
    medium: "Poppins-Medium",
    semibold: "Poppins-SemiBold",
    bold: "Poppins-Bold",
  },
  sizes: {
    h1: 32,
    h2: 24,
    h3: 20,
    h4: 16,
    bodyLg: 16,
    bodyMd: 14,
    bodySm: 13,
    caption: 11,
  },
  lineHeights: {
    h1: 1.2,
    h2: 1.3,
    h3: 1.3,
    h4: 1.4,
    bodyLg: 1.6,
    bodyMd: 1.6,
    bodySm: 1.6,
    caption: 1.4,
  },
  // Pre-computed pixel line heights for use in StyleSheet (size × ratio, rounded).
  // React Native's lineHeight prop requires an absolute pixel value, not a ratio.
  lineHeightsPx: {
    h1: 38,      // 32 × 1.2
    h2: 31,      // 24 × 1.3
    h3: 26,      // 20 × 1.3
    h4: 22,      // 16 × 1.4
    bodyLg: 26,  // 16 × 1.6
    bodyMd: 22,  // 14 × 1.6
    bodySm: 21,  // 13 × 1.6
    caption: 15, // 11 × 1.4
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
