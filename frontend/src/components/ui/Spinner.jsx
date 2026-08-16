export default function Spinner({ className = 'h-10 w-10' }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className={`${className} animate-spin rounded-full border-4 border-brand-500/20 border-t-brand-500`} />
    </div>
  );
}
