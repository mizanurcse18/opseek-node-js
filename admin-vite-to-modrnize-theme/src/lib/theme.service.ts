export interface ThemeColors {
  primary50: string;
  primary100: string;
  primary500: string;
  primary600: string;
  primary700: string;
  
  headerBg: string;
  sidebarBg: string;
  contentBg: string;
  footerBg: string;
  textMain: string;
  textMuted: string;
  cardBg: string;
  borderColor: string;

  sidebarActiveBg: string;
  sidebarActiveText: string;
  sidebarHoverBg: string;
  sidebarTextMain: string;
  sidebarTextMuted: string;
  sidebarHoverText: string;
}

export interface ThemeScheme {
  id: string;
  name: string;
  colors: ThemeColors;
}

const DEFAULT_LIGHT_LAYOUT = {
  headerBg: '#ffffff',
  sidebarBg: '#ffffff',
  contentBg: '#f3f4f6',
  footerBg: '#ffffff',
  textMain: '#111827',
  textMuted: '#6b7280',
  cardBg: '#ffffff',
  borderColor: '#e5e7eb',
  sidebarActiveBg: '#ede9fe', // primary-100
  sidebarActiveText: '#3b2768', // primary-600
  sidebarHoverBg: '#f5f3ff', // primary-50
  sidebarTextMain: '#111827',
  sidebarTextMuted: '#6b7280',
  sidebarHoverText: '#3b2768', // primary-600
};

