'use client'
import { schedchuleData } from "@/mockData/schedchules.mock"
import { SchedchuleInterface } from "@/types/schedchule.type"
import { createColumnHelper, getCoreRowModel, useReactTable, flexRender } from "@tanstack/react-table"
import React from "react"

const columnHelper = createColumnHelper<SchedchuleInterface>()

const columns = [
    columnHelper.accessor('workoutTime', {
        header: 'Time',
        cell: (info) => info.getValue()
    }),
    columnHelper.accessor('workoutType', {
        header: 'Workout type',
        cell: (info) => info.getValue()
    }),
    columnHelper.accessor('coach', {
        header: 'Coach',
        cell: (info) => info.getValue()
    })
]

const SchedchuleTable = () => {
    const [data] = React.useState<SchedchuleInterface[]>(schedchuleData)
    
    const table = useReactTable({
        columns,
        data,
        getCoreRowModel: getCoreRowModel()
    })

    return (
        <div className="my-4" style={{ 

            padding: '12px', 
            backgroundColor: '#1e293b', 
            borderRadius: '12px', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            border: '1px solid #334155'
        }}>
            <h2 style={{ 
                margin: '0 0 20px 0', 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#e4e9f1' 
            }}>
                Training Schedule
            </h2>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} style={{ 
                                borderBottom: '2px solid #334155', 
                                backgroundColor: '#0f1419' 
                            }}>
                                {headerGroup.headers.map((header) => (
                                    <th 
                                        key={header.id}
                                        style={{ 
                                            padding: '12px 8px',
                                            textAlign: 'left',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            color: '#60a5fa',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row, index) => (
                            <tr 
                                key={row.id}
                                style={{ 
                                    borderBottom: '1px solid #334155',
                                    backgroundColor: index % 2 === 0 ? '#1e293b' : '#1a1f2e',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#1e293b' : '#1a1f2e'}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <td 
                                        key={cell.id}
                                        style={{ 
                                            padding: '14px 8px',
                                            fontSize: '14px',
                                            color: '#e4e9f1'
                                        }}
                                    >
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default SchedchuleTable