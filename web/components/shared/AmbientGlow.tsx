export function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute top-[-12%] left-1/2 h-[560px] w-[1200px] -translate-x-1/2 rounded-full bg-[rgba(var(--brand-rgb),0.16)] blur-[120px]" />
      <div className="absolute top-[25%] right-[-15%] h-[480px] w-[620px] rounded-full bg-[rgba(var(--brand-rgb),0.1)] blur-[110px]" />
      <div className="absolute bottom-[-10%] left-[-15%] h-[480px] w-[620px] rounded-full bg-[rgba(var(--brand-rgb),0.08)] blur-[110px]" />
    </div>
  );
}
