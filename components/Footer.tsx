import { DEVELOPERS } from '@/lib/developers';

export default function Footer() {
  return (
    <footer className="border-t border-black bg-[#FAFAFA]">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <p className="font-mono font-bold">{'// NestLiving'}</p>

        <p className="text-neutral-600">
          Designed &amp; developed by{' '}
          {DEVELOPERS.map((developer, index) => (
            <span key={developer.name}>
              {/* "A, B & C" style separators */}
              {index > 0 && (index === DEVELOPERS.length - 1 ? ' & ' : ', ')}
              <a
                href={developer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-black underline"
              >
                {developer.name}
              </a>
            </span>
          ))}
        </p>

        <p className="text-neutral-500">© {new Date().getFullYear()} NestLiving</p>
      </div>
    </footer>
  );
}