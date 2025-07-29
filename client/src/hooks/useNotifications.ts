import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface Notification {
  id: string;
  type: 'lead' | 'bid_request' | 'estimate' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  url?: string;
}

// Mock notifications for now - in a real app, this would come from an API
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'lead',
    title: 'New Lead Received',
    message: 'John Smith submitted a quote request for patio cleaning',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    url: '/leads'
  },
  {
    id: '2',
    type: 'bid_request',
    title: 'Bid Request Pending',
    message: 'Kitchen remodel quote needs your review',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    url: '/bid-requests'
  },
  {
    id: '3',
    type: 'estimate',
    title: 'Estimate Viewed',
    message: 'Sarah Johnson viewed her fence cleaning estimate',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    url: '/estimates'
  }
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'lead':
        return '👤';
      case 'bid_request':
        return '📋';
      case 'estimate':
        return '💰';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    getNotificationIcon,
    formatTimeAgo
  };
}