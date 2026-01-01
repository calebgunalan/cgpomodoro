import { useState } from 'react';
import { Task } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Layers, Plus, X, ChevronDown, ChevronRight } from 'lucide-react';

interface TaskBatchingProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onUpdateCategory: (taskId: string, category: string | null) => void;
  selectedTaskId?: string;
}

const PRESET_CATEGORIES = [
  { name: 'Deep Work', color: 'bg-violet-500' },
  { name: 'Meetings', color: 'bg-blue-500' },
  { name: 'Admin', color: 'bg-amber-500' },
  { name: 'Creative', color: 'bg-pink-500' },
  { name: 'Learning', color: 'bg-emerald-500' },
  { name: 'Planning', color: 'bg-cyan-500' },
];

export function TaskBatching({ tasks, onSelectTask, onUpdateCategory, selectedTaskId }: TaskBatchingProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['uncategorized']));
  const [showAddCategory, setShowAddCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');

  // Group tasks by category
  const groupedTasks = tasks.reduce((acc, task) => {
    const category = (task as any).category || 'uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const categories = Object.keys(groupedTasks).sort((a, b) => {
    if (a === 'uncategorized') return 1;
    if (b === 'uncategorized') return -1;
    return a.localeCompare(b);
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleAddCategory = (taskId: string) => {
    if (newCategory.trim()) {
      onUpdateCategory(taskId, newCategory.trim());
      setNewCategory('');
      setShowAddCategory(null);
    }
  };

  const getCategoryColor = (category: string) => {
    const preset = PRESET_CATEGORIES.find(c => c.name.toLowerCase() === category.toLowerCase());
    return preset?.color || 'bg-secondary';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Task Batching
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Category presets */}
        <div className="flex flex-wrap gap-1 mb-3">
          {PRESET_CATEGORIES.map((cat) => (
            <Badge
              key={cat.name}
              variant="outline"
              className={cn(
                'cursor-pointer text-xs',
                categories.includes(cat.name) && 'opacity-50'
              )}
            >
              <span className={cn('w-2 h-2 rounded-full mr-1', cat.color)} />
              {cat.name}
            </Badge>
          ))}
        </div>

        {/* Grouped tasks */}
        {categories.map((category) => (
          <div key={category} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              {expandedCategories.has(category) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span
                className={cn('w-3 h-3 rounded-full', getCategoryColor(category))}
              />
              <span className="font-medium text-sm flex-1 text-left capitalize">
                {category === 'uncategorized' ? 'No Category' : category}
              </span>
              <Badge variant="secondary" className="text-xs">
                {groupedTasks[category].length}
              </Badge>
            </button>

            {expandedCategories.has(category) && (
              <div className="p-1 space-y-1">
                {groupedTasks[category].map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer',
                      selectedTaskId === task.id
                        ? 'bg-primary/20'
                        : 'hover:bg-secondary/30'
                    )}
                  >
                    <button
                      onClick={() => onSelectTask(task)}
                      className="flex-1 flex items-center gap-2 text-left"
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: task.color }}
                      />
                      <span className="text-sm truncate">{task.name}</span>
                      {task.estimated_pomodoros && (
                        <span className="text-xs text-muted-foreground">
                          {task.completed_pomodoros}/{task.estimated_pomodoros}
                        </span>
                      )}
                    </button>

                    {showAddCategory === task.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="Category"
                          className="h-7 w-24 text-xs"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddCategory(task.id);
                            if (e.key === 'Escape') setShowAddCategory(null);
                          }}
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-6 h-6"
                          onClick={() => handleAddCategory(task.id)}
                        >
                          ✓
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-6 h-6"
                          onClick={() => setShowAddCategory(null)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-6 h-6"
                        onClick={() => setShowAddCategory(task.id)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {tasks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No tasks yet. Add tasks to batch them by category.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
