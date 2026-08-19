'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const tabs = [
  { name: 'Team', href: '/team' },
  { name: 'Project Description', href: '/team/project-description' },
  { name: 'Project Goal', href: '/team/project-goal' },
  { name: 'Lighthouse Report', href: '/team/lighthouse-report' },
  { name: 'Presentation Slides', href: '/team/presentation-slides' },
  { name: 'Weekly Updates', href: '/team/weekly-updates' },
  { name: 'Project Peer Evaluations', href: '/team/peer-evaluations' },
  { name: 'Demo', href: '/team/demo' },
];

export function TeamTabs() {
  const pathname = usePathname();

  return (
    <Tabs value={pathname} className='flex w-full justify-center'>
      <TabsList className='inline-flex h-10 max-w-full items-center justify-center overflow-x-auto rounded-md bg-muted p-1 text-muted-foreground'>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.href}
            value={tab.href}
            className='inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm'
            asChild
          >
            <Link href={tab.href}>{tab.name}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
