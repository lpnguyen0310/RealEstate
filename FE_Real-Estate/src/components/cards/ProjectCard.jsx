// src/components/cards/ProjectCard.jsx
export default function ProjectCard({ project }) {
  return (
    <a
      href={`/du-an/${project.id}`}
      className="block group rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition"
    >
      {/* Chọn chiều cao cố định theo breakpoint để không bị “lùn” */}
      <div className="relative w-full h-[260px] md:h-[300px] lg:h-[480px]">
        <img
          src={project.image}
          alt={project.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          onError={(e) => (e.currentTarget.src = 'https://picsum.photos/1200/800')}
        />
        {/* gradient đáy */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        {/* text */}
        <div className="absolute left-5 right-5 bottom-5 text-white">
          <h3 className="text-[18px] md:text-[20px] lg:text-[22px] font-extrabold leading-snug group-hover:underline">
            {project.name}
          </h3>
          <p className="mt-2 text-white/90 text-[14px] md:text-[15px] line-clamp-2">
            {project.address}
          </p>
        </div>
      </div>
    </a>
  );
}
