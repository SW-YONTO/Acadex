import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, TrendingDown, UserX, UserMinus, BarChart3 } from 'lucide-react';
import { studentExitsApi } from '@/lib/api';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const COLORS = ['#ef4444', '#f59e0b'];

export default function AnalyticsPage() {
  const [exits, setExits] = useState([]);
  const [stats, setStats] = useState({ total: 0, kicked: 0, left: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [exitsRes, statsRes] = await Promise.all([
        studentExitsApi.getAll(),
        studentExitsApi.getStats(),
      ]);
      setExits(exitsRes.data || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: 'Kicked', value: stats.kicked },
    { name: 'Left', value: stats.left },
  ];

  const monthlyData = exits.reduce((acc, exit) => {
    const month = format(new Date(exit.exitDate), 'MMM yyyy');
    if (!acc[month]) acc[month] = { kicked: 0, left: 0 };
    acc[month][exit.exitType]++;
    return acc;
  }, {});

  const barData = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    kicked: data.kicked,
    left: data.left,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Analytics</h1>
        <p className="text-muted-foreground">Track student exits and retention</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exits</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Students who left or were removed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kicked</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.kicked}</div>
            <p className="text-xs text-muted-foreground">Removed by admin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Left Voluntarily</CardTitle>
            <UserMinus className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.left}</div>
            <p className="text-xs text-muted-foreground">Left on their own</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {stats.total > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Exit Distribution</CardTitle>
              <CardDescription>Kicked vs Left breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {barData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Trend</CardTitle>
                <CardDescription>Exits over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="kicked" fill="#ef4444" name="Kicked" />
                    <Bar dataKey="left" fill="#f59e0b" name="Left" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Exits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Exit History</CardTitle>
          <CardDescription>All student exits with reasons</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Exit Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No exits recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                exits.map((exit) => (
                  <TableRow key={exit._id}>
                    <TableCell className="font-medium">{exit.studentName}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={exit.exitType === 'kicked' 
                          ? 'bg-red-500/10 text-red-600 border-red-500/20' 
                          : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                        }
                      >
                        {exit.exitType === 'kicked' ? 'Kicked' : 'Left'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">{exit.reason || '-'}</TableCell>
                    <TableCell>{format(new Date(exit.exitDate), 'MMM d, yyyy')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
