import { create } from 'zustand';

export type ViewType =
  | 'login'
  | 'inicio'
  | 'panel-control'
  | 'servicio-tecnico'
  | 'cellnex'
  | 'insyte'
  | 'centeno'
  | 'ontower'
  | 'retevision'
  | 'axion'
  | 'gamesystem'
  | 'preventivos'
  | 'visor-preventivos'
  | 'visor-tareas'
  | 'tareas'
  | 'tareas-blacklist'
  | 'datos-centros'
  | 'mapa'
  | 'mapa-tareas'
  | 'manuales'
  | 'calendario'
  | 'dashboard-cellnex'
  | 'usuarios'
  | 'editor'
  | 'form-editor'
  | 'centros-editor'
  | 'temas';

export interface Employee {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
}

// Preventivo form - uses a dynamic key-value store for all 130+ fields
export interface PreventivoFormData {
  // Metadata fields
  tecnicoId: string;
  tecnicoName: string;
  fecha: string;
  centroId: string;  // selected centro codigo
  estado: string;    // 'borrador' | 'pendiente' | 'enviado'

  // All dynamic form fields stored as key-value pairs
  fields: Record<string, string>;

  // GPS coordinates
  latitud: number | null;
  longitud: number | null;

  // Photos per section
  fotos: Record<string, string[]>;  // section key -> array of base64 photos

  // Additional photos
  fotosAdicionales: { id: string; fotoBase64: string; descripcion: string }[];
}

const initialPreventivoForm: PreventivoFormData = {
  tecnicoId: '',
  tecnicoName: '',
  fecha: '',
  centroId: '',
  estado: 'borrador',
  fields: {},
  latitud: null,
  longitud: null,
  fotos: {},
  fotosAdicionales: [],
};

export type ThemeName = 'oceano' | 'volcan' | 'bosque' | 'aurora' | 'carbon';
export type FontSizeLevel = 'normal' | 'large' | 'xlarge';

interface AppState {
  // Auth
  isLoggedIn: boolean;
  currentUser: Employee | null;
  rememberMe: boolean;

  // Navigation
  currentView: ViewType;
  navigationHistory: ViewType[];

  // Preventivo form
  preventivoForm: PreventivoFormData;
  preventivoStep: number;

  // UI state
  isLoading: boolean;
  sidebarOpen: boolean;
  currentTheme: ThemeName;
  darkMode: boolean;
  fontSizeLevel: FontSizeLevel;

