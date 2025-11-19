import type { Day, CategoryType } from '@/lib/types';
import { BrainCircuit, Palette, BookOpen, Coffee, MoreHorizontal, type LucideIcon } from 'lucide-react';

export const days: Day[] = [
  { day: "Monday", items: [
    { time: "9:00–11:00", task: "Python Data Structures", type: "python", id: "mon1" },
    { time: "12:00–2:00", task: "User Persona Workshop", type: "uiux", id: "mon2" },
    { time: "2:00-3:00", task: "Lunch Break", type: "break", id: "mon-break"}
  ]},
  { day: "Tuesday", items: [
    { time: "9:00–11:00", task: "Python Algorithms Practice", type: "python", id: "tue1" },
    { time: "12:00–2:00", task: "UI/UX Prototyping in Figma", type: "uiux", id: "tue2" },
    { time: "3:00–5:00", task: "Project Architecture Lecture", type: "lectures", id: "tue3" },
  ]},
  { day: "Wednesday", items: [
    { time: "9:00–11:00", task: "Python API Integration", type: "python", id: "wed1" },
    { time: "12:00–1:30", task: "UI/UX Wireframing", type: "uiux", id: "wed2" },
    { time: "2:00-3:00", task: "Walk and Coffee", type: "break", id: "wed-break"}
  ]},
  { day: "Thursday", items: [
    { time: "1:00–2:00", task: "Design System Review", type: "uiux", id: "thu1" },
    { time: "2:00–5:00", task: "Advanced Topics Lectures", type: "lectures", id: "thu2" },
    { time: "5:00-5:30", task: "Team Sync", type: "misc", id: "thu3"}
  ]},
  { day: "Friday", items: [
    { time: "9:00–11:00", task: "Python Final Project", type: "python", id: "fri1" },
    { time: "12:00–2:00", task: "High-Fidelity UI Polish", type: "uiux", id: "fri2" },
    { time: "2:00–4:00", task: "Submit Weekly Report", type: "misc", id: "fri3" },
  ]},
];

interface CategoryConfig {
    icon: LucideIcon;
    style: string;
}

export const categories: Record<CategoryType, CategoryConfig> = {
  python: { 
    icon: BrainCircuit,
    style: "bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-300"
  },
  uiux: { 
    icon: Palette,
    style: "bg-pink-500/10 border-pink-500/30 text-pink-800 dark:text-pink-300"
  },
  lectures: { 
    icon: BookOpen,
    style: "bg-green-500/10 border-green-500/30 text-green-800 dark:text-green-300"
  },
  break: { 
    icon: Coffee,
    style: "bg-stone-500/10 border-stone-500/30 text-stone-800 dark:text-stone-400"
  },
  misc: { 
    icon: MoreHorizontal,
    style: "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
  },
};

export const categoryFilters: CategoryType[] = ['python', 'uiux', 'lectures', 'break', 'misc'];
