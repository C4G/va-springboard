export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='flex items-center justify-between border-t px-4 py-6'>
      <p className='text-sm'>
        © {currentYear} VA-Partners and C4G Collaboration.
      </p>
    </footer>
  );
}
