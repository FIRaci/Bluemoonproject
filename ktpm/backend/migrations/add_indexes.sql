-- Migration: Add indexes and optimize schema
-- Date: 2025-12-15
-- Description: Add performance indexes and cascade deletes

-- Add indexes for User table
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_username_idx" ON "User"("username");

-- Add indexes for HoKhau table
CREATE INDEX IF NOT EXISTS "HoKhau_tenChuHo_idx" ON "HoKhau"("tenChuHo");
CREATE INDEX IF NOT EXISTS "HoKhau_hangCanHo_idx" ON "HoKhau"("hangCanHo");
CREATE INDEX IF NOT EXISTS "HoKhau_ownerCccd_idx" ON "HoKhau"("ownerCccd");

-- Add indexes for NhanKhau table
CREATE INDEX IF NOT EXISTS "NhanKhau_hoTen_idx" ON "NhanKhau"("hoTen");
CREATE INDEX IF NOT EXISTS "NhanKhau_quanHeVoiChuHo_idx" ON "NhanKhau"("quanHeVoiChuHo");

-- Add indexes for KhoanThu table
CREATE INDEX IF NOT EXISTS "KhoanThu_loaiPhi_idx" ON "KhoanThu"("loaiPhi");
CREATE INDEX IF NOT EXISTS "KhoanThu_phanLoaiPhi_idx" ON "KhoanThu"("phanLoaiPhi");
CREATE INDEX IF NOT EXISTS "KhoanThu_hanNop_idx" ON "KhoanThu"("hanNop");

-- Add indexes for LichSuNopTien table
CREATE INDEX IF NOT EXISTS "LichSuNopTien_ngayNop_idx" ON "LichSuNopTien"("ngayNop");
CREATE INDEX IF NOT EXISTS "LichSuNopTien_hoKhauId_khoanThuId_idx" ON "LichSuNopTien"("hoKhauId", "khoanThuId");

-- Add phiCoDinh column to KhoanThu if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'KhoanThu' AND column_name = 'phiCoDinh'
    ) THEN
        ALTER TABLE "KhoanThu" ADD COLUMN "phiCoDinh" DOUBLE PRECISION;
    END IF;
END $$;

-- Done
SELECT 'Migration completed successfully!' as status;
