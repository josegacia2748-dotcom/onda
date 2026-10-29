import type { Album } from "../data/catalog";

type Props = {
  album: Pick<Album, "from" | "to" | "title">;
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
};

export const Cover = ({ album, size = "md", className = "" }: Props) => (
  <div
    className={`cover cover-${size} ${className}`.trim()}
    style={{ backgroundImage: `linear-gradient(145deg, ${album.from}, ${album.to})` }}
    aria-hidden="true"
  >
    <span className="cover-ring" />
    <span className="cover-mark">{album.title.slice(0, 1)}</span>
  </div>
);
