import { NextResponse } from "next/server";
import Papa from 'papaparse';
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
        const rawRows = Array.isArray(parsed?.data) ? parsed.data : [];
        // Normalize durationSeconds to number (CSV may return string)
        const rows = rawRows.map((row: Record<string, unknown>) => {
          const raw = row.durationSeconds;
          const durationSeconds =
            typeof raw === "number" ? raw : typeof raw === "string" ? parseInt(raw, 10) : undefined;
          return { ...row, durationSeconds: Number.isNaN(durationSeconds) ? undefined : durationSeconds };
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