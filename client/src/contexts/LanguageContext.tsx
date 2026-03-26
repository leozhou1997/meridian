import React, { createContext, useContext, useState } from "react";

export type Language = "en" | "zh";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.stakeholders": "Stakeholders",
    "nav.transcripts": "Transcripts",
    "nav.knowledge": "Knowledge Base",
    "nav.ask": "Ask Meridian",
    "nav.settings": "Settings",
    "nav.signout": "Sign out",
    // Settings page
    "settings.title": "Settings",
    "settings.account": "Account",
    "settings.account.desc": "Manage your profile and preferences",
    "settings.language": "Language & Region",
    "settings.language.desc": "Choose your preferred language",
    "settings.team": "Team",
    "settings.team.desc": "Invite colleagues and manage team access",
    "settings.displayName": "Display Name",
    "settings.email": "Email",
    "settings.save": "Save Changes",
    "settings.saved": "Changes saved",
    "settings.lang.en": "English",
    "settings.lang.zh": "中文 (Chinese)",
    "settings.invite.email": "Email address",
    "settings.invite.send": "Send Invite",
    "settings.invite.sent": "Invite sent!",
    "settings.invite.placeholder": "colleague@company.com",
    "settings.members": "Team Members",
    "settings.theme": "Appearance",
    "settings.theme.dark": "Dark",
    "settings.theme.light": "Light",
    // Common
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.loading": "Loading...",
  },
  zh: {
    // Navigation
    "nav.dashboard": "仪表盘",
    "nav.stakeholders": "利益相关方",
    "nav.transcripts": "会议记录",
    "nav.knowledge": "知识库",
    "nav.ask": "问 Meridian",
    "nav.settings": "设置",
    "nav.signout": "退出登录",
    // Settings page
    "settings.title": "设置",
    "settings.account": "账号",
    "settings.account.desc": "管理您的个人资料和偏好设置",
    "settings.language": "语言与地区",
    "settings.language.desc": "选择您的首选语言",
    "settings.team": "团队",
    "settings.team.desc": "邀请同事并管理团队访问权限",
    "settings.displayName": "显示名称",
    "settings.email": "邮箱",
    "settings.save": "保存更改",
    "settings.saved": "已保存",
    "settings.lang.en": "English",
    "settings.lang.zh": "中文 (Chinese)",
    "settings.invite.email": "邮箱地址",
    "settings.invite.send": "发送邀请",
    "settings.invite.sent": "邀请已发送！",
    "settings.invite.placeholder": "colleague@company.com",
    "settings.members": "团队成员",
    "settings.theme": "外观",
    "settings.theme.dark": "深色",
    "settings.theme.light": "浅色",
    // Common
    "common.cancel": "取消",
    "common.save": "保存",
    "common.loading": "加载中...",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("language") as Language) || "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] ?? translations["en"][key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