  // Actions
  login: (user: Employee) => void;
  logout: () => void;
  setRememberMe: (value: boolean) => void;
  setCurrentView: (view: ViewType) => void;
  goBack: () => void;
  setPreventivoForm: (data: Partial<PreventivoFormData>) => void;
  setPreventivoField: (key: string, value: string) => void;
  setPreventivoStep: (step: number) => void;
  resetPreventivoForm: () => void;
  setIsLoading: (loading: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: ThemeName) => void;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
  setFontSizeLevel: (level: FontSizeLevel) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  addFotoAdicional: (foto: { id: string; fotoBase64: string; descripcion: string }) => void;
  removeFotoAdicional: (id: string) => void;
  addSectionFoto: (sectionKey: string, fotoBase64: string) => void;
  removeSectionFoto: (sectionKey: string, index: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  isLoggedIn: false,
  currentUser: null,
  rememberMe: false,

  // Navigation
  currentView: 'login',
  navigationHistory: [],

  // Preventivo form
  preventivoForm: initialPreventivoForm,
  preventivoStep: 1,

  // UI state
  isLoading: false,
  sidebarOpen: false,
  currentTheme: (typeof window !== 'undefined' && localStorage.getItem('app-theme') as ThemeName) || 'oceano',
  darkMode: (typeof window !== 'undefined' && localStorage.getItem('app-dark-mode') === 'true') || false,
  fontSizeLevel: (typeof window !== 'undefined' && localStorage.getItem('app-font-size') as FontSizeLevel) || 'normal',

  // Actions
  login: (user) => set({ isLoggedIn: true, currentUser: user, currentView: 'inicio', navigationHistory: [] }),
  logout: () => set({ isLoggedIn: false, currentUser: null, currentView: 'login', navigationHistory: [], preventivoForm: initialPreventivoForm, preventivoStep: 1 }),
  setRememberMe: (value) => set({ rememberMe: value }),
  setCurrentView: (view) => set((state) => ({
    currentView: view,
    navigationHistory: [...state.navigationHistory, state.currentView],
  })),
  goBack: () => {
    const { navigationHistory } = get();
    if (navigationHistory.length > 0) {
      const previous = navigationHistory[navigationHistory.length - 1];
      set({
        currentView: previous,
        navigationHistory: navigationHistory.slice(0, -1),
      });
    }
  },
  setPreventivoForm: (data) => set((state) => ({ preventivoForm: { ...state.preventivoForm, ...data } })),
  setPreventivoField: (key, value) => set((state) => ({
    preventivoForm: {
      ...state.preventivoForm,
      fields: { ...state.preventivoForm.fields, [key]: value },
    },
  })),
  setPreventivoStep: (step) => set({ preventivoStep: step }),
  resetPreventivoForm: () => set({ preventivoForm: initialPreventivoForm, preventivoStep: 1 }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') localStorage.setItem('app-theme', theme);
    set({ currentTheme: theme });
  },
  setDarkMode: (dark) => {
    if (typeof window !== 'undefined') localStorage.setItem('app-dark-mode', String(dark));
    set({ darkMode: dark });
  },
  toggleDarkMode: () => {
    const current = get().darkMode;
    if (typeof window !== 'undefined') localStorage.setItem('app-dark-mode', String(!current));
    set({ darkMode: !current });
  },
  setFontSizeLevel: (level) => {
    if (typeof window !== 'undefined') localStorage.setItem('app-font-size', level);
    set({ fontSizeLevel: level });
  },
  increaseFontSize: () => {
    const levels: FontSizeLevel[] = ['normal', 'large', 'xlarge'];
    const current = levels.indexOf(get().fontSizeLevel);
    const next = levels[Math.min(current + 1, levels.length - 1)];
    if (typeof window !== 'undefined') localStorage.setItem('app-font-size', next);
    set({ fontSizeLevel: next });
  },
  decreaseFontSize: () => {
    const levels: FontSizeLevel[] = ['normal', 'large', 'xlarge'];
    const current = levels.indexOf(get().fontSizeLevel);
    const prev = levels[Math.max(current - 1, 0)];
    if (typeof window !== 'undefined') localStorage.setItem('app-font-size', prev);
    set({ fontSizeLevel: prev });
  },
  addFotoAdicional: (foto) => set((state) => ({
    preventivoForm: { ...state.preventivoForm, fotosAdicionales: [...state.preventivoForm.fotosAdicionales, foto] }
  })),
  removeFotoAdicional: (id) => set((state) => ({
    preventivoForm: { ...state.preventivoForm, fotosAdicionales: state.preventivoForm.fotosAdicionales.filter(f => f.id !== id) }
  })),
  addSectionFoto: (sectionKey, fotoBase64) => set((state) => {
    const currentFotos = state.preventivoForm.fotos[sectionKey] || [];
    return {
      preventivoForm: {
        ...state.preventivoForm,
        fotos: {
          ...state.preventivoForm.fotos,
          [sectionKey]: [...currentFotos, fotoBase64],
        },
      },
    };
  }),
  removeSectionFoto: (sectionKey, index) => set((state) => {
    const currentFotos = state.preventivoForm.fotos[sectionKey] || [];
    return {
      preventivoForm: {
        ...state.preventivoForm,
        fotos: {
          ...state.preventivoForm.fotos,
          [sectionKey]: currentFotos.filter((_, i) => i !== index),
        },
      },
    };
  }),
}));
