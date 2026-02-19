import CarrouselWrapper from "@/components/Carroussel.component";
import { TableErrorBoundary } from "@/components/TableErrorBoundary";

export default function Home() {
  return (
    <TableErrorBoundary>
      <div
        className="min-h-screen w-full bg-[#0f1419]"
        style={{ minHeight: "100vh" }}
      >
        <CarrouselWrapper />
      </div>
    </TableErrorBoundary>
  );
}
