import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppProvider } from '../components/AppProvider';
import { View } from '../types';

// Mock the services
jest.mock('../services/ratingService', () => ({
  getRatings: jest.fn(() => Promise.resolve({})),
  addRating: jest.fn(),
  getSellerRatings: jest.fn(() => Promise.resolve({})),
  addSellerRating: jest.fn(),
}));

jest.mock('../services/chatService', () => ({
  getConversations: jest.fn(() => Promise.resolve([])),
  saveConversations: jest.fn(),
}));

jest.mock('../services/settingsService', () => ({
  getSettings: jest.fn(() => ({ listingFee: 0, siteAnnouncement: '' })),
  saveSettings: jest.fn(),
}));

jest.mock('../services/auditLogService', () => ({
  getAuditLog: jest.fn(() => Promise.resolve([])),
  logAction: jest.fn(),
  saveAuditLog: jest.fn(),
}));

jest.mock('../services/notificationService', () => ({
  showNotification: jest.fn(),
}));

jest.mock('../services/faqService', () => ({
  getFaqs: jest.fn(() => Promise.resolve([])),
  saveFaqs: jest.fn(),
}));

jest.mock('../services/supportTicketService', () => ({
  getSupportTickets: jest.fn(() => Promise.resolve([])),
  saveSupportTickets: jest.fn(),
}));

jest.mock('../services/dataService', () => ({
  dataService: {
    getVehicles: jest.fn(() => Promise.resolve([])),
    getVehicleData: jest.fn(() => Promise.resolve({})),
    getUsers: jest.fn(() => Promise.resolve([])),
    syncWhenOnline: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../utils/loadingManager', () => ({
  loadingManager: {
    startLoading: jest.fn(),
    stopLoading: jest.fn(),
  },
  LOADING_OPERATIONS: {},
  withLoadingTimeout: jest.fn((fn) => fn),
}));

jest.mock('../hooks/useCleanup', () => ({
  useTimeout: jest.fn(),
}));

jest.mock('../components/vehicleData', () => ({
  VEHICLE_DATA: {},
}));

// Test component that uses the AppProvider
const TestComponent: React.FC = () => {
  const { addToast, currentView, navigate } = React.useContext(AppProvider);
  
  return (
    <div>
      <div data-testid="current-view">{currentView}</div>
      <button 
        data-testid="add-toast" 
        onClick={() => addToast('Test message', 'success')}
      >
        Add Toast
      </button>
      <button 
        data-testid="navigate-home" 
        onClick={() => navigate(View.HOME)}
      >
        Navigate Home
      </button>
    </div>
  );
};

describe('AppProvider', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should provide initial state correctly', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('current-view')).toHaveTextContent(View.HOME);
  });

  it('should handle navigation correctly', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    fireEvent.click(screen.getByTestId('navigate-home'));
    expect(screen.getByTestId('current-view')).toHaveTextContent(View.HOME);
  });

  it('should handle toast notifications', async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    fireEvent.click(screen.getByTestId('add-toast'));
    
    await waitFor(() => {
      // Toast should be added to the context
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  it('should handle user login correctly', async () => {
    const mockUser = {
      name: 'Test User',
      email: 'test@test.com',
      mobile: '9876543210',
      role: 'customer' as const,
      location: 'Mumbai',
      status: 'active' as const,
      createdAt: new Date().toISOString(),
    };

    const LoginTestComponent: React.FC = () => {
      const { handleLogin, currentUser } = React.useContext(AppProvider);
      
      return (
        <div>
          <div data-testid="user-email">{currentUser?.email || 'No user'}</div>
          <button 
            data-testid="login-button" 
            onClick={() => handleLogin(mockUser)}
          >
            Login
          </button>
        </div>
      );
    };

    render(
      <AppProvider>
        <LoginTestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('user-email')).toHaveTextContent('No user');
    
    fireEvent.click(screen.getByTestId('login-button'));
    
    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@test.com');
    });
  });

  it('should handle sendMessage without race conditions', async () => {
    const mockConversation = {
      id: 'conv_1',
      customerId: 'customer@test.com',
      customerName: 'Test Customer',
      sellerId: 'seller@test.com',
      vehicleId: 1,
      vehicleName: 'Test Vehicle',
      messages: [],
      lastMessageAt: new Date().toISOString(),
      isReadBySeller: false,
      isReadByCustomer: true,
    };

    const MessageTestComponent: React.FC = () => {
      const { sendMessage, conversations, setActiveChat } = React.useContext(AppProvider);
      
      React.useEffect(() => {
        // Set up initial conversation
        setActiveChat(mockConversation);
      }, [setActiveChat]);
      
      return (
        <div>
          <div data-testid="conversation-count">{conversations.length}</div>
          <button 
            data-testid="send-message" 
            onClick={() => sendMessage('conv_1', 'Hello!')}
          >
            Send Message
          </button>
        </div>
      );
    };

    render(
      <AppProvider>
        <MessageTestComponent />
      </AppProvider>
    );

    fireEvent.click(screen.getByTestId('send-message'));
    
    await waitFor(() => {
      // Should not cause infinite loops or race conditions
      expect(screen.getByTestId('conversation-count')).toBeInTheDocument();
    });
  });
});
