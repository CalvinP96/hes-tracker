import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  loadProjects,
  saveProjects,
  loadUsers,
  saveUser,
  deleteUser,
  loadSettings,
  saveSettings,
  getSession,
  setSession,
  setSessionNav
} from '../db.js';
import { STAGES, ROLES, DEFAULT_USERS } from '../constants/index.js';
import { uid, blank, calcStage, getAlerts, hasPhoto } from '../helpers/index.js';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Core state
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [curUser, setCurUser] = useState(null);
  const [view, setView] = useState('grid');
  const [selId, setSelId] = useState(null);
  const [tab, setTab] = useState(0);
  const [filter, setFilter] = useState({});
  const [search, setSearch] = useState('');
  const [appSettings, setAppSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Debounce timer ref for save
  const saveTimerRef = useRef(null);

  // Initialize app on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        const [loadedProjects, loadedUsers, loadedSettings, session] = await Promise.all([
          loadProjects(),
          loadUsers(),
          loadSettings(),
          getSession()
        ]);

        setProjects(loadedProjects || []);
        setUsers(loadedUsers || DEFAULT_USERS);
        setAppSettings(loadedSettings || {});

        if (session) {
          const user = (loadedUsers || DEFAULT_USERS).find(u => u.id === session.userId);
          if (user) setCurUser(user);
          if (session.view) setView(session.view);
          if (session.selId) setSelId(session.selId);
          if (session.tab !== undefined) setTab(session.tab);
        } else {
          const defaultUser = (loadedUsers || DEFAULT_USERS)[0];
          if (defaultUser) setCurUser(defaultUser);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        addToast('Failed to load app data', 'error');
        setUsers(DEFAULT_USERS);
        setCurUser(DEFAULT_USERS[0]);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Toast notification system
  const addToast = useCallback((message, type = 'info') => {
    const toastId = uid();
    setToasts(prev => [...prev, { id: toastId, message, type, createdAt: Date.now() }]);

    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  // Remove toast manually
  const removeToast = useCallback((toastId) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  }, []);

  // Debounced save function
  const debouncedSave = useCallback((projectsToSave) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        const success = await saveProjects(projectsToSave);
        if (!success) {
          addToast('Failed to save projects', 'error');
        }
      } catch (error) {
        console.error('Save error:', error);
        addToast('Error saving projects', 'error');
      }
    }, 400);
  }, [addToast]);

  // Update projects (full replace)
  const up = useCallback((newProjects) => {
    setProjects(newProjects);
    debouncedSave(newProjects);
  }, [debouncedSave]);

  // Update single project
  const upP = useCallback((projectId, updates) => {
    setProjects(prev => {
      const updated = prev.map(p => p.id === projectId ? { ...p, ...updates } : p);
      debouncedSave(updated);
      return updated;
    });
  }, [debouncedSave]);

  // Update project + check advance (for stage progression)
  const upC = useCallback((projectId, updates) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === projectId) {
          const modified = { ...p, ...updates };
          const newStage = calcStage(modified);
          if (newStage > p.currentStage) {
            modified.currentStage = newStage;
            addToast(`Project advanced to ${STAGES[newStage]}`, 'success');
          }
          return modified;
        }
        return p;
      });
      debouncedSave(updated);
      return updated;
    });
  }, [addToast, debouncedSave]);

  // Add activity log entry
  const addLog = useCallback((projectId, message, details = null) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === projectId) {
          const logEntry = {
            id: uid(),
            timestamp: new Date().toISOString(),
            user: curUser?.name || 'System',
            message,
            details
          };
          return {
            ...p,
            activityLog: [...(p.activityLog || []), logEntry]
          };
        }
        return p;
      });
      debouncedSave(updated);
      return updated;
    });
  }, [curUser, debouncedSave]);

  // Check and advance stage based on project data
  const checkAdvance = useCallback((projectId) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === projectId) {
          const newStage = calcStage(p);
          if (newStage > p.currentStage) {
            addToast(`Project advanced to ${STAGES[newStage]}`, 'success');
            return { ...p, currentStage: newStage };
          }
        }
        return p;
      });
      debouncedSave(updated);
      return updated;
    });
  }, [addToast, debouncedSave]);

  // User management
  const addUser = useCallback((userData) => {
    const newUser = { id: uid(), ...userData, createdAt: new Date().toISOString() };
    setUsers(prev => [...prev, newUser]);
    saveUser(newUser);
    return newUser;
  }, []);

  const upUser = useCallback((userId, updates) => {
    setUsers(prev => {
      const updated = prev.map(u => u.id === userId ? { ...u, ...updates } : u);
      saveUser({ ...updated.find(u => u.id === userId), ...updates });
      return updated;
    });
  }, []);

  const delUser = useCallback((userId) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    deleteUser(userId);
    addToast('User deleted', 'success');
  }, [addToast]);

  // Settings management
  const upSettings = useCallback((newSettings) => {
    setAppSettings(newSettings);
    saveSettings(newSettings);
    addToast('Settings saved', 'success');
  }, [addToast]);

  // Session management
  const updateSession = useCallback((updates = {}) => {
    if (curUser) {
      setSession(curUser.id, updates);
    }
  }, [curUser]);

  const updateSessionNav = useCallback((nav) => {
    setSessionNav(nav);
  }, []);

  // Persist navigation state when view/selId/tab changes
  useEffect(() => {
    updateSession({ view, selId, tab });
  }, [view, selId, tab, updateSession]);

  // Cleanup save timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const value = {
    // State
    projects,
    users,
    curUser,
    setCurUser,
    view,
    setView,
    selId,
    setSelId,
    tab,
    setTab,
    filter,
    setFilter,
    search,
    setSearch,
    appSettings,
    loading,
    toasts,

    // Project actions
    up,
    upP,
    upC,
    addLog,
    checkAdvance,

    // User actions
    addUser,
    upUser,
    delUser,

    // Settings actions
    upSettings,

    // Session actions
    updateSession,
    updateSessionNav,

    // Toast actions
    addToast,
    removeToast,

    // Helper functions (passed through for convenience)
    calcStage,
    getAlerts,
    hasPhoto
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
