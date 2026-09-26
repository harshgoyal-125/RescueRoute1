import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  authApi,
  donationApi,
  matchApi,
  shelterApi,
  deliveryApi
} from '../services/api';


const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Authentication & Persona state (loads saved session or null if unauthenticated)
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Collections state loaded from real MongoDB backend
  const [donations, setDonations] = useState([]);
  const [loadingDonations, setLoadingDonations] = useState(false);
  const [errorDonations, setErrorDonations] = useState(null);

  const [deliveries, setDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [errorDeliveries, setErrorDeliveries] = useState(null);

  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [errorMatches, setErrorMatches] = useState(null);

  // Shelter specific configuration
  const [shelterCapacity, setShelterCapacity] = useState(null);

  // Fetch all domain collections from backend
  const refreshDonations = useCallback(async () => {
    try {
      setLoadingDonations(true);
      setErrorDonations(null);
      const data = await donationApi.getDonations();
      // Normalize _id to id for seamless UI rendering
      const normalized = (data.donations || []).map(d => ({
        ...d,
        id: d._id || d.id
      }));
      setDonations(normalized);
    } catch (err) {
      setDonations([]);
      setErrorDonations(err.message || 'Could not load donations. Please try again.');
    } finally {
      setLoadingDonations(false);
    }
  }, []);

  const refreshDeliveries = useCallback(async () => {
    try {
      setLoadingDeliveries(true);
      setErrorDeliveries(null);
      const list = await deliveryApi.getDeliveries();
      const normalized = (list || []).map(d => ({
        ...d,
        id: d._id || d.id
      }));
      setDeliveries(normalized);
    } catch (err) {
      setDeliveries([]);
      setErrorDeliveries(err.message || 'Could not load deliveries. Please try again.');
    } finally {
      setLoadingDeliveries(false);
    }
  }, []);

  const refreshMatches = useCallback(async () => {
    try {
      setLoadingMatches(true);
      setErrorMatches(null);
      const list = await matchApi.getMatches();
      const normalized = (list || []).map(m => ({
        ...m,
        id: m._id || m.id
      }));
      setMatches(normalized);
    } catch (err) {
      setMatches([]);
      setErrorMatches(err.message || 'Could not load matches. Please try again.');
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  const refreshShelterCapacity = useCallback(async () => {
    try {
      if (currentUser?._id && currentUser?.role === 'SHELTER') {
        const shelter = await shelterApi.getShelterById(currentUser._id);
        if (shelter?.capacity) {
          setShelterCapacity({
            currentCapacity: shelter.capacity.current,
            maxCapacity: shelter.capacity.max,
            preferredRadiusMiles: shelter.preferredRadiusMiles || 8,
            acceptedCategories: shelter.foodPreferences || []
          });
        }
      }
    } catch {
      setShelterCapacity(null);
    }
  }, [currentUser]);

  // Load active user on startup or login
  const initAuth = useCallback(async () => {
    const token = localStorage.getItem('rescueroute_token');
    if (!token) {
      setCurrentUser(null);
      setCurrentRole(null);
      setIsAuthLoading(false);
      return;
    }

    setIsAuthLoading(true);
    try {
      const user = await authApi.getMe();
      if (!user) throw new Error('Session could not be verified.');
      if (user) {
        setCurrentUser(user);
        setCurrentRole(user.role.toLowerCase());
        localStorage.setItem('rescueroute_user', JSON.stringify(user));
      }
    } catch {
      setCurrentUser(null);
      setCurrentRole(null);
      setDonations([]);
      setDeliveries([]);
      setMatches([]);
      localStorage.removeItem('rescueroute_user');
      localStorage.removeItem('rescueroute_token');
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // When currentUser changes, reload relevant collections
  useEffect(() => {
    if (currentUser) {
      refreshDonations();
      refreshDeliveries();
      refreshMatches();
      refreshShelterCapacity();
    }
  }, [currentUser, refreshDonations, refreshDeliveries, refreshMatches, refreshShelterCapacity]);

  // Login action
  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    if (res.user) {
      setCurrentUser(res.user);
      setCurrentRole(res.user.role.toLowerCase());
      try {
        localStorage.setItem('rescueroute_user', JSON.stringify(res.user));
      } catch (e) {
        console.warn('Could not persist session:', e);
      }
    }
    return res;
  };

  // Register action - authenticates and registers real accounts directly with backend
  const register = async (userData) => {
    const res = await authApi.register(userData);
    if (res.user) {
      setCurrentUser(res.user);
      setCurrentRole(res.user.role.toLowerCase());
      try {
        localStorage.setItem('rescueroute_user', JSON.stringify(res.user));
      } catch (e) {
        console.warn('Could not persist session:', e);
      }
    }
    return res;
  };

  // Feedback is stored only in this browser, not sent to coordinators.
  // User Feedback state and submission
  const [feedbacks, setFeedbacks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rr_feedbacks') || '[]');
    } catch {
      return [];
    }
  });

  const submitFeedback = (feedbackData) => {
    const newEntry = {
      id: `fb-${Date.now()}`,
      ...feedbackData,
      user: currentUser?.name || 'Anonymous User',
      role: currentRole,
      createdAt: new Date().toISOString()
    };
    setFeedbacks(prev => {
      const updated = [newEntry, ...prev];
      try {
        localStorage.setItem('rr_feedbacks', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not persist feedback to localStorage:', e);
      }
      return updated;
    });
    return newEntry;
  };

  // Logout action
  const logout = () => {
    authApi.logout();
    setCurrentUser(null);
    setCurrentRole(null);
    try {
      localStorage.removeItem('rescueroute_user');
      localStorage.removeItem('rescueroute_token');
    } catch (e) {
      console.warn('Could not clear session storage:', e);
    }
    setDonations([]);
    setDeliveries([]);
    setMatches([]);
  };

  // Post a new donation to backend MongoDB
  const addDonation = async (donationData) => {
    const created = await donationApi.createDonation(donationData);
    const normalized = { ...created, id: created._id || created.id };
    setDonations(prev => [normalized, ...prev]);
    refreshMatches();
    return normalized;
  };

  // Update delivery status (e.g. Mark Picked Up, Mark Delivered) via backend REST API
  const updateDeliveryStatus = async (deliveryId, newStatus) => {
    const updated = await deliveryApi.updateStatus(deliveryId, newStatus);
    const normalized = { ...updated, id: updated._id || updated.id };
    setDeliveries(prev => prev.map(item => (item.id === deliveryId || item._id === deliveryId ? normalized : item)));
    refreshDonations();
    return normalized;
  };

  // Claim an unassigned delivery route via backend REST API
  const assignDelivery = async (deliveryId) => {
    try {
      const updated = await deliveryApi.assignDelivery(deliveryId);
      const normalized = {
        ...updated,
        id: updated._id || updated.id
      };

      setDeliveries(prev =>
        prev.map(item => (item.id === deliveryId || item._id === deliveryId ? normalized : item))
      );

      refreshDeliveries();
      refreshDonations();
      return normalized;
    } catch (err) {
      console.warn('[Assign Delivery]: Failed:', err.message);
      throw err;
    }
  };

  // Update shelter capacity settings in MongoDB
  const updateCapacitySettings = async (newSettings) => {
    if (!currentUser?._id) throw new Error('Please sign in.');
    await shelterApi.updateCapacity(currentUser._id, {
      currentCapacity: newSettings.currentCapacity, maxCapacity: newSettings.maxCapacity,
      preferredRadiusMiles: newSettings.preferredRadiusMiles, foodPreferences: newSettings.acceptedCategories
    });
    setShelterCapacity(prev => ({...prev, ...newSettings}));
  };

  const acceptMatch = async (matchId) => {
    const result = await matchApi.acceptMatch(matchId);
    setMatches(prev => prev.filter(m => m.id !== matchId && m._id !== matchId));
    refreshDeliveries();
    refreshDonations();
    return result;
  };

  const value = {
    currentUser,
    currentRole,
    login,
    register,
    logout,
    isAuthLoading,
    feedbacks,
    submitFeedback,

    // Donations
    donations,
    loadingDonations,
    errorDonations,
    refreshDonations,
    addDonation,

    // Deliveries
    deliveries,
    loadingDeliveries,
    errorDeliveries,
    refreshDeliveries,
    assignDelivery,
    updateDeliveryStatus,

    // Matches
    matches,
    loadingMatches,
    errorMatches,
    refreshMatches,
    acceptMatch,

    // Shelter Capacity
    shelterCapacity,
    updateCapacitySettings,
    refreshShelterCapacity
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
