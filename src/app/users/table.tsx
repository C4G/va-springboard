'use client';

import React, { useEffect, useState } from 'react';
import { User } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { Pencil } from 'lucide-react';

export function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [schools, setSchools] = React.useState<{ id: string; Name: string }[]>(
    []
  );

  React.useEffect(() => {
    async function fetchSchools() {
      try {
        const response = await fetch('/api/schools');
        if (!response.ok) throw new Error('Failed to fetch schools');
        const data = await response.json();
        setSchools(data);
      } catch (error) {
        console.error(' Error fetching schools:', error);
      }
    }
    fetchSchools();
  }, []);
  const pageSize = 10;

  useEffect(() => {
    async function fetchUsers() {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    }

    fetchUsers();
  }, []);

  const totalPages = Math.ceil(users.length / pageSize);
  const paginatedUsers = users.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );

  const handleDelete = async (userId: string) => {
    const confirmed = confirm('Are you sure you want to delete this user?');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        console.error('Failed to delete user');
        alert('Something went wrong');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  return (
    <div>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>User List</h2>
        <Link href='/users?view=create'>
          <Button>Add User</Button>
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>School Name</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.name || '—'}</TableCell>
              <TableCell>{user.role || '—'}</TableCell>
              <TableCell>
                {schools.find((s) => s.id === user.schoolId)?.Name || '—'}
              </TableCell>
              <TableCell>
                <div className='flex gap-2'>
                  <Link href={`/users?view=edit&id=${user.id}`}>
                    <Button variant='outline' size='sm'>
                      <Pencil className='mr-1 h-4 w-4' />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={() => handleDelete(user.id)}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className='mt-4 flex items-center justify-center gap-6'>
        <Button
          onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
          disabled={pageIndex === 0}
        >
          Previous
        </Button>
        <span>
          Page {pageIndex + 1} of {totalPages}
        </span>
        <Button
          onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
          disabled={pageIndex >= totalPages - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
