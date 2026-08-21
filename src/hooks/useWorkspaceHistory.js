import { useState, useEffect, useRef } from 'react';

export function useWorkspaceHistory(initialTab = 'dashboard') {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const showLeaveModalRef = useRef(false);
  const tabHistory = useRef([initialTab]);

  useEffect(() => {
    showLeaveModalRef.current = showLeaveModal;
  }, [showLeaveModal]);

  const pushTab = (newTab) => {
    if (newTab === activeTab) return;
    tabHistory.current.push(newTab);
    window.history.pushState({ workspaceTab: newTab }, '');
    setActiveTab(newTab);
  };

  useEffect(() => {
    // Push initial guard state to intercept browser back button
    window.history.pushState({ workspaceTab: initialTab }, '');

    const handlePopState = (e) => {
      if (tabHistory.current.length > 1) {
        tabHistory.current.pop();
        const prevTab = tabHistory.current[tabHistory.current.length - 1];
        setActiveTab(prevTab);
      } else {
        // We are on root tab (dashboard)
        if (showLeaveModalRef.current) {
          setShowLeaveModal(false);
          window.history.back();
        } else {
          // Re-push state so page is not popped off immediately while modal displays
          window.history.pushState({ workspaceTab: initialTab, modal: true }, '');
          setShowLeaveModal(true);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [initialTab]);

  const popTab = () => {
    if (tabHistory.current.length > 1) {
      tabHistory.current.pop();
      const prevTab = tabHistory.current[tabHistory.current.length - 1];
      setActiveTab(prevTab);
    } else {
      setActiveTab(initialTab);
    }
  };

  return {
    activeTab,
    setActiveTab,
    pushTab,
    popTab,
    showLeaveModal,
    setShowLeaveModal
  };
}
