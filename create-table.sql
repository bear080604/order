-- Tạo bảng employees để lưu thông tin nhân viên và thực đơn
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  menu_data TEXT NOT NULL  -- Lưu dạng JSON string
);

-- Index để tìm kiếm nhanh hơn
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);
