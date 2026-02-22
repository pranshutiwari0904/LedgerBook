import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'ledgerbook_theme_v1';

const lightMajorPresets = {
  ivory: {
    bgMain: '#f6f2e7',
    bgSoft: '#fffdf7',
    bgElevated: '#ffffff',
    textMain: '#1f221f',
    textSoft: '#59615d',
    border: '#ded4c3',
    bgRadialA: '#ffe6c7',
    bgRadialB: '#d9efe3',
    bgLinearA: '#f5efe1',
    bgLinearB: '#f9f7f0',
    shadow: 'rgba(17, 23, 19, 0.1)'
  },
  sand: {
    bgMain: '#f0e8dc',
    bgSoft: '#fff9f1',
    bgElevated: '#fffdf9',
    textMain: '#2c251e',
    textSoft: '#6b5d51',
    border: '#dbcbb7',
    bgRadialA: '#ffd8b3',
    bgRadialB: '#f0d7bf',
    bgLinearA: '#f0e4d3',
    bgLinearB: '#f9f0e4',
    shadow: 'rgba(36, 24, 14, 0.12)'
  },
  sky: {
    bgMain: '#edf3f8',
    bgSoft: '#f8fcff',
    bgElevated: '#ffffff',
    textMain: '#1f2a36',
    textSoft: '#59708b',
    border: '#cedbe8',
    bgRadialA: '#d3e9ff',
    bgRadialB: '#d9f3eb',
    bgLinearA: '#e9f0f7',
    bgLinearB: '#f5fbff',
    shadow: 'rgba(22, 44, 66, 0.12)'
  },
  mint: {
    bgMain: '#ebf5ef',
    bgSoft: '#f8fdf9',
    bgElevated: '#ffffff',
    textMain: '#1d2b24',
    textSoft: '#4f6d5f',
    border: '#cfe0d7',
    bgRadialA: '#d8f3d9',
    bgRadialB: '#ccefe8',
    bgLinearA: '#e8f3ec',
    bgLinearB: '#f4faf6',
    shadow: 'rgba(20, 56, 39, 0.12)'
  },
  rose: {
    bgMain: '#f7edf0',
    bgSoft: '#fff8fa',
    bgElevated: '#fffefe',
    textMain: '#302227',
    textSoft: '#72515b',
    border: '#e3cfd6',
    bgRadialA: '#ffd7dd',
    bgRadialB: '#efe1ff',
    bgLinearA: '#f5e7ec',
    bgLinearB: '#fcf6f8',
    shadow: 'rgba(56, 31, 41, 0.13)'
  }
};

const darkMajorPresets = {
  gray: {
    bgMain: '#171a1f',
    bgSoft: '#20242a',
    bgElevated: '#272c33',
    textMain: '#f1f4f6',
    textSoft: '#aab5bf',
    border: '#343a43',
    bgRadialA: '#2e3340',
    bgRadialB: '#222935',
    bgLinearA: '#171c22',
    bgLinearB: '#101418',
    shadow: 'rgba(0, 0, 0, 0.4)'
  },
  black: {
    bgMain: '#0f1115',
    bgSoft: '#171a20',
    bgElevated: '#1d2129',
    textMain: '#f3f5f7',
    textSoft: '#9ea7b3',
    border: '#2b313b',
    bgRadialA: '#232833',
    bgRadialB: '#141922',
    bgLinearA: '#11151b',
    bgLinearB: '#080a0e',
    shadow: 'rgba(0, 0, 0, 0.5)'
  },
  navy: {
    bgMain: '#0f1726',
    bgSoft: '#182236',
    bgElevated: '#1f2c44',
    textMain: '#edf3ff',
    textSoft: '#9fb2d0',
    border: '#2b3d5c',
    bgRadialA: '#233753',
    bgRadialB: '#162742',
    bgLinearA: '#101c2e',
    bgLinearB: '#0a1120',
    shadow: 'rgba(0, 0, 0, 0.45)'
  },
  midnight: {
    bgMain: '#0b1220',
    bgSoft: '#121b2e',
    bgElevated: '#1a2741',
    textMain: '#edf3ff',
    textSoft: '#99abd1',
    border: '#2a3b5f',
    bgRadialA: '#1d2f4e',
    bgRadialB: '#16253d',
    bgLinearA: '#0f1a2e',
    bgLinearB: '#090f1f',
    shadow: 'rgba(0, 0, 0, 0.5)'
  },
  maroon: {
    bgMain: '#1a1015',
    bgSoft: '#25161d',
    bgElevated: '#2f1b24',
    textMain: '#f8edf0',
    textSoft: '#d4aeb8',
    border: '#4a2d38',
    bgRadialA: '#3d1d2a',
    bgRadialB: '#2b1c33',
    bgLinearA: '#1c1118',
    bgLinearB: '#130c11',
    shadow: 'rgba(0, 0, 0, 0.46)'
  },
  brown: {
    bgMain: '#1b1511',
    bgSoft: '#261d18',
    bgElevated: '#33261f',
    textMain: '#f7f0ea',
    textSoft: '#c8af9d',
    border: '#4e3b31',
    bgRadialA: '#3b2a22',
    bgRadialB: '#35261f',
    bgLinearA: '#201712',
    bgLinearB: '#16100d',
    shadow: 'rgba(0, 0, 0, 0.45)'
  }
};

