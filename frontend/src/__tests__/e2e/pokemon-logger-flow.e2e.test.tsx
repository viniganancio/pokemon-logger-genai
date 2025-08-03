import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';

// Mock the AuthContext to provide authentication state
const mockAuthContext = {
  user: null,
  isLoading: false,
  login: jest.fn(),
  signup: jest.fn(),
  logout: jest.fn(),
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Wrapper component for tests
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Pokemon Logger E2E Flow', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset localStorage
    localStorage.clear();
    
    // Reset auth context
    mockAuthContext.user = null;
    mockAuthContext.isLoading = false;
  });

  describe('Complete User Journey', () => {
    it('should complete the full Pokemon trainer journey', async () => {
      const { rerender } = render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // ========== STEP 1: Landing on Login Page ==========
      expect(screen.getByText(/welcome back, trainer/i)).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

      // ========== STEP 2: Sign Up New User ==========
      const signupTab = screen.getByRole('tab', { name: /sign up/i });
      await user.click(signupTab);

      await waitFor(() => {
        expect(screen.getByText(/create your account/i)).toBeInTheDocument();
      });

      // Fill signup form
      const nameInput = screen.getByRole('textbox', { name: /name/i });
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(nameInput, 'Test Trainer');
      await user.type(emailInput, 'test@pokemon.com');
      await user.type(passwordInput, 'pikachu123');

      // Mock successful signup
      mockAuthContext.signup.mockResolvedValue(true);

      const signupButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(signupButton);

      await waitFor(() => {
        expect(mockAuthContext.signup).toHaveBeenCalledWith(
          'Test Trainer',
          'test@pokemon.com',
          'pikachu123'
        );
      });

      // ========== STEP 3: Simulate Successful Login ==========
      // Update auth context to simulate logged in user
      mockAuthContext.user = {
        id: 'user-123',
        email: 'test@pokemon.com',
        name: 'Test Trainer'
      };

      // Rerender with authenticated user
      rerender(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // ========== STEP 4: Dashboard Loaded ==========
      await waitFor(() => {
        expect(screen.getByText(/pokemon logger/i)).toBeInTheDocument();
        expect(screen.getByText(/welcome back, test trainer/i)).toBeInTheDocument();
      });

      // Check stats cards are visible
      expect(screen.getByText('Caught')).toBeInTheDocument();
      expect(screen.getByText('Want to Catch')).toBeInTheDocument();
      expect(screen.getByText('Favorites')).toBeInTheDocument();
      expect(screen.getByText('Total Pokemon')).toBeInTheDocument();

      // Check tabs are present
      expect(screen.getByRole('tab', { name: /my collection/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /search pokemon/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /discover/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /camera/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /creator/i })).toBeInTheDocument();

      // ========== STEP 5: Search for Pokemon ==========
      const searchTab = screen.getByRole('tab', { name: /search pokemon/i });
      await user.click(searchTab);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search for pokemon/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search for pokemon/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      await user.type(searchInput, 'pikachu');
      await user.click(searchButton);

      // ========== STEP 6: View Search Results ==========
      await waitFor(() => {
        expect(screen.getByText(/pikachu/i)).toBeInTheDocument();
      });

      // Check Pokemon card elements
      expect(screen.getByText('Electric')).toBeInTheDocument();
      expect(screen.getByText(/caught/i)).toBeInTheDocument();
      expect(screen.getByText(/want/i)).toBeInTheDocument();
      expect(screen.getByText(/fav/i)).toBeInTheDocument();

      // ========== STEP 7: Add Pokemon to Collection ==========
      const caughtButton = screen.getByRole('button', { name: /caught/i });
      await user.click(caughtButton);

      // Check if dialog opens
      await waitFor(() => {
        expect(screen.getByText(/add pikachu to collection/i)).toBeInTheDocument();
      });

      // Add notes
      const notesTextarea = screen.getByPlaceholderText(/add any notes/i);
      await user.type(notesTextarea, 'My first electric Pokemon!');

      // Confirm adding
      const addToCollectionButton = screen.getByRole('button', { name: /add to collection/i });
      await user.click(addToCollectionButton);

      // ========== STEP 8: View My Collection ==========
      const myCollectionTab = screen.getByRole('tab', { name: /my collection/i });
      await user.click(myCollectionTab);

      await waitFor(() => {
        expect(screen.getByText(/my pokemon collection/i)).toBeInTheDocument();
      });

      // Check filters
      expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /caught/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /favorites/i })).toBeInTheDocument();

      // ========== STEP 9: Test Pokemon Creator Feature ==========
      const creatorTab = screen.getByRole('tab', { name: /creator/i });
      await user.click(creatorTab);

      await waitFor(() => {
        expect(screen.getByText(/pokemon character creator/i)).toBeInTheDocument();
      });

      // Check file upload area
      expect(screen.getByText(/upload a photo to pokemonize/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select image/i })).toBeInTheDocument();

      // Simulate file upload
      const fileInput = screen.getByRole('button', { name: /select image/i });
      const file = new File(['fake-image-data'], 'test-person.jpg', { type: 'image/jpeg' });
      
      // Mock file input change
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (hiddenInput) {
        Object.defineProperty(hiddenInput, 'files', {
          value: [file],
          writable: false,
        });
        fireEvent.change(hiddenInput);
      }

      // Wait for image preview
      await waitFor(() => {
        expect(screen.getByAltText(/selected person/i)).toBeInTheDocument();
      });

      // Click pokemonize button
      const pokemonizeButton = screen.getByRole('button', { name: /pokemonize!/i });
      await user.click(pokemonizeButton);

      // ========== STEP 10: View Generated Pokemon Character ==========
      await waitFor(() => {
        expect(screen.getByText(/pokemon character created!/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Check generated Pokemon details
      expect(screen.getByText(/techmon/i)).toBeInTheDocument();
      expect(screen.getByText(/electric\/normal/i)).toBeInTheDocument();
      expect(screen.getByText(/energetic/i)).toBeInTheDocument();
      expect(screen.getByText(/static/i)).toBeInTheDocument();

      // Check stats are displayed
      expect(screen.getByText('85')).toBeInTheDocument(); // HP
      expect(screen.getByText('75')).toBeInTheDocument(); // ATK
      expect(screen.getByText('70')).toBeInTheDocument(); // DEF

      // Save custom Pokemon
      const saveButton = screen.getByRole('button', { name: /save my pokemon character/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/custom pokemon saved!/i)).toBeInTheDocument();
      });

      // ========== STEP 11: Test Discovery Feature ==========
      const discoverTab = screen.getByRole('tab', { name: /discover/i });
      await user.click(discoverTab);

      await waitFor(() => {
        expect(screen.getByText(/discover pokemon/i)).toBeInTheDocument();
      });

      // Check discovery controls
      expect(screen.getByRole('button', { name: /random/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /browse/i })).toBeInTheDocument();

      // ========== STEP 12: Logout ==========
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockAuthContext.logout).toHaveBeenCalled();
      });

      console.log('✅ E2E Test completed successfully!');
    }, 60000); // 60 second timeout for complete flow

    it('should handle error states gracefully', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Test login with invalid credentials
      mockAuthContext.login.mockResolvedValue(false);

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'invalid@email.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockAuthContext.login).toHaveBeenCalledWith('invalid@email.com', 'wrongpassword');
      });

      // Should remain on login page
      expect(screen.getByText(/welcome back, trainer/i)).toBeInTheDocument();
    });
  });
});