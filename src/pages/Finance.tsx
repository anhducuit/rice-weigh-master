import { Wallet } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';

const Finance = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Thu chi</h1>
        </div>
        
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Wallet className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Tính năng thu chi đang phát triển</p>
          <p className="text-sm text-muted-foreground/70 mt-2">
            Sẽ quản lý thu nhập và chi phí của việc kinh doanh gạo
          </p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Finance;