export const THEME_SCHEMES: ThemeScheme[] = [
  {
    id: 'default',
    name: 'Default',
    colors: {
      primary50: '#f5f3ff',
      primary100: '#ede9fe',
      primary500: '#7b4fb6',
      primary600: '#3b2768',
      primary700: '#2d1b4e',
      ...DEFAULT_LIGHT_LAYOUT,
    }
  },
  {
    id: 'defaultDark',
    name: 'Midnight Dark',
    colors: {
      primary50: '#1e1b4b', // Indigo-950
      primary100: '#312e81', // Indigo-900
      primary500: '#818cf8', // Indigo-400
      primary600: '#6366f1', // Indigo-500
      primary700: '#4f46e5', // Indigo-600
      headerBg: '#020617', // Slate-950
      headerBg: '#000000',
      sidebarBg: '#000000',
      contentBg: '#000000',
      footerBg: '#000000',
      textMain: '#ffffff',
      textMuted: '#94a3b8',
      cardBg: '#0D0D12', 
      borderColor: '#1C1C21', 
      sidebarActiveBg: 'rgba(99, 102, 241, 0.1)', // Indigo tint
      sidebarActiveText: '#818cf8',
      sidebarHoverBg: 'rgba(255, 255, 255, 0.03)',
      sidebarTextMain: '#ffffff',
      sidebarTextMuted: '#94a3b8',
      sidebarHoverText: '#ffffff',
    }
  },
  {
    id: 'legacy',
    name: 'Legacy (Material Green)',
    colors: {
      primary50: '#E8F5E9',
      primary100: '#C8E6C9',
      primary500: '#4CAF50',
      primary600: '#43A047',
      primary700: '#388E3C',
      ...DEFAULT_LIGHT_LAYOUT,
      headerBg: '#388E3C',
      sidebarBg: '#ffffff',
      textMain: '#22292F',
      sidebarActiveBg: '#C8E6C9',
      sidebarActiveText: '#2E7D32',
      sidebarHoverBg: '#E8F5E9',
      sidebarHoverText: '#2E7D32',
    }
  },
  {
    id: 'light1',
    name: 'Light 1 (Teal)',
    colors: {
      primary50: '#E0F2F1',
      primary100: '#B2DFDB',
      primary500: '#009688',
      primary600: '#00897B',
      primary700: '#00796B',
      ...DEFAULT_LIGHT_LAYOUT,
      headerBg: '#00897B',
      sidebarBg: '#00897B', 
      contentBg: '#F0FDFA',
      sidebarActiveBg: 'rgba(255, 255, 255, 0.15)',
      sidebarActiveText: '#ffffff',
      sidebarHoverBg: 'rgba(255, 255, 255, 0.08)',
      sidebarTextMain: '#ffffff',
      sidebarTextMuted: 'rgba(255, 255, 255, 0.7)',
      sidebarHoverText: '#ffffff',
    }
  },
  {
    id: 'light2',
    name: 'Light 2 (Amber)',
    colors: {
      primary50: '#FFF8E1',
      primary100: '#FFECB3',
      primary500: '#FFC107',
      primary600: '#FFB300',
      primary700: '#FFA000',
      ...DEFAULT_LIGHT_LAYOUT,
      headerBg: '#FFB300',
      sidebarBg: '#FFB300',
      contentBg: '#FFFBEB',
      sidebarActiveBg: 'rgba(255, 255, 255, 0.2)',
      sidebarActiveText: '#ffffff',
      sidebarHoverBg: 'rgba(255, 255, 255, 0.1)',
      sidebarTextMain: '#ffffff',
      sidebarTextMuted: 'rgba(255, 255, 255, 0.8)',
      sidebarHoverText: '#ffffff',
    }
  },
  {
    id: 'light3',
    name: 'Light 3 (Red)',
    colors: {
      primary50: '#FFEBEE',
      primary100: '#FFCDD2',
      primary500: '#F44336',
      primary600: '#E53935',
      primary700: '#D32F2F',
      ...DEFAULT_LIGHT_LAYOUT,
      headerBg: '#E53935',
      sidebarBg: '#E53935',
      contentBg: '#FEF2F2',
      sidebarActiveBg: 'rgba(255, 255, 255, 0.15)',
      sidebarActiveText: '#ffffff',
      sidebarHoverBg: 'rgba(255, 255, 255, 0.08)',
      sidebarTextMain: '#ffffff',
      sidebarTextMuted: 'rgba(255, 255, 255, 0.7)',
      sidebarHoverText: '#ffffff',
    }
  },
  {
    id: 'light4',
    name: 'Light 4 (Purple)',
    colors: {
      primary50: '#F3E5F5',
      primary100: '#E1BEE7',
      primary500: '#9C27B0',
      primary600: '#8E24AA',
      primary700: '#7B1FA2',
      ...DEFAULT_LIGHT_LAYOUT,
      headerBg: '#8E24AA',
      sidebarBg: '#8E24AA',
      contentBg: '#FAF5FF',
      sidebarActiveBg: 'rgba(255, 255, 255, 0.15)',
      sidebarActiveText: '#ffffff',
      sidebarHoverBg: 'rgba(255, 255, 255, 0.08)',
      sidebarTextMain: '#ffffff',
      sidebarTextMuted: 'rgba(255, 255, 255, 0.7)',
      sidebarHoverText: '#ffffff',
    }
  },
  {
    id: 'light5',
    name: 'Light 5 (Blue)',
    colors: {
      primary50: '#E3F2FD',
      primary100: '#BBDEFB',
      primary500: '#2196F3',
      primary600: '#1E88E5',
      primary700: '#1976D2',
      ...DEFAULT_LIGHT_LAYOUT,
      headerBg: '#1E88E5',
      sidebarBg: '#1E88E5',
      contentBg: '#EFF6FF',
      sidebarActiveBg: 'rgba(255, 255, 255, 0.15)',
      sidebarActiveText: '#ffffff',
      sidebarHoverBg: 'rgba(255, 255, 255, 0.08)',
      sidebarTextMain: '#ffffff',
      sidebarTextMuted: 'rgba(255, 255, 255, 0.7)',
      sidebarHoverText: '#ffffff',
    }
  },
  {
    id: 'light6',
    name: 'Light 6 (Light Green)',
    colors: {
      primary50: '#F1F8E9',
      primary100: '#DCEDC8',
      primary500: '#8BC34A',
      primary600: '#7CB342',
      primary700: '#689F38',
      ...DEFAULT_LIGHT_LAYOUT,
      headerBg: '#7CB342',
      sidebarBg: '#7CB342',
      contentBg: '#F7FEE7',
      sidebarActiveBg: 'rgba(255, 255, 255, 0.15)',
      sidebarActiveText: '#ffffff',
      sidebarHoverBg: 'rgba(255, 255, 255, 0.08)',
      sidebarTextMain: '#ffffff',
      sidebarTextMuted: 'rgba(255, 255, 255, 0.7)',
      sidebarHoverText: '#ffffff',
    }
  },
  {
    id: 'light7',
    name: 'Light 7 (Blue Gray)',
    colors: {
      primary50: '#ECEFF1',
      primary100: '#CFD8DC',
      primary500: '#607D8B',
      primary600: '#546E7A',
      primary700: '#455A64',
      ...DEFAULT_LIGHT_LAYOUT,
      headerBg: '#546E7A',
      sidebarBg: '#546E7A',
      contentBg: '#ECEFF1',
      sidebarActiveBg: 'rgba(255, 255, 255, 0.15)',
      sidebarActiveText: '#ffffff',
      sidebarHoverBg: 'rgba(255, 255, 255, 0.08)',
      sidebarTextMain: '#ffffff',
      sidebarTextMuted: 'rgba(255, 255, 255, 0.7)',
      sidebarHoverText: '#ffffff',
    }
  },
  {
    id: 'brown',
    name: 'Brown (Material)',
    colors: {
      primary50: '#EFEBE9',
      primary100: '#D7CCC8',
      primary500: '#795548',
      primary600: '#6D4C41',
      primary700: '#5D4037',
      ...DEFAULT_LIGHT_LAYOUT,
      headerBg: '#6D4C41',
      sidebarBg: '#6D4C41',
      contentBg: '#EFEBE9',
      sidebarActiveBg: 'rgba(255, 255, 255, 0.15)',
      sidebarActiveText: '#ffffff',
      sidebarHoverBg: 'rgba(255, 255, 255, 0.08)',
      sidebarTextMain: '#ffffff',
      sidebarTextMuted: 'rgba(255, 255, 255, 0.7)',
      sidebarHoverText: '#ffffff',
    }
  },
  {
    id: 'pink',
    name: 'Pink (Material)',
    colors: {
      primary50: '#FCE4EC',
      primary100: '#F8BBD0',
      primary500: '#E91E63',
      primary600: '#D81B60',
      primary700: '#C2185B',
      ...DEFAULT_LIGHT_LAYOUT,
      headerBg: '#D81B60',
      sidebarBg: '#D81B60',
      contentBg: '#FCE4EC',
      sidebarActiveBg: 'rgba(255, 255, 255, 0.15)',
      sidebarActiveText: '#ffffff',
      sidebarHoverBg: 'rgba(255, 255, 255, 0.08)',
      sidebarTextMain: '#ffffff',
      sidebarTextMuted: 'rgba(255, 255, 255, 0.7)',
      sidebarHoverText: '#ffffff',
    }
  },
  {
    id: 'lime',
    name: 'Lime (Material)',
    colors: {
      primary50: '#F9FBE7',
      primary100: '#F0F4C3',
      primary500: '#CDDC39',
      primary600: '#C0CA33',
      primary700: '#AFB42B',
      ...DEFAULT_LIGHT_LAYOUT,
      headerBg: '#C0CA33',
      sidebarBg: '#C0CA33',
      contentBg: '#F9FBE7',
      sidebarActiveBg: 'rgba(255, 255, 255, 0.15)',
      sidebarActiveText: '#ffffff',
      sidebarHoverBg: 'rgba(255, 255, 255, 0.08)',
      sidebarTextMain: '#ffffff',
      sidebarTextMuted: 'rgba(255, 255, 255, 0.7)',
      sidebarHoverText: '#ffffff',
    }
  },
  {
    id: 'deepOrange',
    name: 'Deep Orange (Material)',
    colors: {
      primary50: '#FBE9E7',
      primary100: '#FFCCBC',
      primary500: '#FF5722',
      primary600: '#F4511E',
      primary700: '#E64A19',
      ...DEFAULT_LIGHT_LAYOUT,
      headerBg: '#F4511E',
      sidebarBg: '#F4511E',
      contentBg: '#FBE9E7',
      sidebarActiveBg: 'rgba(255, 255, 255, 0.15)',
      sidebarActiveText: '#ffffff',
      sidebarHoverBg: 'rgba(255, 255, 255, 0.08)',
      sidebarTextMain: '#ffffff',
      sidebarTextMuted: 'rgba(255, 255, 255, 0.7)',
    }
  },
  {
    id: 'white',
    name: 'Pure White (Minimalist)',
    colors: {
      primary50: '#f8fafc',
      primary100: '#f1f5f9',
      primary500: '#64748b',
      primary600: '#475569',
      primary700: '#334155',
      ...DEFAULT_LIGHT_LAYOUT,
      headerBg: '#ffffff',
      sidebarBg: '#ffffff',
      contentBg: '#ffffff',
      sidebarActiveBg: '#f1f5f9',
      sidebarActiveText: '#1e293b',
      sidebarHoverBg: '#f8fafc',
      sidebarTextMain: '#1e293b',
      sidebarTextMuted: '#64748b',
      sidebarHoverText: '#0f172a',
    }
  }
];

