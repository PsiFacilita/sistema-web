import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AlertModal } from '../AlertModal';

describe('AlertModal', () => {
  test('renders when isOpen is true', () => {
    render(
      <AlertModal 
        isOpen={true} 
        message="Test message" 
        onClose={() => {}} 
      />
    );
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('Information')).toBeInTheDocument();
  });
  
  test('does not render when isOpen is false', () => {
    render(
      <AlertModal 
        isOpen={false} 
        message="Test message" 
        onClose={() => {}} 
      />
    );
    
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });
  
  test('shows correct title based on type', () => {
    render(
      <AlertModal 
        isOpen={true} 
        message="Error occurred" 
        type="error"
        onClose={() => {}} 
      />
    );
    
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
  
  test('calls onClose when clicking outside the modal', async () => {
    const handleClose = jest.fn();
    
    render(
      <AlertModal 
        isOpen={true} 
        message="Test message" 
        onClose={handleClose} 
      />
    );
    
    // Click on the overlay
    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement);
    
    // Should call onClose after animation
    await waitFor(() => {
      expect(handleClose).toHaveBeenCalledTimes(1);
    }, { timeout: 500 });
  });
  
  test('calls onConfirm when clicking confirm button', async () => {
    const handleConfirm = jest.fn();
    const handleClose = jest.fn();
    
    render(
      <AlertModal 
        isOpen={true} 
        message="Test message" 
        onClose={handleClose}
        onConfirm={handleConfirm}
        confirmButtonText="Confirm" 
      />
    );
    
    fireEvent.click(screen.getByText('Confirm'));
    
    expect(handleConfirm).toHaveBeenCalledTimes(1);
    
    // Should call onClose after animation
    await waitFor(() => {
      expect(handleClose).toHaveBeenCalledTimes(1);
    }, { timeout: 500 });
  });
  
  test('renders cancel button when cancelButtonText is provided', () => {
    render(
      <AlertModal 
        isOpen={true} 
        message="Test message" 
        onClose={() => {}}
        cancelButtonText="Cancel" 
      />
    );
    
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
  
  test('does not render cancel button when cancelButtonText is empty', () => {
    render(
      <AlertModal 
        isOpen={true} 
        message="Test message" 
        onClose={() => {}}
        cancelButtonText="" 
      />
    );
    
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });
});