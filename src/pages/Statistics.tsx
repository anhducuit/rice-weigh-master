import { BarChart3 } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';

const Statistics = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Thống kê</h1>
        </div>
        
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Tính năng thống kê đang phát triển</p>
          <p className="text-sm text-muted-foreground/70 mt-2">
            Sẽ hiển thị biểu đồ doanh thu, số lượng bao theo ngày/tuần/tháng
          </p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Statistics;
