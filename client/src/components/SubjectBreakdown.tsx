import React, { useEffect, useState, useMemo } from 'react';

interface SubjectBreakdownProps {
    viewLevel: 'root' | 'district' | 'mandal' | 'school';
    selectedId?: string;
}

interface BreakdownData {
    [subject: string]: {
        name: string;
        grade_a: number;
        grade_b: number;
        grade_c: number;
        grade_d: number;
        total: number;
        grade_a_pct: number;
        grade_b_pct: number;
        grade_c_pct: number;
        grade_d_pct: number;
    }[];
}

interface HeatmapRow {
    entityName: string;
    [subject: string]: any; // Stores pass percentage and details
}

const SubjectBreakdown: React.FC<SubjectBreakdownProps> = ({ viewLevel, selectedId }) => {
    const [data, setData] = useState<BreakdownData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (viewLevel === 'school') {
                setData(null);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('authToken');
                const params = new URLSearchParams({
                    level: viewLevel,
                });

                if (viewLevel === 'district' && selectedId) {
                    params.append('district_id', selectedId);
                } else if (viewLevel === 'mandal' && selectedId) {
                    params.append('mandal_id', selectedId);
                }

                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/subject-breakdown?${params}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch breakdown data');

                const result = await response.json();
                setData(result);
            } catch (err) {
                console.error(err);
                setError('Failed to load subject breakdown');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [viewLevel, selectedId]);

    const heatmapData = useMemo(() => {
        if (!data) return { rows: [], subjects: [] };

        const subjects = Object.keys(data).sort();
        const entityMap: Record<string, HeatmapRow> = {};

        subjects.forEach(subject => {
            if (Array.isArray(data[subject])) {
                data[subject].forEach(item => {
                    if (!entityMap[item.name]) {
                        entityMap[item.name] = { entityName: item.name };
                    }
                    // Calculate Pass Percentage (Total - Grade D) / Total
                    const passPct = item.total > 0 ? ((item.total - item.grade_d) / item.total) * 100 : 0;

                    entityMap[item.name][subject] = {
                        passPct: parseFloat(passPct.toFixed(1)),
                        details: item
                    };
                });
            }
        });

        const rows = Object.values(entityMap).sort((a, b) => a.entityName.localeCompare(b.entityName));
        return { rows, subjects };
    }, [data]);

    const getCellColor = (pct: number) => {
        if (pct >= 80) return 'bg-green-100 text-green-800 hover:bg-green-200';
        if (pct >= 60) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
        if (pct >= 35) return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
        return 'bg-red-100 text-red-800 hover:bg-red-200';
    };

    if (viewLevel === 'school') return null;
    if (loading) return <div className="p-4 text-center text-gray-500">Loading breakdown...</div>;
    if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
    if (!data || Object.keys(data).length === 0) return null;

    return (
        <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Subject Performance Heatmap (Pass %)</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <table className="w-full divide-y divide-gray-200 table-fixed">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="w-1/4 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 truncate">
                                Entity Name
                            </th>
                            {heatmapData.subjects.map(subject => (
                                <th key={subject} className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider break-words">
                                    {subject}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {heatmapData.rows.map((row) => (
                            <tr key={row.entityName}>
                                <td className="px-3 py-2 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-100 truncate" title={row.entityName}>
                                    {row.entityName}
                                </td>
                                {heatmapData.subjects.map(subject => {
                                    const cellData = row[subject];
                                    if (!cellData) return <td key={subject} className="px-1 py-2 text-center text-xs text-gray-400">-</td>;

                                    return (
                                        <td key={subject} className={`px-1 py-2 text-center text-xs font-semibold cursor-default transition-colors ${getCellColor(cellData.passPct)}`} title={`Pass: ${cellData.passPct}% | A: ${cellData.details.grade_a} | B: ${cellData.details.grade_b} | C: ${cellData.details.grade_c} | D: ${cellData.details.grade_d} | Total: ${cellData.details.total}`}>
                                            {Math.round(cellData.passPct)}%
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 flex gap-4 text-sm text-gray-600 justify-end">
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-100 border border-green-200 rounded"></span> 80-100%</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></span> 60-79%</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></span> 35-59%</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-100 border border-red-200 rounded"></span> 0-34%</div>
            </div>
        </div>
    );
};

export default SubjectBreakdown;
