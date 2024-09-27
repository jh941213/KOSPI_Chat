import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, Send, TrendingUp, BarChart2, MessageCircle, Bell } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export default function Component() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', content: '안녕하세요. KOSPI 관련 질문에 답변 드리겠습니다.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://0.0.0.0:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: input }),
      });

      if (!response.ok) {
        throw new Error('서버 응답 오류');
      }

      const data = await response.json();
      const aiMessage: ChatMessage = { role: 'ai', content: data.answer };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('채팅 요청 중 오류 발생:', error);
      const errorMessage: ChatMessage = { 
        role: 'ai', 
        content: '죄송합니다. 오류가 발생했습니다.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text">
              KOSPI Chat
            </h1>
            <p className="text-blue-300 mt-2">실시간 국내 증시 분석 및 채팅</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="text-blue-300 hover:text-blue-100">
              <Bell size={20} className="mr-2" />
              알림
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">프로 플랜</Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 bg-gray-800 border-gray-700 shadow-xl">
            <CardHeader className="border-b border-gray-700">
              <CardTitle className="text-2xl font-semibold text-blue-300 flex items-center">
                <MessageCircle className="mr-2" /> KOSPI AI 채팅
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 h-96 overflow-y-auto mb-4">
                {messages.map((msg, index) => (
                  <div key={index} className={`rounded-lg p-4 ${msg.role === 'ai' ? 'bg-gray-700' : 'bg-blue-600'}`}>
                    <p className={msg.role === 'ai' ? 'text-gray-300' : 'text-white'}>
                      {msg.role === 'ai' ? 'AI: ' : '사용자: '}{msg.content}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center space-x-4">
                <Input
                  className="flex-grow bg-gray-700 border-gray-600 text-gray-100 rounded-full"
                  placeholder="국내증권에 대해 물어보세요..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <Button className="bg-blue-600 hover:bg-blue-700 rounded-full" onClick={handleSend}>
                  <Send size={18} />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 shadow-xl">
            <CardHeader className="border-b border-gray-700">
              <CardTitle className="text-xl font-semibold text-blue-300 flex items-center">
                <TrendingUp className="mr-2" /> KOSPI 실시간 지수
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-4xl font-bold text-green-400 mb-4">2,543.41</div>
              <div className="flex items-center text-green-400">
                <TrendingUp size={24} className="mr-2" />
                <span className="text-2xl font-semibold">+1.23%</span>
              </div>
              <div className="mt-6 bg-gray-700 rounded-lg p-4 h-48 flex items-center justify-center">
                <BarChart2 size={64} className="text-blue-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-semibold text-blue-300 mt-12 mb-6">주요 기업 실시간 뉴스</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {['삼성전자', 'SK하이닉스', '카카오', '네이버', 'LG전자', '현대차'].map((company) => (
            <Card key={company} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold text-blue-300">{company}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    {company} 2분기 실적 예상치 상회
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                    신규 기술 개발 성공, 특허 출원
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    해외 시장 진출 가속화 전략 발표
                  </li>
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}