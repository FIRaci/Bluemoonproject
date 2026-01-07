import { db } from "@/utils/db";
import { t } from "elysia";

// Định nghĩa DTO (Kiểu dữ liệu đầu vào) cho tạo/sửa Hộ Khẩu
export const hoKhauDto = t.Object({
  soCanHo: t.String({ minLength: 2, error: "Số căn hộ không được để trống" }),
  tenChuHo: t.String({ minLength: 2, error: "Tên chủ hộ không được để trống" }),
  soDienThoai: t.Optional(t.Union([
    t.String({ minLength: 10, maxLength: 11, error: "Số điện thoại phải 10-11 chữ số" }),
    t.Null()
  ])),
  dienTich: t.Optional(t.Union([t.Number(), t.Null()])),
  hangCanHo: t.Optional(t.Union([
    t.Literal('BINH_THUONG'),
    t.Literal('TRUNG_CAP'),
    t.Literal('CAO_CAP'),
    t.Literal('PENTHOUSE')
  ])),
  ownerInfo: t.Optional(t.Object({
    cccd: t.String({ minLength: 9, maxLength: 12, error: "CCCD/CMND phải từ 9-12 chữ số" }),
    ngaySinh: t.Optional(t.Union([t.String(), t.Null()])),
    email: t.Optional(t.Union([t.String(), t.Null()])),
    gioiTinh: t.Union([t.Literal('Nam'), t.Literal('Nữ'), t.Literal('Khác')])
  }))
});

