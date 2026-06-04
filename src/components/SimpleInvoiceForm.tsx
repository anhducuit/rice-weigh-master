import React, { useState, useEffect, useRef } from 'react';
import { Truck, User, Wheat, DollarSign, Share2, Download, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SimpleInvoicePreview } from './SimpleInvoicePreview';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';

export const SimpleInvoiceForm = () => {
  const [formData, setFormData] = useState({
    customerName: '',
    licensePlate: '',
    riceType: '',
    weightKg: 0,
    weightTons: 0,
    unitPrice: 0,
    totalAmount: 0,
    bags50kg: '',
    bags25kg: '',
    looseBags: [{ id: crypto.randomUUID(), count: '', weight: '' }],
  });



  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const total = formData.weightKg * formData.unitPrice;
    setFormData(prev => ({ ...prev, totalAmount: total }));
  }, [formData.weightKg, formData.unitPrice]);

  const handleWeightChange = (val: string) => {
    const kg = parseFloat(val) || 0;
    setFormData(prev => ({
      ...prev,
      weightKg: kg,
      weightTons: kg / 1000
    }));
  };

  const handleTonsChange = (val: string) => {
    const tons = parseFloat(val) || 0;
    setFormData(prev => ({
      ...prev,
      weightTons: tons,
      weightKg: tons * 1000
    }));
  };

  const handleShareZalo = async () => {
    if (!previewRef.current) return;
    
    try {
      const el = document.getElementById('invoice-preview');
      if (!el) return;

      const dataUrl = await toPng(el, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        width: 450,
        style: {
          margin: '0',
          padding: '24px',
          borderRadius: '0',
        }
      });



      // Convert dataUrl to File object for sharing
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `hoa-don-${formData.customerName || 'gao'}.png`, { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: 'Hóa đơn Xưởng Gạo Hà Toản',
          text: `Gửi anh/chị hóa đơn ${formData.customerName}`,
        });
        toast.success('Đã mở trình chia sẻ!');
      } else {
        // Fallback to download
        const link = document.createElement('a');
        link.download = `hoa-don-${formData.customerName}.png`;
        link.href = dataUrl;
        link.click();
        toast.info('Trình duyệt không hỗ trợ chia sẻ trực tiếp, tệp đã được tải xuống máy.');
      }
    } catch (err) {
      console.error('Lỗi khi chia sẻ:', err);
      toast.error('Có lỗi khi tạo ảnh hóa đơn. Vui lòng thử lại.');
    }
  };

  const inputClass = "w-full h-12 px-4 pl-11 text-base rounded-xl border-2 border-border bg-card focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24 animate-in fade-in duration-500">
      {!showPreview ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Tạo Hóa Đơn</h2>
            <Button variant="ghost" size="sm" onClick={() => setFormData({
              customerName: '',
              licensePlate: '',
              riceType: '',
              weightKg: 0,
              weightTons: 0,
              unitPrice: 0,
              totalAmount: 0,
              bags50kg: '',
              bags25kg: '',
              looseBags: [{ id: crypto.randomUUID(), count: '', weight: '' }],
            })} className="text-muted-foreground gap-1">


              <RefreshCw className="w-4 h-4" /> Làm mới
            </Button>
          </div>

          <div className="grid gap-4">
            {/* Customer Name */}
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tên mối hàng (Ví dụ: Anh Tuấn)"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                className={inputClass}
              />
            </div>

            {/* License Plate */}
            <div className="relative">
              <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Biển số xe (Ví dụ: 29A-123.45)"
                value={formData.licensePlate}
                onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
                className={inputClass}
              />
            </div>

            {/* Rice Type */}
            <div className="relative">
              <Wheat className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Loại gạo (Ví dụ: Gạo ST25)"
                value={formData.riceType}
                onChange={(e) => setFormData(prev => ({ ...prev, riceType: e.target.value }))}
                className={inputClass}
              />
            </div>

            {/* Weight Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">Kg</span>
                <input
                  type="number"
                  placeholder="Số Kg"
                  value={formData.weightKg || ''}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  className="w-full h-12 px-4 pl-12 text-base rounded-xl border-2 border-border bg-card focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">Tấn</span>
                <input
                  type="number"
                  placeholder="Số Tấn"
                  value={formData.weightTons || ''}
                  onChange={(e) => handleTonsChange(e.target.value)}
                  className="w-full h-12 px-4 pl-12 text-base rounded-xl border-2 border-border bg-card focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Unit Price */}
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="number"
                placeholder="Đơn giá (đ/kg)"
                value={formData.unitPrice || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: parseInt(e.target.value) || 0 }))}
                className={inputClass}
              />
            </div>

            {/* Packaging Section */}
            <div className="mt-4 space-y-4 p-4 bg-muted/50 rounded-2xl border-2 border-dashed border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  📦 Phần bao bì (Ghi chú)
                </h3>
                <div className="text-right">
                  <div className="text-xs font-bold text-primary">
                    Tổng: {(() => {
                      const b50 = (parseFloat(formData.bags50kg as string) || 0) * 50;
                      const b25 = (parseFloat(formData.bags25kg as string) || 0) * 25;
                      const bLoose = formData.looseBags.reduce((acc, curr) => 
                        acc + (parseFloat(curr.count as string) || 0) * (parseFloat(curr.weight as string) || 0), 0);
                      const total = b50 + b25 + bLoose;
                      
                      const isMismatched = Math.abs(total - formData.weightKg) > 0.1 && formData.weightKg > 0;
                      
                      return (
                        <div className="flex flex-col items-end gap-1">
                          <span className={isMismatched ? "text-destructive animate-pulse" : ""}>
                            {total.toLocaleString()} kg (~ {(total / 1000).toFixed(2)} tấn)
                          </span>
                          {isMismatched && (
                            <span className="text-[10px] bg-destructive/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                              ⚠️ Lệch {Math.abs(total - formData.weightKg).toLocaleString()} kg so với mục Kg ở trên
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground ml-1">Số bao 50kg</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.bags50kg}
                    onChange={(e) => setFormData(prev => ({ ...prev, bags50kg: e.target.value }))}
                    className="w-full h-11 px-4 text-base rounded-xl border-2 border-border bg-card focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground ml-1">Số bao 25kg</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.bags25kg}
                    onChange={(e) => setFormData(prev => ({ ...prev, bags25kg: e.target.value }))}
                    className="w-full h-11 px-4 text-base rounded-xl border-2 border-border bg-card focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground ml-1 block">Bao lẻ khác:</label>
                {formData.looseBags.map((bag, index) => (
                  <div key={bag.id} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="number"
                        placeholder="Số bao"
                        value={bag.count}
                        onChange={(e) => {
                          const newBags = [...formData.looseBags];
                          newBags[index].count = e.target.value;
                          setFormData(prev => ({ ...prev, looseBags: newBags }));
                        }}
                        className="w-full h-11 px-4 text-base rounded-xl border-2 border-border bg-card focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="number"
                        placeholder="Kg/bao"
                        value={bag.weight}
                        onChange={(e) => {
                          const newBags = [...formData.looseBags];
                          newBags[index].weight = e.target.value;
                          setFormData(prev => ({ ...prev, looseBags: newBags }));
                        }}
                        className="w-full h-11 px-4 text-base rounded-xl border-2 border-border bg-card focus:border-primary focus:outline-none"
                      />
                    </div>
                    {formData.looseBags.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setFormData(prev => ({ ...prev, looseBags: prev.looseBags.filter(b => b.id !== bag.id) }))}
                        className="h-11 w-11 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    looseBags: [...prev.looseBags, { id: crypto.randomUUID(), count: '', weight: '' }] 
                  }))}
                  className="w-full border-dashed rounded-xl h-10 text-xs font-bold"
                >
                  + Thêm bao lẻ
                </Button>
              </div>
            </div>
          </div>



          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Thành tiền dự kiến:</span>
              <span className="text-xl font-bold text-primary">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(formData.totalAmount)}
              </span>
            </div>
          </div>

          <Button 
            className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20"
            onClick={() => {
              if (!formData.customerName) {
                toast.error("Vui lòng nhập tên khách hàng");
                return;
              }
              setShowPreview(true);
            }}
          >
            Xem hóa đơn & Xuất ảnh
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setShowPreview(false)} className="gap-2">
              <X className="w-5 h-5" /> Quay lại
            </Button>
            <h2 className="text-xl font-bold">Xem trước hóa đơn</h2>
          </div>

          <div ref={previewRef} className="overflow-hidden rounded-xl max-w-sm mx-auto">
            <SimpleInvoicePreview data={formData} />
          </div>


          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-12 gap-2 rounded-xl"
              onClick={async () => {
                const el = document.getElementById('invoice-preview');
                if (!el) return;
                const url = await toPng(el, {
                  cacheBust: true,
                  backgroundColor: '#ffffff',
                  width: 450,
                  style: {
                    margin: '0',
                    padding: '24px',
                    borderRadius: '0',
                  }
                });

                const link = document.createElement('a');
                link.download = `hoa-don-${formData.customerName}.png`;
                link.href = url;
                link.click();
              }}
            >

              <Download className="w-5 h-5" /> Tải về máy
            </Button>
            <Button 
              className="h-12 gap-2 rounded-xl bg-[#0068ff] hover:bg-[#0056d2]" // Zalo blue color
              onClick={handleShareZalo}
            >
              <Share2 className="w-5 h-5" /> Chia sẻ Zalo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
