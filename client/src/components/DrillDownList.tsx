import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { ChevronRight } from 'lucide-react';

interface DrillDownItem {
    id: number;
    name: string;
    avg_score: number;
    pass_percentage?: number; // Not available for students
    grade_a_count?: number;
    failed_subjects?: number; // Only for students
}

interface DrillDownListProps {
    items: DrillDownItem[];
    level: 'district' | 'mandal' | 'school' | 'student';
    onItemClick: (item: DrillDownItem) => void;
}

const DrillDownList: React.FC<DrillDownListProps> = ({ items, level, onItemClick }) => {
    // Mock trend data for sparkline (since backend doesn't provide history yet)
    const getMockTrend = () => [
        { val: Math.random() * 40 + 50 },
        { val: Math.random() * 40 + 50 },
        { val: Math.random() * 40 + 50 },
        { val: Math.random() * 40 + 50 },
    ];

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 capitalize">
                    {level === 'district' ? 'Districts' :
                        level === 'mandal' ? 'Mandals' :
                            level === 'school' ? 'Schools' :
                                level === 'student' ? 'Students' : 'Results'} List
                </h3>
                <span className="text-sm text-gray-500">{items.length} Records</span>
            </div>

            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {items.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => onItemClick(item)}
                        className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-blue-600 truncate">{item.name}</p>
                            <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-gray-500">
                                    Avg: <span className={`font-semibold ${item.avg_score < 35 ? 'text-red-600' : 'text-gray-900'}`}>{item.avg_score}%</span>
                                </span>
                                {item.pass_percentage !== undefined && (
                                    <span className="text-xs text-gray-500">
                                        Pass: <span className="font-semibold text-gray-900">{item.pass_percentage}%</span>
                                    </span>
                                )}
                                {item.failed_subjects !== undefined && item.failed_subjects > 0 && (
                                    <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                                        {item.failed_subjects} Failed Subj
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Sparkline */}
                        <div className="h-10 w-24 mx-4 hidden sm:block">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={getMockTrend()}>
                                    <YAxis domain={[0, 100]} hide />
                                    <Line type="monotone" dataKey="val" stroke={item.avg_score >= 80 ? '#22c55e' : item.avg_score >= 35 ? '#eab308' : '#ef4444'} strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DrillDownList;
