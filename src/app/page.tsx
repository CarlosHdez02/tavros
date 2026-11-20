import CarrouselWrapper from "@/components/Carroussel.component";
import { TableErrorBoundary } from "@/components/TableErrorBoundary";
import TvHealthMonitor from "@/components/TvHealthMonitor";

export default function Home() {
  return (
    <>
      {/* Outside the boundary so monitoring survives carousel crashes */}
      <TvHealthMonitor />
      <TableErrorBoundary>
        <div
          className="min-h-screen w-full bg-[#0f1419]"
          style={{ minHeight: "100vh" }}
        >
          <CarrouselWrapper />
        </div>
      </TableErrorBoundary>
    </>
  );
}
