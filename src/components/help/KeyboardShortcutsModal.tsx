import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  { category: 'Navigation', items: [
    { keys: ['1'], description: 'Go to Timer' },
    { keys: ['2'], description: 'Go to Stats' },
    { keys: ['3'], description: 'Go to History' },
    { keys: ['4'], description: 'Go to Badges' },
    { keys: ['5'], description: 'Go to Insights' },
    { keys: ['6'], description: 'Go to Apps' },
    { keys: ['7'], description: 'Go to Team' },
    { keys: ['['], description: 'Previous tab' },
    { keys: [']'], description: 'Next tab' },
  ]},
  { category: 'Timer Controls', items: [
    { keys: ['Space'], description: 'Start/Pause timer' },
    { keys: ['R'], description: 'Reset timer' },
    { keys: ['S'], description: 'Skip session' },
  ]},
  { category: 'General', items: [
    { keys: ['?'], description: 'Show this help' },
  ]},
];

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key) => (
                        <kbd
                          key={key}
                          className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded border border-border">Esc</kbd> to close
        </p>
      </DialogContent>
    </Dialog>
  );
}
