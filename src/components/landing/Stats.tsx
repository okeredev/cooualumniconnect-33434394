const stats = [
  { value: "48k+", label: "Active alumni worldwide" },
  { value: "$4.2M", label: "Raised through campaigns" },
  { value: "12k", label: "Mentorship hours logged" },
  { value: "97%", label: "Members would recommend" },
];

export const Stats = () => {
  return (
    <section className="py-20 bg-gradient-hero text-primary-foreground relative overflow-hidden grain">
      <div className="absolute inset-0 bg-gradient-radial opacity-50" />
      <div className="container relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center lg:text-left">
              <div className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-gold">{s.value}</div>
              <div className="mt-2 text-sm text-primary-foreground/70 max-w-[180px] mx-auto lg:mx-0">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
