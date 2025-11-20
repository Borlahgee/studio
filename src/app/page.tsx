"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Palette,
  BookOpen,
  Sparkles,
  LoaderCircle,
  Info
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getPrioritizedTasks, getSuggestedTimes } from "@/app/actions";
import { days as initialDaysData, categories, categoryFilters } from "@/lib/data";
import type { Task, Day, CategoryType } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


export default function TimetablePage() {
  const [isClient, setIsClient] = useState(false);
  const [tasks, setTasks] = useState<Record<string, Partial<Task>>>({});
  const [filter, setFilter] = useState<CategoryType | "all">("all");
  const [week] = useState(1);
  const [isLoadingAi, setIsLoadingAi] = useState<"priority" | "time" | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    try {
      const savedTasks = JSON.parse(localStorage.getItem("schedule-ai-tasks") || "{}");
      setTasks(savedTasks);
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    } catch (error) {
      console.error("Failed to parse tasks from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("schedule-ai-tasks", JSON.stringify(tasks));
    }
  }, [tasks, isClient]);

  useEffect(() => {
    if (!isClient || Notification.permission !== "granted") return;

    const interval = setInterval(() => {
      const now = new Date();
      const allItems = initialDaysData.flatMap((d) => d.items);
      allItems.forEach((item) => {
        const taskData = tasks[item.id];
        if (taskData?.datetime && !taskData.notified && !taskData.done) {
          const taskTime = new Date(taskData.datetime);
          const timeDifference = (taskTime.getTime() - now.getTime()) / 1000;
          if (timeDifference > 0 && timeDifference <= 300) {
            new Notification(`Upcoming Task: ${item.task}`, {
              body: `Starts at ${taskTime.toLocaleTimeString()}`,
              icon: '/favicon.ico'
            });
            setTasks((prev) => ({
              ...prev,
              [item.id]: { ...prev[item.id], notified: true },
            }));
          }
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [tasks, isClient]);

  const toggleDone = (id: string) => {
    setTasks((prev) => ({
      ...prev,
      [id]: { ...prev[id], done: !prev[id]?.done },
    }));
  };

  const setDateTime = (id: string, datetime: Date | undefined) => {
    if (!datetime) {
       const { [id]: task, ...rest } = tasks;
       const { datetime: dt, ...taskRest } = task || {};
       setTasks({ ...rest, [id]: taskRest });
       return;
    }
    
    if (isNaN(datetime.getTime())) {
        console.error("Invalid date provided to setDateTime for task ID:", id);
        return;
    }

    setTasks((prev) => ({
      ...prev,
      [id]: { ...prev[id], datetime: datetime.toISOString() },
    }));
  };
  
  const allItems = useMemo(() => initialDaysData.flatMap(d => d.items), []);

  const getCompletion = useCallback((items: Task[]) => {
    if (items.length === 0) return 0;
    const doneCount = items.filter(i => tasks[i.id]?.done).length;
    return (doneCount / items.length) * 100;
  }, [tasks]);
  
  const weekCompletion = useMemo(() => getCompletion(allItems), [allItems, getCompletion]);

  const handleAiAction = async (type: "priority" | "time") => {
    setIsLoadingAi(type);
    const allTasksWithState = allItems.map(item => ({...item, ...tasks[item.id]}));
    
    try {
      const result = type === 'priority' 
        ? await getPrioritizedTasks(allTasksWithState)
        : await getSuggestedTimes(allTasksWithState);
      
      const newTasksState = {...tasks};
      result.forEach(task => {
        newTasksState[task.id] = {
            done: task.done,
            datetime: task.datetime,
            notified: task.notified,
            priority: task.priority,
            reason: task.reason,
        };
      });
      setTasks(newTasksState);
      toast({
        title: `✅ AI Optimization Complete`,
        description: type === 'priority' ? "Your tasks have been re-prioritized." : "New optimal times have been suggested for your tasks.",
      });
    } catch (error) {
      console.error(`AI ${type} error:`, error);
      toast({
        variant: "destructive",
        title: "🚫 AI Optimization Failed",
        description: `Could not ${type === 'priority' ? 'prioritize tasks' : 'suggest times'}. Please try again.`,
      });
    } finally {
      setIsLoadingAi(null);
    }
  };

  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoaderCircle className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-background">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline text-foreground">
              Week {week} Schedule
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Progress value={weekCompletion} className="w-40 h-2" />
              <span className="text-sm font-medium text-muted-foreground">
                {weekCompletion.toFixed(0)}% Complete
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" onClick={() => handleAiAction('priority')} disabled={!!isLoadingAi}>
                {isLoadingAi === 'priority' ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
                Prioritize
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleAiAction('time')} disabled={!!isLoadingAi}>
                {isLoadingAi === 'time' ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
                Suggest Times
              </Button>
            <ThemeToggle />
          </div>
        </header>

        <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {categoryFilters.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="capitalize">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {initialDaysData.map((d) => {
            const filteredItems = d.items.filter(i => filter === 'all' || i.type === filter);
            
            let sortedItems = filteredItems.map(item => ({...item, ...tasks[item.id]}));
            sortedItems.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

            const dayCompletion = getCompletion(d.items);

            return (
              <motion.div
                key={d.day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center text-xl font-headline">
                      <span>{d.day}</span>
                      <span className="text-sm font-normal text-muted-foreground">{dayCompletion.toFixed(0)}%</span>
                    </CardTitle>
                    <Progress value={dayCompletion} className="h-1 mt-1" />
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="space-y-3">
                      <AnimatePresence>
                        {sortedItems.length > 0 ? (
                          sortedItems.map((item) => (
                            <TaskItem
                              key={item.id}
                              item={item}
                              onToggleDone={() => toggleDone(item.id)}
                              onSetDateTime={(date) => setDateTime(item.id, date)}
                            />
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-8">No tasks for this filter.</p>
                        )}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}

interface TaskItemProps {
  item: Task;
  onToggleDone: () => void;
  onSetDateTime: (date: Date | undefined) => void;
}

const TaskItem = ({ item, onToggleDone, onSetDateTime }: TaskItemProps) => {
  const CategoryIcon = categories[item.type]?.icon || BrainCircuit;
  const categoryStyle = categories[item.type]?.style || "";

  const [date, setDate] = useState<Date | undefined>(item.datetime ? new Date(item.datetime) : undefined);
  const [time, setTime] = useState<string>(item.datetime ? new Date(item.datetime).toTimeString().substring(0, 5) : "09:00");

  useEffect(() => {
    if (item.datetime) {
      const d = new Date(item.datetime);
      if (!isNaN(d.getTime())) {
        setDate(d);
        setTime(d.toTimeString().substring(0, 5));
      }
    }
  }, [item.datetime]);

  useEffect(() => {
    if (!date) {
      onSetDateTime(undefined);
      return;
    }
    const [hours, minutes] = time.split(':').map(Number);
    const newDateTime = new Date(date);
    newDateTime.setHours(hours, minutes, 0, 0);
    onSetDateTime(newDateTime);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, time]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "p-3 rounded-lg border text-sm flex items-start gap-3 transition-all",
        categoryStyle,
        item.done && "opacity-50"
      )}
    >
      <div className="flex-shrink-0 pt-0.5">
        <Checkbox checked={!!item.done} onCheckedChange={onToggleDone} id={`task-${item.id}`} />
      </div>
      <div className="flex-grow space-y-1">
        <label htmlFor={`task-${item.id}`} className={cn("font-medium", item.done && "line-through")}>{item.task}</label>
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <CategoryIcon className="w-3 h-3" />
          <span className="capitalize">{item.type}</span>
          <span>&bull;</span>
          <span>{item.time}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
         {item.reason && (
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-accent-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{item.reason}</p>
            </TooltipContent>
          </Tooltip>
        )}
        {item.priority !== undefined && (
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary-foreground text-xs font-bold">
            {item.priority}
          </div>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Palette className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
            <div className="p-3 border-t">
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </motion.div>
  );
};
