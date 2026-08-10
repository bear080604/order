export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "*";
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const pathname = url.pathname.replace(/\/$/, "");

    try {
      // 1. GET: Lấy danh sách người dùng và thực đơn
      if (request.method === "GET" && (pathname === "/api/menu" || pathname === "")) {
        const { results } = await env.DB.prepare(
          "SELECT * FROM users ORDER BY name"
        ).all();

        return new Response(
          JSON.stringify(results || []), 
          { headers: corsHeaders }
        );
      }

      // 2. POST: Thêm/cập nhật người dùng
      if (request.method === "POST" && (pathname === "/api/menu" || pathname === "")) {
        const body = await request.json();
        
        // Validate dữ liệu
        if (!body.id || !body.name || !body.menu) {
          return new Response(
            JSON.stringify({ 
              status: "error", 
              message: "Thiếu id, name hoặc menu" 
            }), 
            { status: 400, headers: corsHeaders }
          );
        }

        // Chuyển menu object thành JSON string để lưu
        const menuJson = JSON.stringify(body.menu);

        // Kiểm tra user đã tồn tại chưa
        const existing = await env.DB.prepare(
          "SELECT id FROM users WHERE id = ?"
        ).bind(body.id).first();

        if (existing) {
          // Update nếu đã tồn tại
          await env.DB.prepare(
            "UPDATE users SET name = ?, menu = ? WHERE id = ?"
          ).bind(body.name, menuJson, body.id).run();
        } else {
          // Insert nếu chưa tồn tại
          await env.DB.prepare(
            "INSERT INTO users (id, name, menu) VALUES (?, ?, ?)"
          ).bind(body.id, body.name, menuJson).run();
        }

        return new Response(
          JSON.stringify({ 
            status: "success", 
            message: "Đã lưu thành công!" 
          }), 
          { headers: corsHeaders }
        );
      }

      // 3. DELETE: Xóa người dùng
      if (request.method === "DELETE" && (pathname === "/api/menu" || pathname === "")) {
        const userId = url.searchParams.get("id");
        
        if (userId) {
          await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
          return new Response(
            JSON.stringify({ 
              status: "success", 
              message: `Đã xóa người dùng ${userId}` 
            }), 
            { headers: corsHeaders }
          );
        }

        // Xóa tất cả
        if (url.searchParams.get("all") === "true") {
          await env.DB.prepare("DELETE FROM users").run();
          return new Response(
            JSON.stringify({ 
              status: "success", 
              message: "Đã xóa toàn bộ!" 
            }), 
            { headers: corsHeaders }
          );
        }
      }

      return new Response(
        JSON.stringify({ 
          status: "error", 
          message: `Endpoint '${url.pathname}' không hợp lệ` 
        }), 
        { status: 404, headers: corsHeaders }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({ 
          status: "error", 
          message: error.message 
        }), 
        { status: 500, headers: corsHeaders }
      );
    }
  }
};
