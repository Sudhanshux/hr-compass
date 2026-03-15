import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ListTodo, Plus, Trash2 } from 'lucide-react';

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

const STORAGE_KEY = 'hrms_todos';

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTodos(todos: Todo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

const TodoList: React.FC = () => {
  const [todos,   setTodos]   = useState<Todo[]>(loadTodos);
  const [newText, setNewText] = useState('');

  // Persist on every change
  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const add = () => {
    if (!newText.trim()) return;
    setTodos(prev => [...prev, { id: Date.now().toString(), text: newText.trim(), done: false }]);
    setNewText('');
  };

  const toggle = (id: string) =>
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const remove = (id: string) =>
    setTodos(prev => prev.filter(t => t.id !== id));

  const done = todos.filter(t => t.done).length;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ListTodo size={18} className="text-primary" /> To-Do List
          </CardTitle>
          <span className="text-xs text-muted-foreground">{done}/{todos.length} done</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Add a task..."
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            className="h-9 text-sm"
          />
          <Button size="sm" onClick={add} className="h-9 px-3"><Plus size={14} /></Button>
        </div>
        <div className="space-y-1 max-h-[250px] overflow-y-auto">
          {todos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No tasks yet. Add one above.</p>
          ) : (
            todos.map(t => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50 group">
                <Checkbox checked={t.done} onCheckedChange={() => toggle(t.id)} />
                <span className={`flex-1 text-sm ${t.done ? 'line-through text-muted-foreground' : ''}`}>{t.text}</span>
                <button
                  onClick={() => remove(t.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodoList;
