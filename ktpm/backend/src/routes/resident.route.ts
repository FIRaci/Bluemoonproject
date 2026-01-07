import { Elysia, t } from "elysia";
import { db } from "@/utils/db";
import { jwt } from "@elysiajs/jwt";

const JWT_SECRET = process.env.JWT_SECRET || "bluemoon-secret-key-2025-very-secure";

export const residentRoutes = new Elysia({ prefix: "/resident" })
  .use(jwt({ name: "jwt", secret: JWT_SECRET }))
  .onBeforeHandle(async ({ jwt, headers, set }) => {
    console.log('🔐 Resident auth checking...');
    
    const auth = headers["authorization"];
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      console.error('❌ No token');
      set.status = 401;
      return { status: "error", message: "Chưa đăng nhập" };
    }

    const profile = await jwt.verify(token);
    if (!profile) {
      console.error('❌ Invalid token');
      set.status = 401;
      return { status: "error", message: "Token không hợp lệ" };
    }

    const userId = (profile as any).id || (profile as any).userId;
    const username = (profile as any).username;
    const role = (profile as any).role || 'RESIDENT';
    
    (headers as any).user = { id: userId, username, role };
    console.log('✅ User authenticated:', (headers as any).user);
  })

  // Lấy thông tin tổng quan của hộ mình
  .get("/me", async ({ headers, set }) => {
    try {
      const user = (headers as any).user;
      console.log('👤 GET /resident/me - User:', user);
      
      if (!user || !user.id) {
        console.error('❌ No user in context');
        set.status = 401;
        return {
          status: "error",
          message: "Không thể xác thực người dùng",
        };
      }

      const userId = user.id;

      // Lấy thông tin user để có hoKhauId
      const userInfo = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, hoKhauId: true },
      });

      console.log('📋 User info from DB:', userInfo);

      if (!userInfo || !userInfo.hoKhauId) {
        console.error('❌ User has no hoKhauId');
        set.status = 400;
        return {
          status: "error",
          message: "Tài khoản này không liên kết với hộ khẩu nào.",
        };
      }

      const hoKhauId = userInfo.hoKhauId as string;

      // Lấy thông tin hộ khẩu + nhân khẩu
      const hoKhau = await db.hoKhau.findUnique({
        where: { id: hoKhauId },
        include: { nhanKhaus: true },
      });

      console.log('🏠 HoKhau info:', hoKhau?.soCanHo);

      // Lấy danh sách các khoản phải đóng (Chưa đóng)
      const allKhoanThu = await db.khoanThu.findMany({
        select: {
          id: true,
          tenKhoanThu: true,
          moTa: true,
          loaiPhi: true,
          soTien: true,
          hanNop: true,
          createdAt: true,
          updatedAt: true,
          donGiaDichVu: true,
          donViTinh: true,
          nhaCungCap: true,
          phanLoaiPhi: true,
          phiCoDinh: true,
          phamViApDung: true,
          ghiChuPhamVi: true,
          toa: true,
          tang: true,
          phong: true,
          loaiDichVu: true,
          ghiChuGia: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      
      const daNop = await db.lichSuNopTien.findMany({
        where: { hoKhauId: hoKhauId },
        select: {
          khoanThuId: true,
          soTienDaNop: true,
          ngayNop: true,
          nguoiNop: true,
          ghiChu: true,
          khoanThu: { 
            select: { 
              tenKhoanThu: true, 
              loaiPhi: true, 
              phanLoaiPhi: true,
              donViTinh: true,
              donGiaDichVu: true,
            } 
          },
        },
        orderBy: { ngayNop: 'desc' },
      });

      const daNopIds = daNop.map((item) => item.khoanThuId);

      // Kiểm tra phạm vi áp dụng cho hộ khẩu này
      const checkPhamViApDung = (kt: any) => {
        if (!kt.phamViApDung || kt.phamViApDung === 'TAT_CA') {
          return true;
        }
        
        const soCanHo = hoKhau?.soCanHo || '';
        
        switch (kt.phamViApDung) {
          case 'THEO_TOA':
            // Kiểm tra tòa nhà (VD: A101 -> tòa A)
            const toaCanHo = soCanHo.charAt(0).toUpperCase();
            return kt.toa ? kt.toa.toUpperCase() === toaCanHo : true;
            
          case 'THEO_TANG':
            // Kiểm tra tầng (VD: A101 -> tầng 1, A1502 -> tầng 15)
            const tangMatch = soCanHo.match(/[A-Z](\d+)/i);
            if (tangMatch) {
              const soPhong = tangMatch[1];
              const tang = soPhong.length >= 3 ? parseInt(soPhong.slice(0, -2)) : parseInt(soPhong.charAt(0));
              if (kt.tang) {
                const tangKhoanThu = parseInt(kt.tang);
                return tang === tangKhoanThu;
              }
            }
            return true;
            
          case 'THEO_PHONG':
            // Kiểm tra số phòng cụ thể
            return kt.phong ? soCanHo.includes(kt.phong) : true;
            
          case 'HANG_CAN_HO':
            // Kiểm tra hạng căn hộ
            const hangCanHo = hoKhau?.hangCanHo || 'BINH_THUONG';
            if (kt.ghiChuPhamVi) {
              return kt.ghiChuPhamVi.toUpperCase().includes(hangCanHo);
            }
            return true;
            
          default:
            return true;
        }
      };

      // Lọc các khoản thu áp dụng cho hộ này và chưa nộp
      const chuaNopRaw = allKhoanThu.filter(
        (kt) => !daNopIds.includes(kt.id) && checkPhamViApDung(kt)
      );

      // Tính số tiền thực tế cho từng khoản thu (quan trọng cho THEO_MUC_SU_DUNG)
      const chuaNop = [];
      let tongNo = 0;
      
      for (const kt of chuaNopRaw) {
        let soTienThucTe = kt.soTien || 0;
        
        if (kt.phanLoaiPhi === 'THEO_MUC_SU_DUNG') {
          // Lấy chi tiết sử dụng nếu có
          const chiTiet = await db.chiTietSuDung.findUnique({
            where: {
              hoKhauId_khoanThuId: { hoKhauId, khoanThuId: kt.id }
            }
          });
          soTienThucTe = chiTiet?.thanhTien || 0;
        }
        
        tongNo += soTienThucTe;
        
        // Thêm vào danh sách với số tiền đã tính
        chuaNop.push({
          ...kt,
          soTien: soTienThucTe, // Override soTien với số tiền thực tế
        });
      }
      
      console.log('✅ Returning data - chuaNop:', chuaNop.length, 'lichSu:', daNop.length);
      
      return {
        status: "success",
        data: {
          info: hoKhau,
          chuaNop: chuaNop,
          lichSu: daNop,
          tongNo: tongNo,
        },
      };
    } catch (error: any) {
      console.error('❌ Error in /resident/me:', error);
      set.status = 500;
      return {
        status: "error",
        message: error.message || "Lỗi server khi lấy thông tin cư dân.",
      };
    }
  }, {
    detail: {
      summary: "Lấy thông tin Cư dân",
      description: "Lấy thông tin hộ khẩu, các khoản chưa đóng và lịch sử nộp tiền",
      tags: ["Resident"],
    },
  })

  // API tạo QR Code để nộp tiền
  .post("/generate-qr", async ({ body, headers, set }) => {
    try {
      const user = (headers as any).user;
      if (!user) {
        set.status = 401;
        return { status: "error", message: "Không thể xác thực người dùng" };
      }
      
      const userId = user.id;
      const { khoanThuIds } = body;

      // Lấy thông tin user để có hoKhauId
      const userInfo = await db.user.findUnique({
        where: { id: userId },
        include: { hoKhau: true },
      });

      if (!userInfo || !userInfo.hoKhauId) {
        set.status = 400;
        return {
          status: "error",
          message: "Tài khoản này không liên kết với hộ khẩu nào.",
        };
      }

      // Lấy thông tin các khoản thu
      const khoanThuList = await db.khoanThu.findMany({
        where: { id: { in: khoanThuIds } },
      });

      if (khoanThuList.length === 0) {
        set.status = 400;
        return {
          status: "error",
          message: "Không tìm thấy khoản thu nào.",
        };
      }

      // Tính tổng tiền
      let tongTien = 0;
      for (const khoanThu of khoanThuList) {
        if (khoanThu.phanLoaiPhi === "CO_DINH") {
          tongTien += khoanThu.soTien || 0;
        } else if (khoanThu.phanLoaiPhi === "THEO_MUC_SU_DUNG") {
          // Lấy chi tiết sử dụng nếu có
          const chiTiet = await db.chiTietSuDung.findUnique({
            where: {
              hoKhauId_khoanThuId: { hoKhauId: userInfo.hoKhauId as string, khoanThuId: khoanThu.id }
            }
          });
          tongTien += chiTiet?.thanhTien || 0;
        }
      }

      // Tạo mã giao dịch unique
      const transactionId = `${userInfo.hoKhau?.soCanHo}-${Date.now()}`;

      // QR Code content - Rickroll URL 😄
      const qrContent = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

      return {
        status: "success",
        message: "Tạo QR Code thành công!",
        data: {
          qrContent,
          transactionId,
          tongTien,
          khoanThuList: khoanThuList.map(k => ({
            id: k.id,
            tenKhoanThu: k.tenKhoanThu,
            soTien: k.soTien,
          })),
          thongTinHo: {
            soCanHo: userInfo.hoKhau?.soCanHo,
            tenChuHo: userInfo.hoKhau?.tenChuHo,
          },
        },
      };
    } catch (error: any) {
      set.status = 500;
      return {
        status: "error",
        message: error.message || "Có lỗi xảy ra khi tạo QR Code.",
      };
    }
  }, {
    body: t.Object({
      khoanThuIds: t.Array(t.String(), { minItems: 1 }),
    }),
    detail: {
      summary: "Tạo QR Code thanh toán",
      description: "Tạo QR Code để thanh toán các khoản thu đã chọn",
      tags: ["Resident"],
    },
  })

  // API xác nhận thanh toán (sau khi quét QR)
  .post("/confirm-payment", async ({ body, headers, set }) => {
    try {
      const user = (headers as any).user;
      if (!user) {
        set.status = 401;
        return { status: "error", message: "Không thể xác thực người dùng" };
      }
      
      const userId = user.id;
      const { transactionId, khoanThuIds } = body;

      // Lấy thông tin user để có hoKhauId
      const userInfo = await db.user.findUnique({
        where: { id: userId },
      });

      if (!userInfo || !userInfo.hoKhauId) {
        set.status = 400;
        return {
          status: "error",
          message: "Tài khoản này không liên kết với hộ khẩu nào.",
        };
      }

      const hoKhauId = userInfo.hoKhauId as string;

      // Lấy thông tin các khoản thu
      const khoanThuList = await db.khoanThu.findMany({
        where: { id: { in: khoanThuIds } },
      });

      // Ghi nhận thanh toán cho từng khoản
      const paymentRecords = [];
      for (const khoanThu of khoanThuList) {
        let soTien = 0;
        
        if (khoanThu.phanLoaiPhi === "CO_DINH") {
          soTien = khoanThu.soTien || 0;
        } else if (khoanThu.phanLoaiPhi === "THEO_MUC_SU_DUNG") {
          // Lấy chi tiết sử dụng nếu có
          const chiTiet = await db.chiTietSuDung.findUnique({
            where: {
              hoKhauId_khoanThuId: { hoKhauId: hoKhauId, khoanThuId: khoanThu.id }
            }
          });
          soTien = chiTiet?.thanhTien || 0;
        }

        // Tạo lịch sử nộp tiền
        const lichSu = await db.lichSuNopTien.create({
          data: {
            hoKhauId: hoKhauId,
            khoanThuId: khoanThu.id,
            soTienDaNop: soTien,
            ngayNop: new Date(),
            ghiChu: `Thanh toán qua QR Code - ${transactionId}`,
          },
        });

        paymentRecords.push(lichSu);
      }

      return {
        status: "success",
        message: "Thanh toán thành công! Cảm ơn bạn đã đóng tiền.",
        data: {
          transactionId,
          paymentRecords: paymentRecords.length,
          tongTien: paymentRecords.reduce((sum, record) => sum + record.soTienDaNop, 0),
        },
      };
    } catch (error: any) {
      set.status = 500;
      return {
        status: "error",
        message: error.message || "Có lỗi xảy ra khi xác nhận thanh toán.",
      };
    }
  }, {
    body: t.Object({
      transactionId: t.String(),
      khoanThuIds: t.Array(t.String(), { minItems: 1 }),
    }),
    detail: {
      summary: "Xác nhận thanh toán",
      description: "Xác nhận thanh toán sau khi quét QR Code",
      tags: ["Resident"],
    },
  })

  // Nộp tiền trực tuyến (cho cư dân)
  .post("/nop-tien", async ({ body, headers, set }) => {
    try {
      const user = (headers as any).user;
      if (!user) {
        set.status = 401;
        return { status: "error", message: "Không thể xác thực người dùng" };
      }
      
      const userId = user.id;
      
      // Lấy thông tin user để có hoKhauId
      const userInfo = await db.user.findUnique({
        where: { id: userId },
      });
      
      if (!userInfo || !userInfo.hoKhauId) {
        set.status = 400;
        return {
          status: "error",
          message: "Tài khoản này không liên kết với hộ khẩu nào.",
        };
      }
      
      // Tạo bản ghi nộp tiền
      const lichSuNopTien = await db.lichSuNopTien.create({
        data: {
          hoKhauId: userInfo.hoKhauId,
          khoanThuId: body.khoanThuId,
          soTienDaNop: body.soTienDaNop,
          nguoiNop: body.nguoiNop || 'Cư dân',
          ghiChu: body.ghiChu || 'Thanh toán trực tuyến',
        }
      });
      
      return {
        status: "success", 
        data: lichSuNopTien,
        message: "Nộp tiền thành công"
      };
    } catch (error: any) {
      set.status = 400;
      return {
        status: "error",
        message: error.message || "Lỗi nộp tiền"
      };
    }
  }, {
    body: t.Object({
      khoanThuId: t.String(),
      soTienDaNop: t.Number(),
      nguoiNop: t.Optional(t.String()),
      ghiChu: t.Optional(t.String())
    }),
    detail: { tags: ["Resident"], summary: "Cư dân nộp tiền trực tuyến" }
  });
