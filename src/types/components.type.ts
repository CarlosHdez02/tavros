export type RowType = 'table' | 'video' | 'gallery';

export interface CarouselRow {
  id: number;
  type: RowType;
  title: string;
  description: string;
  youtubeLink?: string;
  durationSeconds?: number;
}
export interface CarouselData{
    table:CarouselRow[];
    videos:CarouselRow[];
    gallery:CarouselRow[];
    all:CarouselRow[];
}