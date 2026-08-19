export default function UnauthorizedPage() {
  return (
    <div className='flex min-h-screen items-center justify-center p-8 text-center'>
      <div className='space-y-4'>
        <h1 className='text-3xl font-bold text-red-600'>Access Denied</h1>
        <p className='text-lg'>
          Unfortunately, your email is not on the approved user list.
          <br />
          Please contact an admin to get added as a user.
        </p>
      </div>
    </div>
  );
}
