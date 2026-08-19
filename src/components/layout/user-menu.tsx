'use client';

import { useState } from 'react';
import { signOut, signIn, useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditProfileDialog } from './edit-profile-dialog';
import { ThemeSwitcher } from './theme-switcher';
import { DropdownMenuSeparator } from '@radix-ui/react-dropdown-menu';
import { LogOut, UserCog } from 'lucide-react';

export function UserMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  if (!session) {
    return <Button onClick={() => signIn()}>Sign In</Button>;
  }
  const userInitials = session.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?';

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
            <Avatar className='h-8 w-8'>
              <AvatarImage
                src={session.user?.image ?? ''}
                alt={session.user?.name ?? ''}
              />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className='w-max min-w-32 max-w-64'
          align='end'
          forceMount
        >
          <DropdownMenuItem
            className='cursor-pointer'
            onSelect={() => setIsEditProfileOpen(true)}
          >
            <UserCog className='h-4 w-4' />
            <span className='grow'>Edit Profile</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <ThemeSwitcher />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className='cursor-pointer'
            onSelect={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className='h-4 w-4' />
            <span className='grow'>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditProfileDialog
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </>
  );
}
