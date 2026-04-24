import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import ShortcutsOverlay from '../ShortcutsOverlay';

describe('ShortcutsOverlay', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders nothing initially', () => {
    const { container } = render(<ShortcutsOverlay />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens overlay on ? press', () => {
    render(<ShortcutsOverlay />);
    
    act(() => {
      fireEvent.keyDown(window, { key: '?' });
    });
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('closes overlay on Esc press', async () => {
    render(<ShortcutsOverlay />);
    
    act(() => {
      fireEvent.keyDown(window, { key: '?' });
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes overlay when clicking the overlay background', async () => {
    render(<ShortcutsOverlay />);
    act(() => {
      fireEvent.keyDown(window, { key: '?' });
    });
    
    const dialog = screen.getByRole('dialog');
    act(() => {
      fireEvent.click(dialog);
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes overlay when clicking the close button', async () => {
    render(<ShortcutsOverlay />);
    act(() => {
      fireEvent.keyDown(window, { key: '?' });
    });
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    act(() => {
      fireEvent.click(closeButton);
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('does not close overlay when clicking inside the content', async () => {
    render(<ShortcutsOverlay />);
    act(() => {
      fireEvent.keyDown(window, { key: '?' });
    });
    
    const content = screen.getByText('Keyboard Shortcuts');
    act(() => {
      fireEvent.click(content);
    });
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('ignores ? press inside editable elements', () => {
    render(
      <div>
        <input type="text" data-testid="input" />
        <textarea data-testid="textarea" />
        <select data-testid="select"><option>1</option></select>
        <div contentEditable={true} suppressContentEditableWarning={true} data-testid="contenteditable">edit me</div>
        <ShortcutsOverlay />
      </div>
    );
    
    const input = screen.getByTestId('input');
    act(() => {
      fireEvent.keyDown(input, { key: '?' });
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    
    const textarea = screen.getByTestId('textarea');
    act(() => {
      fireEvent.keyDown(textarea, { key: '?' });
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    
    const select = screen.getByTestId('select');
    act(() => {
      fireEvent.keyDown(select, { key: '?' });
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    
    const contenteditable = screen.getByTestId('contenteditable');
    // JSDOM sometimes fails isContentEditable, so we can mock it on the node
    Object.defineProperty(contenteditable, 'isContentEditable', { value: true });
    
    act(() => {
      fireEvent.keyDown(contenteditable, { key: '?' });
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ignores ? press with modifier keys', () => {
    render(<ShortcutsOverlay />);
    
    act(() => {
      fireEvent.keyDown(window, { key: '?', metaKey: true });
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    
    act(() => {
      fireEvent.keyDown(window, { key: '?', ctrlKey: true });
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    
    act(() => {
      fireEvent.keyDown(window, { key: '?', altKey: true });
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('toggles overlay via custom event', async () => {
    render(<ShortcutsOverlay />);
    
    act(() => {
      window.dispatchEvent(new CustomEvent('contextweaver:shortcuts'));
    });
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    act(() => {
      window.dispatchEvent(new CustomEvent('contextweaver:shortcuts'));
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
