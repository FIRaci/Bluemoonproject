const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024, // Thêm giới hạn kích thước tối thiểu
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // Cho phép fetch từ localhost
    },
    // Ẩn thanh menu mặc định của Electron
    autoHideMenuBar: true, 
    // Thêm icon cho cửa sổ (convert app-icon.svg sang PNG trước)
    icon: path.join(__dirname, 'assets/icons/app-icon.png') 
  });

  // Tải file index.html
  mainWindow.loadFile('index.html');

  // Mở DevTools. (Chỉ nên mở khi phát triển)
  // mainWindow.webContents.openDevTools();

  // Xử lý sự kiện đăng xuất từ renderer process
  ipcMain.on('logout', (event) => {
    mainWindow.loadFile('index.html'); // Chuyển về trang đăng nhập
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
