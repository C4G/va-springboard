/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function CaseStoryInput({
  caseStories,
  setCaseStories,
}: {
  caseStories: any[];
  setCaseStories: (stories: any[]) => void;
}) {
  const [studentName, setStudentName] = React.useState('');
  const [story, setStory] = React.useState('');

  const addStory = () => {
    if (!studentName || !story) return;
    setCaseStories([...caseStories, { Student: studentName, Story: story }]);
    setStudentName('');
    setStory('');
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-2'>
        <Input
          placeholder='Student Name'
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
        />
        <Textarea
          placeholder='Case Story'
          value={story}
          onChange={(e) => setStory(e.target.value)}
        />
        <Button onClick={addStory}>Add Case Story</Button>
      </div>
      <div className='mt-4 space-y-2'>
        {caseStories.map((story, idx) => (
          <div key={idx} className='rounded border p-2'>
            <strong>{story.Student}</strong>: {story.Story}
          </div>
        ))}
      </div>
    </div>
  );
}

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className='w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500'
    {...props}
  />
);