// Lấy danh sách tất cả hộ khẩu (có pagination)
export async function getAllHoKhau(options?: {
  skip?: number;
  take?: number;
  search?: string;
}) {
  const where = options?.search
    ? {
        OR: [
          { soCanHo: { contains: options.search, mode: 'insensitive' as const } },
          { tenChuHo: { contains: options.search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    db.hoKhau.findMany({
      where,
      skip: options?.skip || 0,
      take: options?.take || 100,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        soCanHo: true,
        tenChuHo: true,
        soDienThoai: true,
        dienTich: true,
        hangCanHo: true,
        createdAt: true,
        updatedAt: true,
        ownerCccd: true,
        ownerEmail: true,
        ownerGioiTinh: true,
        ownerNgaySinh: true,
        _count: {
          select: { nhanKhaus: true },
        },
      },
    }),
    db.hoKhau.count({ where }),
  ]);

  return { data, total };
}

// Lấy một hộ khẩu theo ID
export async function getHoKhauById(id: string) {
  const hoKhau = await db.hoKhau.findUnique({
    where: { id },
    select: {
      id: true,
      soCanHo: true,
      tenChuHo: true,
      soDienThoai: true,
      dienTich: true,
      hangCanHo: true,
      createdAt: true,
      updatedAt: true,
      ownerCccd: true,
      ownerEmail: true,
      ownerGioiTinh: true,
      ownerNgaySinh: true,
      nhanKhaus: {
        select: {
          id: true,
          hoTen: true,
          cccd: true,
          ngaySinh: true,
          gioiTinh: true,
          quanHeVoiChuHo: true,
          email: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      _count: {
        select: { nhanKhaus: true },
      },
    },
  });
  
  if (!hoKhau) {
    throw new Error("Không tìm thấy hộ khẩu");
  }
  
  return hoKhau;
}

// Tạo hộ khẩu mới
export async function createHoKhau(data: {
  soCanHo: string;
  tenChuHo: string;
  soDienThoai?: string;
  dienTich?: number;
  hangCanHo?: 'BINH_THUONG' | 'TRUNG_CAP' | 'CAO_CAP' | 'PENTHOUSE';
  ownerInfo?: {
    cccd: string;
    ngaySinh: string;
    email?: string;
    gioiTinh: 'Nam' | 'Nữ' | 'Khác';
  };
}) {
  // Kiểm tra song song số căn hộ và CCCD
  const [existing, existingNhanKhau] = await Promise.all([
    db.hoKhau.findUnique({
      where: { soCanHo: data.soCanHo },
      select: { id: true },
    }),
    data.ownerInfo?.cccd
      ? db.nhanKhau.findUnique({
          where: { cccd: data.ownerInfo.cccd },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  if (existing) {
    throw new Error(`Căn hộ ${data.soCanHo} đã tồn tại trong hệ thống.`);
  }

  if (existingNhanKhau) {
    throw new Error(`CCCD ${data.ownerInfo!.cccd} đã tồn tại trong hệ thống.`);
  }

  // Tạo hộ khẩu với thông tin chủ hộ
  const createData: any = {
    soCanHo: data.soCanHo,
    tenChuHo: data.tenChuHo,
    soDienThoai: data.soDienThoai,
    dienTich: data.dienTich,
    hangCanHo: data.hangCanHo || 'BINH_THUONG',
  };

  // Thêm thông tin chủ hộ nếu có
  if (data.ownerInfo) {
    createData.ownerCccd = data.ownerInfo.cccd;
    createData.ownerNgaySinh = new Date(data.ownerInfo.ngaySinh);
    createData.ownerGioiTinh = data.ownerInfo.gioiTinh;
    createData.ownerEmail = data.ownerInfo.email;
  }

  const hoKhau = await db.hoKhau.create({
    data: createData,
  });

  return { ...hoKhau, ownerInfo: data.ownerInfo };
}

// Cập nhật hộ khẩu
export async function updateHoKhau(id: string, data: any) {
  // Kiểm tra hộ khẩu tồn tại
  const existing = await db.hoKhau.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Hộ khẩu không tồn tại hoặc đã bị xóa");
  }
  
  const { ownerInfo, ...hoKhauData } = data;
  
  // Cập nhật thông tin hộ khẩu
  const updatedHoKhau = await db.hoKhau.update({
    where: { id },
    data: hoKhauData,
  });
  
  // Cập nhật thông tin chủ hộ trong bảng hoKhau nếu có
  if (ownerInfo) {
    const ownerUpdateData: any = {};
    
    if (ownerInfo.cccd) ownerUpdateData.ownerCccd = ownerInfo.cccd;
    if (ownerInfo.ngaySinh) ownerUpdateData.ownerNgaySinh = new Date(ownerInfo.ngaySinh);
    if (ownerInfo.email !== undefined) ownerUpdateData.ownerEmail = ownerInfo.email;
    if (ownerInfo.gioiTinh) ownerUpdateData.ownerGioiTinh = ownerInfo.gioiTinh;
    
    if (Object.keys(ownerUpdateData).length > 0) {
      await db.hoKhau.update({
        where: { id },
        data: ownerUpdateData
      });
    }
    
    // Chỉ cập nhật nhân khẩu nếu đã tồn tại
    const existingOwner = await db.nhanKhau.findFirst({
      where: { 
        hoKhauId: id,
        quanHeVoiChuHo: 'Chủ hộ'
      }
    });
    
    if (existingOwner) {
      // Kiểm tra CCCD trùng lặp (nếu thay đổi CCCD)
      if (ownerInfo.cccd && ownerInfo.cccd !== existingOwner.cccd) {
        const cccdConflict = await db.nhanKhau.findUnique({
          where: { cccd: ownerInfo.cccd }
        });
        if (cccdConflict) {
          throw new Error(`CCCD ${ownerInfo.cccd} đã được sử dụng bởi nhân khẩu khác`);
        }
      }
      
      // Cập nhật thông tin nhân khẩu chủ hộ
      await db.nhanKhau.update({
        where: { id: existingOwner.id },
        data: {
          hoTen: hoKhauData.tenChuHo || existingOwner.hoTen,
          cccd: ownerInfo.cccd || existingOwner.cccd,
          ngaySinh: ownerInfo.ngaySinh ? new Date(ownerInfo.ngaySinh) : existingOwner.ngaySinh,
          email: ownerInfo.email !== undefined ? ownerInfo.email : existingOwner.email,
          gioiTinh: ownerInfo.gioiTinh || existingOwner.gioiTinh,
        }
      });
    }
    // Không tự động tạo nhân khẩu mới khi sửa hộ khẩu
  }
  
  return updatedHoKhau;
}

// Thêm chủ hộ vào nhân khẩu
export async function addChuHoToNhanKhau(hoKhauId: string, ownerInfo: {
  cccd: string;
  ngaySinh: string;
  email?: string;
  gioiTinh: 'Nam' | 'Nữ' | 'Khác';
}) {
  // Lấy thông tin hộ khẩu
  const hoKhau = await db.hoKhau.findUnique({
    where: { id: hoKhauId }
  });
  
  if (!hoKhau) {
    throw new Error("Không tìm thấy hộ khẩu");
  }

  // Kiểm tra CCCD đã tồn tại chưa
  const existingNhanKhau = await db.nhanKhau.findUnique({
    where: { cccd: ownerInfo.cccd }
  });
  
  if (existingNhanKhau) {
    throw new Error(`CCCD ${ownerInfo.cccd} đã tồn tại trong hệ thống.`);
  }

  // Tạo nhân khẩu chủ hộ
  const nhanKhau = await db.nhanKhau.create({
    data: {
      hoTen: hoKhau.tenChuHo,
      cccd: ownerInfo.cccd,
      ngaySinh: new Date(ownerInfo.ngaySinh),
      email: ownerInfo.email,
      gioiTinh: ownerInfo.gioiTinh,
      quanHeVoiChuHo: 'Chủ hộ',
      hoKhauId: hoKhauId,
    },
  });

  return nhanKhau;
}

// Xóa hộ khẩu
export async function deleteHoKhau(id: string) {
  // Kiểm tra tồn tại
  const hoKhau = await db.hoKhau.findUnique({
    where: { id },
    include: {
      users: true,
      lichSuNopTiens: true,
      chiTietSuDungs: true
    }
  });
  
  if (!hoKhau) {
    throw new Error("Hộ khẩu không tồn tại");
  }
  
  // Kiểm tra ràng buộc
  if (hoKhau.users && hoKhau.users.length > 0) {
    throw new Error("Không thể xóa hộ khẩu đang có tài khoản liên kết. Hãy xóa tài khoản trước.");
  }
  
  if (hoKhau.lichSuNopTiens && hoKhau.lichSuNopTiens.length > 0) {
    throw new Error("Không thể xóa hộ khẩu đã có lịch sử nộp tiền. Hãy xóa lịch sử trước.");
  }
  
  // Xóa nhân khẩu liên quan trước
  await db.nhanKhau.deleteMany({ where: { hoKhauId: id } });
  
  // Xóa chi tiết sử dụng liên quan
  await db.chiTietSuDung.deleteMany({ where: { hoKhauId: id } });
  
  // Xóa hộ khẩu
  return await db.hoKhau.delete({
    where: { id },
  });
}