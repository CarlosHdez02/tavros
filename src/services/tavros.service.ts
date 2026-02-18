import type { CarouselData } from "@/types/components.type";

export default class TavrosService {
  private readonly apiUrl = "/api/videos";

  async getCarouselData(signal?: AbortSignal): Promise<CarouselData> {
    try {
      const response = await fetch(this.apiUrl, { signal });

      if (!response.ok) {
        throw new Error("Failed to fetch carousel data");
      }

      const json = await response.json().catch(() => ({}));

      if (!json.success || !json.data) {
        throw new Error("Invalid response format");
      }

      const { data } = json;
      if (!Array.isArray(data.all)) {
        throw new Error("Invalid response format");
      }

      return data as CarouselData;
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("Invalid")) {
        throw err;
      }
      throw new Error("Failed to fetch carousel data");
    }
  }
}
