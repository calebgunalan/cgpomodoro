import { useState } from 'react';
import { Plus, Tag, X, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Task } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

interface TaskSelectorProps {
  tasks: Task[];
  selectedTask: Task | null;
  onSelect: (task: Task | null) => void;
  onAdd: (name: string, color: string, estimatedPomodoros?: number) => Promise<Task | null>;
  onUpdateEstimate?: (id: string, estimate: number | null) => Promise<void>;
  disabled?: boolean;
}

const COLORS = [
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#EF4444', // Red
  '#14B8A6', // Teal
];

export function TaskSelector({ tasks, selectedTask, onSelect, onAdd, onUpdateEstimate, disabled }: TaskSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskColor, setNewTaskColor] = useState(COLORS[0]);
  const [newTaskEstimate, setNewTaskEstimate] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<string | null>(null);
  const [estimateValue, setEstimateValue] = useState('');

  const handleAdd = async () => {
    if (!newTaskName.trim()) return;
    
    const estimate = newTaskEstimate ? parseInt(newTaskEstimate, 10) : undefined;
    const task = await onAdd(newTaskName.trim(), newTaskColor, estimate);
    if (task) {
      onSelect(task);
      setNewTaskName('');
      setNewTaskEstimate('');
      setShowAdd(false);
      setIsOpen(false);
    }
  };

  const handleUpdateEstimate = async (taskId: string) => {
    if (!onUpdateEstimate) return;
    const estimate = estimateValue ? parseInt(estimateValue, 10) : null;
    await onUpdateEstimate(taskId, estimate);
    setEditingEstimate(null);
    setEstimateValue('');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="gap-2 bg-secondary/50 border-border/50"
        >
          {selectedTask ? (
            <>
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedTask.color }}
              />
              <span className="max-w-[120px] truncate">{selectedTask.name}</span>
              {selectedTask.estimated_pomodoros && (
                <span className="text-xs text-muted-foreground">
                  {selectedTask.completed_pomodoros}/{selectedTask.estimated_pomodoros}
                </span>
              )}
            </>
          ) : (
            <>
              <Tag className="w-4 h-4" />
              <span>Select task</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="center">
        {showAdd ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">New Task</span>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={() => setShowAdd(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Input
              placeholder="Task name"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              className="bg-secondary/50"
              autoFocus
            />
            <div className="flex gap-2 items-center">
              <Target className="w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Est. pomodoros (optional)"
                value={newTaskEstimate}
                onChange={(e) => setNewTaskEstimate(e.target.value)}
                className="bg-secondary/50"
                min={1}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewTaskColor(color)}
                  className={cn(
                    'w-6 h-6 rounded-full transition-transform',
                    newTaskColor === color && 'ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Button onClick={handleAdd} className="w-full" size="sm">
              Add Task
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            <button
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                !selectedTask ? 'bg-secondary' : 'hover:bg-secondary/50'
              )}
            >
              <span className="w-3 h-3 rounded-full bg-muted-foreground/30" />
              <span>No task</span>
            </button>
            
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-1">
                <button
                  onClick={() => {
                    onSelect(task);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex-1 flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                    selectedTask?.id === task.id ? 'bg-secondary' : 'hover:bg-secondary/50'
                  )}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: task.color }}
                  />
                  <span className="truncate flex-1 text-left">{task.name}</span>
                  {task.estimated_pomodoros !== null && (
                    <span className={cn(
                      'text-xs shrink-0',
                      task.completed_pomodoros >= task.estimated_pomodoros
                        ? 'text-emerald-400'
                        : 'text-muted-foreground'
                    )}>
                      {task.completed_pomodoros}/{task.estimated_pomodoros}
                    </span>
                  )}
                </button>
                {editingEstimate === task.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={estimateValue}
                      onChange={(e) => setEstimateValue(e.target.value)}
                      className="w-16 h-8 text-xs"
                      min={1}
                      placeholder="Est."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateEstimate(task.id);
                        if (e.key === 'Escape') setEditingEstimate(null);
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-6 h-6"
                      onClick={() => handleUpdateEstimate(task.id)}
                    >
                      ✓
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-6 h-6 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingEstimate(task.id);
                      setEstimateValue(task.estimated_pomodoros?.toString() || '');
                    }}
                  >
                    <Target className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
            
            <button
              onClick={() => setShowAdd(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add new task</span>
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
