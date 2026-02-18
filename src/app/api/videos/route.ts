import { NextResponse } from "next/server";
import Papa from 'papaparse';
import { DURATION_KEYS } from "@/constants/carrousel.constant";
 export type rowType = 'table' | 'video' | 'gallery'
export interface CarouselRow{
    id:number;
    type: rowType
    youtubeLink?:string;
    durationSeconds?:number;
}
const sheet_url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbXZueKMXhVbIUxVNM_FDhsxxR7ccddKy8RFF_7SssBQ7t-gIiayj2ksoMOzmqp0I75-UWaZQ_wJ_h/pub?output=csv';
export async function GET(){
    try{
        const response = await fetch(sheet_url, {
            next:{revalidate:60} // cache 60s
        });
        if(!response.ok){
            throw new Error('Failed to fetch google sheet')
        }
        const csvData = await response.text();
        const parsed = Papa.parse<CarouselRow>(csvData,{
            header:true,
            skipEmptyLines:true,
            dynamicTyping:true,
            transformHeader:(header)=> header.trim(),
            transform:(val)=> typeof val === 'string' ? val.trim() : val
        })
        const rawRows = Array.isArray(parsed?.data) ? parsed.data : [] as CarouselRow[];
        // Normalize durationSeconds - try multiple column names (Google Sheet headers vary)
     
        const getDurationFromRow = (row: Record<string, unknown>): number | undefined => {
          for (const key of DURATION_KEYS) {
            const val = row[key];
            if (val === undefined || val === null || val === "") continue;
            const num = typeof val === "number" ? val : parseInt(String(val), 10);
            if (!Number.isNaN(num) && num > 0) return num;
          }
          // Fallback: any key containing "duration" (case-insensitive)
          for (const key of Object.keys(row)) {
            if (key.toLowerCase().includes("duration")) {
              const val = row[key];
              if (val === undefined || val === null || val === "") continue;
              const num = typeof val === "number" ? val : parseInt(String(val), 10);
              if (!Number.isNaN(num) && num > 0) return num;
            }
          }
          return undefined;
        };
        const rows = rawRows.map((row): CarouselRow => {
          const durationSeconds = getDurationFromRow(row as unknown as Record<string, unknown>);
          return { ...row, durationSeconds } as CarouselRow;
        });
        const tableRows = rows.filter((row: CarouselRow) => row.type === 'table');
        const videoRows = rows.filter((row: CarouselRow) => row.type === 'video' && row.youtubeLink);
        const galleryRows = rows.filter((row: CarouselRow) => row.type === 'gallery')
        return NextResponse.json({
            success:true,
            data:{
                table:tableRows,
                videos:videoRows,
                gallery:galleryRows,
                all:rows
            }
        })
    }catch(err:unknown){
        console.error("API /api/videos:", err);
        return NextResponse.json({error:"failed to fetch google sheet"},{status:500})
    }
}