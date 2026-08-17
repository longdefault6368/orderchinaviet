export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const message = typeof body?.message === 'string' ? body.message.trim() : String(body?.messages?.at(-1)?.content || '').trim();
  if (!message) return new Response('Nội dung tin nhắn là bắt buộc.', { status: 400 });
  const normalized = message.toLowerCase();
  let reply = 'Yêu cầu của bạn đã được ghi nhận. Vui lòng cung cấp mã khách hàng hoặc mã vận đơn để bộ phận hỗ trợ kiểm tra chính xác.';
  if (normalized.includes('cước') || normalized.includes('giá')) reply = 'Bạn có thể xem biểu phí hiện hành tại mục Biểu phí. Cước cuối cùng được tính theo trọng lượng lớn hơn giữa cân thực tế và cân quy đổi.';
  if (normalized.includes('vận đơn') || normalized.includes('kiện')) reply = 'Hãy nhập mã kiện hoặc mã vận đơn Trung Quốc tại trang Tra cứu để xem dữ liệu cập nhật từ kho.';
  if (normalized.includes('khiếu nại')) reply = 'Bạn có thể tạo yêu cầu tại mục Khiếu nại trong tài khoản; hệ thống sẽ cấp mã DSP để theo dõi.';
  return new Response(reply, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
