/**
 * WebSocket Hook for Real-Time Appointment Updates
 * 
 * Connects to Socket.IO server and handles:
 * - Appointment status changes
 * - Patient check-ins
 * - Exam starts/completions
 * - Ready for dispense notifications
 * - Order creations
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { io, Socket } from 'socket.io-client';

interface AppointmentWebSocketEvent {
  event: string;
  data: {
    appointmentId: string;
    patientId?: string;
    practitionerId?: string;
    examId?: string;
    orderId?: string;
    prescriptionId?: string;
    status?: string;
    stage?: string;
    timestamp: string;
  };
}

interface UseAppointmentWebSocketOptions {
  companyId?: string;
  onCheckIn?: (event: AppointmentWebSocketEvent) => void;
  onExamStarted?: (event: AppointmentWebSocketEvent) => void;
  onReadyForDispense?: (event: AppointmentWebSocketEvent) => void;
  onOrderCreated?: (event: AppointmentWebSocketEvent) => void;
  onStatusChanged?: (event: AppointmentWebSocketEvent) => void;
  enableToasts?: boolean;
}

/**
 * Hook for real-time appointment updates via WebSocket
 */
export function useAppointmentWebSocket(options: UseAppointmentWebSocketOptions = {}) {
  const {
    companyId,
    onCheckIn,
    onExamStarted,
    onReadyForDispense,
    onOrderCreated,
    onStatusChanged,
    enableToasts = true,
  } = options;
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const socketRef = useRef<Socket | null>(null);
  
  useEffect(() => {
    if (!companyId) {
      return;
    }
    
    // Get auth token from localStorage
    const token = localStorage.getItem('ils_access_token');
    
    // Initialize Socket.IO connection with auth token
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: {
        token: token
      }
    });
    
    socketRef.current = socket;
    
    // Handle connection
    socket.on('connect', () => {
      console.log('[WebSocket] Connected to appointment updates');
      
      // Join company-specific room
      socket.emit('join_company', { companyId });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected from appointment updates');
    });
    
    // Handle errors
    socket.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });
    
    // ========== Appointment Events ==========
    
    // Patient checked in
    socket.on('appointment:checked_in', (event: AppointmentWebSocketEvent) => {
      console.log('[WebSocket] Patient checked in:', event);
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      if (enableToasts) {
        toast({
          title: '✓ Patient Checked In',
          description: 'Patient is ready for appointment',
        });
      }
      
      onCheckIn?.(event);
    });
    
    // Exam started
    socket.on('appointment:exam_started', (event: AppointmentWebSocketEvent) => {
      console.log('[WebSocket] Exam started:', event);
      
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      if (enableToasts) {
        toast({
          title: '🔵 Exam In Progress',
          description: 'Examination has started',
        });
      }
      
      onExamStarted?.(event);
    });
    
    // Exam completed (generic)
    socket.on('appointment:exam_completed', (event: AppointmentWebSocketEvent) => {
      console.log('[WebSocket] Exam completed:', event);
      
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
    });
    
    // Ready for dispense
    socket.on('appointment:ready_for_dispense', (event: AppointmentWebSocketEvent) => {
      console.log('[WebSocket] Ready for dispense:', event);
      
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      if (enableToasts) {
        toast({
          title: '🟣 Ready for Dispensing',
          description: 'Patient exam completed, prescription signed',
          duration: 5000,
        });
      }
      
      // Play notification sound for dispensers
      playNotificationSound();
      
      onReadyForDispense?.(event);
    });
    
    // Order created
    socket.on('appointment:order_created', (event: AppointmentWebSocketEvent) => {
      console.log('[WebSocket] Order created:', event);
      
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      if (enableToasts) {
        toast({
          title: '✓ Order Created',
          description: 'Order has been created successfully',
        });
      }
      
      onOrderCreated?.(event);
    });
    
    // Status changed (generic)
    socket.on('appointment:status_changed', (event: AppointmentWebSocketEvent) => {
      console.log('[WebSocket] Status changed:', event);
      
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      onStatusChanged?.(event);
    });
    
    // Appointment cancelled
    socket.on('appointment:cancelled', (event: AppointmentWebSocketEvent) => {
      console.log('[WebSocket] Appointment cancelled:', event);
      
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      if (enableToasts) {
        toast({
          title: '🔴 Appointment Cancelled',
          description: 'An appointment has been cancelled',
          variant: 'destructive',
        });
      }
    });
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_company', { companyId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [companyId, queryClient, toast, enableToasts, onCheckIn, onExamStarted, onReadyForDispense, onOrderCreated, onStatusChanged]);
  
  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
  };
}

/**
 * Play notification sound
 */
function playNotificationSound() {
  try {
    // Create a simple notification beep
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // 800 Hz
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
}

/**
 * Hook for dispensers to monitor ready queue
 */
export function useDispenserNotifications(companyId?: string) {
  return useAppointmentWebSocket({
    companyId,
    enableToasts: true,
    onReadyForDispense: (event) => {
      console.log('[Dispenser] Patient ready:', event);
    },
  });
}

/**
 * Hook for ECPs to monitor their appointments
 */
export function useECPNotifications(companyId?: string, practitionerId?: string) {
  return useAppointmentWebSocket({
    companyId,
    enableToasts: true,
    onCheckIn: (event) => {
      // Only notify if this is practitioner's patient
      if (event.data.practitionerId === practitionerId) {
        console.log('[ECP] Your patient checked in:', event);
      }
    },
  });
}

/**
 * Hook for reception to monitor all appointments
 */
export function useReceptionNotifications(companyId?: string) {
  return useAppointmentWebSocket({
    companyId,
    enableToasts: true,
  });
}
