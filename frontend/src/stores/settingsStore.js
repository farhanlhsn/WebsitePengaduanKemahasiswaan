import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
  persist(
    (set) => ({
      settings: {
        notifications: {
          email: true,
          push: true,
          reportUpdates: true,
          newFeatures: false
        },
        privacy: {
          showProfile: true,
          showReports: false,
          allowTracking: false
        },
        language: 'id',
        theme: 'light'
      },
      updateSetting: (category, key, value) => 
        set((state) => {
          if (category === '') {
            return {
              settings: {
                ...state.settings,
                [key]: value
              }
            };
          }
          return {
            settings: {
              ...state.settings,
              [category]: {
                ...state.settings[category],
                [key]: value
              }
            }
          };
        }),
      updateAllSettings: (newSettings) => set(() => ({ settings: newSettings })),
      setTheme: (theme) => set((state) => ({ settings: { ...state.settings, theme } })),
      setLanguage: (language) => set((state) => ({ settings: { ...state.settings, language } }))
    }),
    {
      name: 'user-settings-storage',
    }
  )
);

export default useSettingsStore;

const dictionaries = {
  id: {
    'dashboard.title': 'Dasbor',
    'dashboard.subtitle': 'Selamat datang kembali! Berikut ringkasan laporan Anda.',
    'dashboard.total_reports': 'Total Laporan',
    'dashboard.pending': 'Menunggu',
    'dashboard.in_progress': 'Diproses',
    'dashboard.resolved': 'Selesai',
    'reports.title': 'Laporan Saya',
    'reports.subtitle': 'Kelola dan pantau semua laporan yang telah Anda buat.',
    'chat.title': 'Percakapan',
    'chat.subtitle': 'Berkomunikasi langsung dengan admin terkait laporan Anda.',
    'profile.title': 'Profil Saya',
    'profile.subtitle': 'Kelola informasi profil dan akun Anda.',
    'settings.title': 'Pengaturan',
    'settings.subtitle': 'Sesuaikan preferensi aplikasi Anda.',
    'sidebar.dashboard': 'Dasbor',
    'sidebar.reports': 'Laporan Saya',
    'sidebar.chat': 'Percakapan',
    'sidebar.profile': 'Profil Saya',
    'sidebar.settings': 'Pengaturan',
    'sidebar.help': 'Pusat Bantuan',
    'sidebar.logout': 'Keluar',
    'sidebar.createReport': 'Buat Laporan Baru',
    'sidebar.devices': 'Perangkat',
    'sidebar.desc.dashboard': 'Ringkasan aktivitas Anda',
    'sidebar.desc.reports': 'Kelola semua laporan Anda',
    'sidebar.desc.chat': 'Komunikasi dengan dosen dan admin',
    'sidebar.desc.createReport': 'Mulai buat laporan baru',
    'sidebar.desc.profile': 'Kelola profil dan informasi pribadi',
    'sidebar.desc.devices': 'Kelola perangkat yang terhubung',
    'sidebar.desc.settings': 'Sesuaikan preferensi aplikasi',
    'sidebar.desc.help': 'Dapatkan bantuan dan panduan',
    'sidebar.desc.logout': 'Keluar dari akun Anda'
  },
  en: {
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Welcome back! Here is your report summary.',
    'dashboard.total_reports': 'Total Reports',
    'dashboard.pending': 'Pending',
    'dashboard.in_progress': 'In Progress',
    'dashboard.resolved': 'Resolved',
    'reports.title': 'My Reports',
    'reports.subtitle': 'Manage and track all the reports you have submitted.',
    'chat.title': 'Chat & Communication',
    'chat.subtitle': 'Direct communication with admins regarding your reports.',
    'profile.title': 'My Profile',
    'profile.subtitle': 'Manage your profile and account information.',
    'settings.title': 'Settings',
    'settings.subtitle': 'Adjust your application preferences.',
    'sidebar.dashboard': 'Dashboard',
    'sidebar.reports': 'My Reports',
    'sidebar.chat': 'Chat & Communication',
    'sidebar.profile': 'My Profile',
    'sidebar.settings': 'Settings',
    'sidebar.help': 'Help Center',
    'sidebar.logout': 'Logout',
    'sidebar.createReport': 'Create New Report',
    'sidebar.devices': 'Devices',
    'sidebar.desc.dashboard': 'Your activity summary',
    'sidebar.desc.reports': 'Manage all your reports',
    'sidebar.desc.chat': 'Communicate with admins',
    'sidebar.desc.createReport': 'Start a new report',
    'sidebar.desc.profile': 'Manage personal information',
    'sidebar.desc.devices': 'Manage connected devices',
    'sidebar.desc.settings': 'Adjust app preferences',
    'sidebar.desc.help': 'Get help and guides',
    'sidebar.desc.logout': 'Sign out of your account'
  }
};

export const useTranslation = () => {
  const { settings } = useSettingsStore();
  const lang = settings.language || 'id';

  const t = (key) => {
    return dictionaries[lang]?.[key] || dictionaries['id'][key] || key;
  };

  return { t, lang };
};
