interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  centered?: boolean;
  className?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  badge,
  centered = false,
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`mb-10 ${centered ? 'text-center max-w-2xl mx-auto' : 'max-w-3xl'} ${className}`}>
      {badge && (
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold tracking-wider text-[#0B5D3B] uppercase">
          <span className="w-6 h-[2px] bg-[#C8A951]"></span>
          <span>{badge}</span>
        </div>
      )}
      <h2 className="text-3xl md:text-4xl font-serif-title font-bold text-[#063B27] tracking-tight mb-3">
        {title}
      </h2>
      {subtitle && (
        <p className="text-base md:text-lg text-[#66736B] leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