export const themeService = {
  applyTheme: (schemeId: string) => {
    const scheme = THEME_SCHEMES.find(s => s.id === schemeId) || THEME_SCHEMES[0];
    const root = document.documentElement;
    
    // Primary colors
    root.style.setProperty('--primary-50', scheme.colors.primary50);
    root.style.setProperty('--primary-100', scheme.colors.primary100);
    root.style.setProperty('--primary-500', scheme.colors.primary500);
    root.style.setProperty('--primary-600', scheme.colors.primary600);
    root.style.setProperty('--primary-700', scheme.colors.primary700);
    
    // Layout colors
    root.style.setProperty('--header-bg', scheme.colors.headerBg);
    root.style.setProperty('--sidebar-bg', scheme.colors.sidebarBg);
    root.style.setProperty('--content-bg', scheme.colors.contentBg);
    root.style.setProperty('--footer-bg', scheme.colors.footerBg);
    root.style.setProperty('--text-main', scheme.colors.textMain);
    root.style.setProperty('--text-muted', scheme.colors.textMuted);
    root.style.setProperty('--card-bg', scheme.colors.cardBg);
    root.style.setProperty('--border-color', scheme.colors.borderColor);

    // Sidebar Specific
    root.style.setProperty('--sidebar-active-bg', scheme.colors.sidebarActiveBg);
    root.style.setProperty('--sidebar-active-text', scheme.colors.sidebarActiveText);
    root.style.setProperty('--sidebar-hover-bg', scheme.colors.sidebarHoverBg);
    root.style.setProperty('--sidebar-text-main', scheme.colors.sidebarTextMain);
    root.style.setProperty('--sidebar-text-muted', scheme.colors.sidebarTextMuted);
    root.style.setProperty('--sidebar-hover-text', scheme.colors.sidebarHoverText);

    // Dynamic Header Icon Colors
    const isHeaderWhite = scheme.colors.headerBg.toLowerCase() === '#ffffff';
    root.style.setProperty('--header-icon-color', isHeaderWhite ? 'var(--primary-600)' : 'rgba(255, 255, 255, 0.9)');
    root.style.setProperty('--header-icon-hover-bg', isHeaderWhite ? 'var(--primary-50)' : 'rgba(255, 255, 255, 0.1)');
    root.style.setProperty('--header-icon-active-bg', isHeaderWhite ? 'var(--primary-100)' : 'rgba(255, 255, 255, 0.2)');
    
    // Toggle dark class based on theme
    if (schemeId.toLowerCase().includes('dark')) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    localStorage.setItem('admin_theme_id', schemeId);
    
    // Placeholder for backend API sync
    // themeService.syncWithBackend(schemeId);
  },

  applyFontSize: (size: number) => {
    document.documentElement.style.zoom = `${size}%`;
    localStorage.setItem('admin_font_size', size.toString());
  },
  
  loadTheme: () => {
    const savedId = localStorage.getItem('admin_theme_id') || 'default';
    themeService.applyTheme(savedId);
    
    // Load and apply saved font size
    const savedFontSize = localStorage.getItem('admin_font_size') || '100';
    themeService.applyFontSize(parseInt(savedFontSize));
    
    return savedId;
  },
  
  syncWithBackend: async (schemeId: string) => {
    // This will be implemented once the API is available
    console.log('Syncing theme with backend:', schemeId);
    // await apiService.post('/user/settings/theme', { themeId: schemeId });
  }
};
