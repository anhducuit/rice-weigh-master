import { LayoutDashboard, BarChart3, Users, Calculator } from 'lucide-react';
import { NavLink } from './NavLink';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Tổng quan' },
  { to: '/thong-ke', icon: BarChart3, label: 'Thống kê' },
  { to: '/khach-hang', icon: Users, label: 'Mối hàng' },
  { to: '/may-tinh', icon: Calculator, label: 'Máy tính' },
];

export const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg text-muted-foreground transition-colors min-w-[64px]"
            activeClassName="text-primary bg-primary/10"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
