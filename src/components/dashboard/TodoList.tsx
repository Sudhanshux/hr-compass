import React, { useState } from 'react';
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

const initialTodos: Todo[] = [
  { id: '1', text: 'Review team leave requests', done: false },
  { id: '2', text: 'Submit monthly report', done: false },
  { id: '3', text: 'Complete compliance training', done: true },
  { id: '4', text: 'Update project documentation', done: false },
];

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [newText, setNewText] = useState('');

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
          {todos.map(t => (
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodoList;