const undertones = {
  amber: {
    accent: '#d87031',
    accentSoft: '#f4dbc9',
    logo1: '#ff9f43',
    logo2: '#ff6b6b',
    logo3: '#ffe66d'
  },
  emerald: {
    accent: '#2fa56e',
    accentSoft: '#caefdc',
    logo1: '#4ecdc4',
    logo2: '#2ecc71',
    logo3: '#b8f2e6'
  },
  sapphire: {
    accent: '#3f7cd8',
    accentSoft: '#d3e2fb',
    logo1: '#5dade2',
    logo2: '#4d7cff',
    logo3: '#89c2ff'
  },
  ruby: {
    accent: '#c44a67',
    accentSoft: '#f3d4dc',
    logo1: '#ff6b81',
    logo2: '#b33771',
    logo3: '#ffd6e0'
  },
  copper: {
    accent: '#ad6b3f',
    accentSoft: '#f1decf',
    logo1: '#f4a261',
    logo2: '#bc6c25',
    logo3: '#ffd6a5'
  }
};

const statusPaletteByMode = {
  light: {
    ok: '#2f7d58',
    warn: '#b44343',
    pending: '#8c6d1f'
  },
  dark: {
    ok: '#6fd49e',
    warn: '#f27b7b',
    pending: '#d3b15e'
  }
};

const defaultState = {
  mode: 'light',
  majorTone: 'ivory',
  undertone: 'amber'
};

const getMajorPresets = (mode) => (mode === 'dark' ? darkMajorPresets : lightMajorPresets);

const applyThemeToDocument = ({ mode, majorTone, undertone }) => {
  const majorPresets = getMajorPresets(mode);
  const major = majorPresets[majorTone] || majorPresets[Object.keys(majorPresets)[0]];
  const tone = undertones[undertone] || undertones.amber;
  const status = statusPaletteByMode[mode];

  const variables = {
    '--bg-main': major.bgMain,
    '--bg-soft': major.bgSoft,
    '--bg-elevated': major.bgElevated,
    '--text-main': major.textMain,
    '--text-soft': major.textSoft,
    '--border': major.border,
    '--accent': tone.accent,
    '--accent-soft': tone.accentSoft,
    '--ok': status.ok,
    '--warn': status.warn,
    '--pending': status.pending,
    '--bg-radial-a': major.bgRadialA,
    '--bg-radial-b': major.bgRadialB,
    '--bg-linear-a': major.bgLinearA,
    '--bg-linear-b': major.bgLinearB,
    '--panel-shadow': major.shadow,
    '--logo-grad-1': tone.logo1,
    '--logo-grad-2': tone.logo2,
    '--logo-grad-3': tone.logo3
  };

  const root = document.documentElement;
  root.setAttribute('data-theme-mode', mode);

  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultState;
    }

    try {
      const parsed = JSON.parse(raw);
      return {
        ...defaultState,
        ...parsed
      };
    } catch (_error) {
      return defaultState;
    }
  });

  useEffect(() => {
    applyThemeToDocument(theme);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  }, [theme]);

  const setMode = (mode) => {
    setTheme((prev) => {
      const majorPresets = getMajorPresets(mode);
      const majorTone = majorPresets[prev.majorTone] ? prev.majorTone : Object.keys(majorPresets)[0];

      return {
        ...prev,
        mode,
        majorTone
      };
    });
  };

  const setMajorTone = (majorTone) => {
    setTheme((prev) => ({
      ...prev,
      majorTone
    }));
  };

  const setUndertone = (undertone) => {
    setTheme((prev) => ({
      ...prev,
      undertone
    }));
  };

  const resetTheme = () => {
    setTheme(defaultState);
  };

  const value = useMemo(
    () => ({
      theme,
      setMode,
      setMajorTone,
      setUndertone,
      resetTheme,
      options: {
        modes: ['light', 'dark'],
        majorByMode: {
          light: Object.keys(lightMajorPresets),
          dark: Object.keys(darkMajorPresets)
        },
        undertones: Object.keys(undertones)
      }
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return context;
};
