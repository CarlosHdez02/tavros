"use client";

import TavrosService from "@/services/tavros.service";
import type { CarouselData } from "@/types/components.type";
import { useQuery } from "@tanstack/react-query";

const tavrosService = new TavrosService();

export type { CarouselRow } from "@/types/components.type";

export const useCarouselData = () => {
  return useQuery({
    queryKey: ["carousel-data"],
    queryFn: ({ signal }) => tavrosService.getCarouselData(signal),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    retry: process.env.NODE_ENV === "test" ? 0 : 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};
