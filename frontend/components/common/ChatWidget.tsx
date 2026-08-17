'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Headset, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function formatMessageContent(content: string) {
  const lines = content.split('\n');
  return lines.map((line, lineIdx) => {
    const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
    const cleanLine = isBullet ? line.trim().substring(2) : line;

    const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
    const renderedLine = parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    if (isBullet) {
      return (
        <li key={lineIdx} className="ml-4 list-disc list-inside my-1">
          {renderedLine}
        </li>
      );
    }

    return (
      <p key={lineIdx} className="my-1 min-h-[1rem]">
        {renderedLine}
      </p>
    );
  });
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDot, setShowDot] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI OrderChinaViet. Tôi có thể giúp gì cho bạn về tra cứu vận đơn, tính giá cước hoặc quy trình gửi hàng Quảng Châu hôm nay?',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on client-side mount
  useEffect(() => {
    const saved = localStorage.getItem('ocv_chat_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse chat history:', e);
      }
    }
  }, []);

  // Save chat history to localStorage when messages update
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem('ocv_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  // Sync conversation history across multiple browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ocv_chat_history' && e.newValue) {
        try {
          setMessages(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Storage sync error:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (showDot) setShowDot(false);
  };

  const getFallbackResponse = (userQuery: string): string => {
    const q = userQuery.toLowerCase();
    if (q.includes('cước') || q.includes('giá') || q.includes('tính')) {
      return '**Bảng Giá Cước Vận Chuyển OrderChinaViet:**\n* **Đường bộ chính ngạch (3-7 Ngày):** từ 18,000₫ - 22,000₫ / kg.\n* **Đường bay hỏa tốc (1-2 ngày):** 45,000₫ / kg.\n* **Quy tắc thể tích:** (Dài x Rộng x Cao cm) / 6000.\nBạn có thể dùng công cụ tính cước ở trang chủ để có con số chính xác nhất!';
    }
    if (q.includes('kho') || q.includes('quảng châu') || q.includes('địa chỉ')) {
      return '**Kho Ký Nhận Quảng Châu:**\n* **Địa chỉ:** 广东省 广州市 白云区 Logistics Park No. 88 [Mã KH của bạn]\n* **Giờ nhận hàng:** 24/7 liên tục.\nVui lòng ghi kèm Mã Khách Hàng (VD: OCV000001) lên tên người nhận để kho ký nhận tự động!';
    }
    if (q.includes('tra cứu') || q.includes('vận đơn') || q.includes('theo dõi')) {
      return 'Bạn có thể nhập trực tiếp **Mã vận đơn SF, YT, ZTO** hoặc **Mã kiện PKG** vào ô tra cứu ở trên đầu trang chủ để kiểm tra hành trình hàng hóa realtime!';
    }
    if (q.includes('1688') || q.includes('taobao') || q.includes('mua hộ')) {
      return '**Dịch Vụ Mua Hộ 1688 / Taobao / Tmall:**\nOrderChinaViet hỗ trợ bạn đàm phán giá sỉ tận xưởng, thanh toán hộ qua Alipay và khiếu nại nhà bán nếu giao sai hoặc thiếu hàng.';
    }
    return 'Cảm ơn bạn đã liên hệ OrderChinaViet! Đội ngũ tư vấn viên luôn sẵn sàng hỗ trợ quý khách. Bạn có thể để lại câu hỏi cụ thể hoặc gọi tổng đài 1900 688 888 để được giải đáp ngay!';
  };

  const getAIResponse = async (chatHistory: Message[], onChunk: (text: string) => void) => {
    setIsTyping(true);
    const lastUserMsg = chatHistory[chatHistory.length - 1]?.content || '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!response.ok) {
        throw new Error('API offline');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder('utf-8');
      let done = false;
      let accumulated = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          accumulated += chunk;
          onChunk(accumulated);
        }
      }

      return accumulated;
    } catch (error) {
      // Simulate intelligent fallback delay
      await new Promise((res) => setTimeout(res, 600));
      return getFallbackResponse(lastUserMsg);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    const text = inputVal.trim();
    if (!text || isTyping) return;

    const newMessages = [...messages, { role: 'user', content: text } as Message];
    setMessages(newMessages);
    setInputVal('');

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    const updateLastMessage = (content: string) => {
      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = { role: 'assistant', content };
        }
        return updated;
      });
    };

    const finalReply = await getAIResponse(newMessages, updateLastMessage);
    updateLastMessage(finalReply);
  };

  const handleQuickReply = async (text: string) => {
    if (isTyping) return;

    const newMessages = [...messages, { role: 'user', content: text } as Message];
    setMessages(newMessages);

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    const updateLastMessage = (content: string) => {
      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = { role: 'assistant', content };
        }
        return updated;
      });
    };

    const finalReply = await getAIResponse(newMessages, updateLastMessage);
    updateLastMessage(finalReply);
  };

  return (
    <div id="chatWidget" className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      <div
        id="chatWindow"
        className={`absolute bottom-16 right-0 w-[calc(100vw-2.5rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ${isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-10 pointer-events-none'
          }`}
      >
        {/* Header */}
        <div className="bg-primary-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/20">
                <Headset className="w-5 h-5 text-white" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-primary-600"></div>
            </div>
            <div>
              <p className="font-bold text-sm">Trợ lý AI OrderChinaViet</p>
              <p className="text-xs text-primary-100 font-medium">Hỗ trợ 24/7 online</p>
            </div>
          </div>
          <button onClick={toggleChat} className="text-white/80 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages list */}
        <div
          id="chatMessages"
          className="flex-1 p-4 space-y-4 max-h-[360px] min-h-[280px] overflow-y-auto bg-slate-50 text-xs sm:text-sm"
        >
          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs shrink-0 border border-primary-200">
                  OCV
                </div>
              )}
              <div
                className={`${msg.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-slate-800 border border-slate-200'
                  } p-3 rounded-2xl shadow-sm max-w-[85%] leading-relaxed`}
              >
                {msg.role === 'assistant' && msg.content === '' ? (
                  <div className="flex items-center gap-1.5 min-w-[40px] py-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                ) : (
                  formatMessageContent(msg.content)
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick replies */}
        <div className="p-2 border-t border-slate-100 bg-white flex gap-1.5 flex-wrap">
          <button
            onClick={() => handleQuickReply('Bảng giá cước vận chuyển')}
            disabled={isTyping}
            className="bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-slate-700 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Tính giá cước
          </button>
          <button
            onClick={() => handleQuickReply('Địa chỉ kho Quảng Châu')}
            disabled={isTyping}
            className="bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-slate-700 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Kho Quảng Châu
          </button>
          <button
            onClick={() => handleQuickReply('Tra cứu vận đơn')}
            disabled={isTyping}
            className="bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-slate-700 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Tra cứu vận đơn
          </button>
        </div>

        {/* Input area */}
        <div className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
          <input
            type="text"
            placeholder={isTyping ? 'AI đang soạn câu trả lời...' : 'Nhập thắc mắc của bạn...'}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isTyping}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 text-xs sm:text-sm text-slate-800 disabled:bg-slate-50"
          />
          <button
            onClick={handleSend}
            disabled={isTyping}
            className="bg-primary-600 hover:bg-primary-700 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50 shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Trigger button */}
      <button
        onClick={toggleChat}
        className="bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center justify-center relative"
      >
        <MessageSquare className="w-6 h-6" />
        {showDot && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-ping"></span>
        )}
      </button>
    </div>
  );
}
