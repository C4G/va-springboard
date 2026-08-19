'use client';
import * as React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { UserMenu } from './user-menu';
import Image from 'next/image';

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';

import { isKnownRole } from '@/utils/role';

const NAVIGATION_LINKS = [
  {
    href: '/schools?view=table',
    label: 'Schools',
    allowedRoles: ['ADMIN'],
  },
  {
    href: '/students?view=table',
    label: 'Students',
    allowedRoles: ['ADMIN', 'STAFF'],
  },
  {
    href: '/studentTraining?view=table',
    label: 'Student Training',
    allowedRoles: ['ADMIN', 'STAFF'],
  },
  {
    href: '/beneficiary?view=table',
    label: 'Student Devices',
    allowedRoles: ['ADMIN', 'STAFF'],
  },
  {
    href: '/grants?view=table',
    label: 'Grants',
    allowedRoles: ['ADMIN', 'STAFF'],
  },
  {
    href: '/training-program?view=table',
    label: 'Training Programs',
    allowedRoles: ['ADMIN', 'STAFF'],
  },
  {
    href: '/devices?view=table',
    label: 'Devices',
    allowedRoles: ['ADMIN', 'STAFF'],
  },
  {
    href: '/reports?view=unified',
    label: 'Reports',
    allowedRoles: ['ADMIN', 'STAFF', 'READ_ONLY'],
  },
  {
    href: '/users',
    label: 'Users',
    allowedRoles: ['ADMIN'],
  },
];

export function Header() {
  const { data: session } = useSession();
  const role = session?.user?.role || '';
  const [menuOpen, setMenuOpen] = React.useState(false);

  const visibleLinks = isKnownRole(role)
    ? NAVIGATION_LINKS.filter((link) => link.allowedRoles.includes(role))
    : [];
  const showNavigation = visibleLinks.length > 0;

  return (
    <>
      <header className='fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b bg-background px-4 py-4 md:px-6'>
        <div className='flex items-center gap-4'>
          {showNavigation && (
            <button
              type='button'
              className='rounded-md border px-3 py-2 text-sm font-medium lg:hidden'
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          )}

          <Link href='/' className='flex items-center'>
            <Image
              src='/vision-aid-logo-trns.png'
              alt='Computing for good'
              width='32'
              height='32'
            />
          </Link>

          {showNavigation && (
            <NavigationMenu className='hidden lg:flex'>
              <NavigationMenuList>
                {visibleLinks.map((link) => (
                  <NavigationMenuItem key={link.href}>
                    <Link href={link.href} legacyBehavior passHref>
                      <NavigationMenuLink
                        className={navigationMenuTriggerStyle()}
                      >
                        {link.label}
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          )}
        </div>

        <div className='flex items-center'>
          <UserMenu />
        </div>
      </header>

      {showNavigation && menuOpen && (
        <nav
          id='mobile-navigation'
          className='fixed left-0 right-0 top-16 z-40 border-b bg-background px-4 py-2 lg:hidden'
        >
          <ul className='flex flex-col'>
            {visibleLinks.map((link) => (
              <li key={`mobile-${link.href}`}>
                <Link
                  href={link.href}
                  className='block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent'
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
