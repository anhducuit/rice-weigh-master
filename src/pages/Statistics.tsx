import { useState, useMemo } from 'react';
import { BarChart3, Package, Weight, DollarSign, TrendingUp, PieChart as PieChartIcon, Calendar, Check } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useTransaction } from '@/hooks/useTransaction';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  startOfYear,
  eachMonthOfInterval,
  getQuarter,
  getDaysInMonth
} from 'date-fns';
import { vi } from 'date-fns/locale';

type TimePeriod = 'day' | 'month' | 'quarter';

const Statistics = () => {
  const { transactions, loading } = useTransaction();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('day');

  // Selection states for each period type
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [selectedQuarters, setSelectedQuarters] = useState<number[]>([]);

  // Filter completed transactions for statistics
  const completedTransactions = useMemo(() =>
    transactions.filter(t => t.status === 'completed'),
    [transactions]
  );

  // Get available options for current period
  const availableOptions = useMemo(() => {
    const now = new Date();
    if (timePeriod === 'day') {
      const daysInMonth = getDaysInMonth(now);
      return Array.from({ length: daysInMonth }, (_, i) => i + 1);
    } else if (timePeriod === 'month') {
      return Array.from({ length: 12 }, (_, i) => i + 1);
    } else {
      return [1, 2, 3, 4];
    }
  }, [timePeriod]);

  // Toggle selection
  const toggleSelection = (value: number) => {
    if (timePeriod === 'day') {
      setSelectedDays(prev =>
        prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value]
      );
    } else if (timePeriod === 'month') {
      setSelectedMonths(prev =>
        prev.includes(value) ? prev.filter(m => m !== value) : [...prev, value]
      );
    } else {
      setSelectedQuarters(prev =>
        prev.includes(value) ? prev.filter(q => q !== value) : [...prev, value]
      );
    }
  };

  // Select/Deselect all
  const selectAll = () => {
    if (timePeriod === 'day') setSelectedDays(availableOptions);
    else if (timePeriod === 'month') setSelectedMonths(availableOptions);
    else setSelectedQuarters(availableOptions);
  };

  const deselectAll = () => {
    if (timePeriod === 'day') setSelectedDays([]);
    else if (timePeriod === 'month') setSelectedMonths([]);
    else setSelectedQuarters([]);
  };

  // Get current selection
  const currentSelection = useMemo(() => {
    if (timePeriod === 'day') return selectedDays;
    if (timePeriod === 'month') return selectedMonths;
    return selectedQuarters;
  }, [timePeriod, selectedDays, selectedMonths, selectedQuarters]);

  // Group and processed data based on timePeriod and selection
  const { chartData, stats, pieData } = useMemo(() => {
    const now = new Date();
    let data: any[] = [];
    let filteredTransactions = completedTransactions;

    // Filter transactions based on selection
    if (timePeriod === 'day' && selectedDays.length > 0) {
      filteredTransactions = completedTransactions.filter(t => {
        const day = t.createdAt.getDate();
        const month = t.createdAt.getMonth();
        const year = t.createdAt.getFullYear();
        return selectedDays.includes(day) &&
          month === now.getMonth() &&
          year === now.getFullYear();
      });
    } else if (timePeriod === 'month' && selectedMonths.length > 0) {
      filteredTransactions = completedTransactions.filter(t => {
        const month = t.createdAt.getMonth() + 1;
        const year = t.createdAt.getFullYear();
        return selectedMonths.includes(month) && year === now.getFullYear();
      });
    } else if (timePeriod === 'quarter' && selectedQuarters.length > 0) {
      filteredTransactions = completedTransactions.filter(t => {
        const quarter = getQuarter(t.createdAt);
        const year = t.createdAt.getFullYear();
        return selectedQuarters.includes(quarter) && year === now.getFullYear();
      });
    }

    // Helper function to calculate transaction amount
    const calculateTransactionAmount = (t: any) => {
      const tWeight = t.weights.reduce((sum: number, w: any) => sum + w.weight, 0);

      // Multi-batch calculation
      if (t.riceBatches && t.riceBatches.length > 0) {
        return t.riceBatches.reduce((total: number, batch: any) => {
          const batchWeights = t.weights.filter((w: any) => w.riceBatchId === batch.id);
          const batchWeight = batchWeights.reduce((sum: number, w: any) => sum + w.weight, 0);
          return total + (batchWeight * batch.unitPrice);
        }, 0);
      }

      // Legacy single price
      return tWeight * t.unitPrice;
    };

    // 1. Calculate Stats based on filtered transactions
    const totalStats = filteredTransactions.reduce((acc, t) => {
      const tWeight = t.weights.reduce((sum, w) => sum + w.weight, 0);
      return {
        totalBags: acc.totalBags + t.weights.length,
        totalWeight: acc.totalWeight + tWeight,
        totalAmount: acc.totalAmount + calculateTransactionAmount(t)
      };
    }, { totalBags: 0, totalWeight: 0, totalAmount: 0 });

    // 2. Prepare Chart Data
    if (timePeriod === 'day') {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      const days = eachDayOfInterval({ start, end });

      data = days.map(day => {
        const dayOfMonth = day.getDate();
        const dayTxs = completedTransactions.filter(t => isSameDay(t.createdAt, day));
        const weight = dayTxs.reduce((sum, t) => sum + t.weights.reduce((s, w) => s + w.weight, 0), 0);
        return {
          label: format(day, 'dd/MM'),
          weight,
          fullDate: format(day, 'dd/MM/yyyy'),
          value: dayOfMonth
        };
      });

      // Filter by selection
      if (selectedDays.length > 0) {
        data = data.filter(d => selectedDays.includes(d.value));
      }
    } else if (timePeriod === 'month') {
      const start = startOfYear(now);
      const months = eachMonthOfInterval({ start, end: now });

      data = months.map(month => {
        const monthNumber = month.getMonth() + 1;
        const monthTxs = completedTransactions.filter(t =>
          t.createdAt.getMonth() === month.getMonth() &&
          t.createdAt.getFullYear() === month.getFullYear()
        );
        const weight = monthTxs.reduce((sum, t) => sum + t.weights.reduce((s, w) => s + w.weight, 0), 0);
        return {
          label: format(month, 'MMM', { locale: vi }),
          weight,
          fullDate: format(month, 'MMMM yyyy', { locale: vi }),
          value: monthNumber
        };
      });

      // Filter by selection
      if (selectedMonths.length > 0) {
        data = data.filter(d => selectedMonths.includes(d.value));
      }
    } else if (timePeriod === 'quarter') {
      data = [1, 2, 3, 4].map(q => {
        const quarterTxs = completedTransactions.filter(t => getQuarter(t.createdAt) === q && t.createdAt.getFullYear() === now.getFullYear());
        const weight = quarterTxs.reduce((sum, t) => sum + t.weights.reduce((s, w) => s + w.weight, 0), 0);
        return {
          label: `Quý ${q}`,
          weight,
          fullDate: `Quý ${q} - ${now.getFullYear()}`,
          value: q
        };
      });

      // Filter by selection
      if (selectedQuarters.length > 0) {
        data = data.filter(d => selectedQuarters.includes(d.value));
      }
    }

    // 3. Prepare Pie Data (Structure) - based on filtered transactions and batches
    const riceTypeMap = filteredTransactions.reduce((acc: any, t) => {
      // Multi-batch: aggregate by batch rice types
      if (t.riceBatches && t.riceBatches.length > 0) {
        t.riceBatches.forEach((batch: any) => {
          const batchWeights = t.weights.filter((w: any) => w.riceBatchId === batch.id);
          const batchWeight = batchWeights.reduce((sum: number, w: any) => sum + w.weight, 0);
          if (!acc[batch.riceType]) acc[batch.riceType] = 0;
          acc[batch.riceType] += batchWeight;
        });
      } else {
        // Legacy: single rice type
        if (!acc[t.riceType]) acc[t.riceType] = 0;
        acc[t.riceType] += t.weights.reduce((sum, w) => sum + w.weight, 0);
      }
      return acc;
    }, {});
    const pData = Object.entries(riceTypeMap).map(([name, value]) => ({ name, value }));

    return { chartData: data, stats: totalStats, pieData: pData };
  }, [completedTransactions, timePeriod, selectedDays, selectedMonths, selectedQuarters]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 animate-fade-in">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Thống kê</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Báo cáo sản lượng</p>
            </div>
          </div>
        </div>

        {/* Time Filters */}
        <div className="flex p-1 bg-secondary/50 rounded-xl shadow-inner">
          {(['day', 'month', 'quarter'] as TimePeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setTimePeriod(p)}
              className={`flex-1 py-3 px-3 text-sm font-bold rounded-lg transition-all ${timePeriod === p
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {p === 'day' ? 'Ngày' : p === 'month' ? 'Tháng' : 'Quý'}
            </button>
          ))}
        </div>

        {/* Date Range Selector */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wide">
                {timePeriod === 'day' ? 'Chọn ngày' : timePeriod === 'month' ? 'Chọn tháng' : 'Chọn quý'}
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
              >
                Tất cả
              </button>
              <button
                onClick={deselectAll}
                className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors font-medium"
              >
                Bỏ chọn
              </button>
            </div>
          </div>

          <div className={`grid gap-2 ${timePeriod === 'day' ? 'grid-cols-7' : timePeriod === 'month' ? 'grid-cols-6' : 'grid-cols-4'}`}>
            {availableOptions.map((value) => {
              const isSelected = currentSelection.includes(value);
              const label = timePeriod === 'day'
                ? value.toString()
                : timePeriod === 'month'
                  ? `T${value}`
                  : `Q${value}`;

              return (
                <button
                  key={value}
                  onClick={() => toggleSelection(value)}
                  className={`relative py-2 px-3 rounded-lg text-sm font-bold transition-all ${isSelected
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                >
                  {isSelected && (
                    <Check className="w-3 h-3 absolute top-1 right-1" />
                  )}
                  {label}
                </button>
              );
            })}
          </div>

          {currentSelection.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Đã chọn {currentSelection.length} {timePeriod === 'day' ? 'ngày' : timePeriod === 'month' ? 'tháng' : 'quý'}
            </p>
          )}
        </div>

        {/* Global Stats Cards */}
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tổng doanh thu</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(stats.totalAmount)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-2xl p-4 transition-all hover:shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <Weight className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Sản lượng</span>
              </div>
              <p className="text-xl font-bold text-foreground">{stats.totalWeight.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">kg</span></p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 transition-all hover:shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-warning" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Số bao</span>
              </div>
              <p className="text-xl font-bold text-foreground">{stats.totalBags} <span className="text-sm font-normal text-muted-foreground">bao</span></p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-4">
          {/* Main Chart */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wide">
                  {timePeriod === 'day' ? 'Sản lượng trong tháng' : timePeriod === 'month' ? 'Sản lượng trong năm' : 'Sản lượng theo quý'}
                </h2>
              </div>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {timePeriod === 'day' ? (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      interval={4}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      unit="kg"
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="weight"
                      name="Sản lượng"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorWeight)"
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      unit="kg"
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar
                      dataKey="weight"
                      name="Sản lượng"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      barSize={timePeriod === 'quarter' ? 50 : 20}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Rice Type Structure */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wide">Cơ cấu loại gạo</h2>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Sản lượng']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Detail List or Footer */}
        {completedTransactions.length === 0 && (
          <div className="py-12 text-center bg-card border border-dashed border-border rounded-2xl">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground italic">Chưa có đủ dữ liệu để hiển thị biểu đồ chi tiết.</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Statistics;
