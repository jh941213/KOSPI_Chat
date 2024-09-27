'use client';

import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, TrendingUp, MessageCircle, Bell, TrendingDown, X, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// HTML 엔티티를 디코딩하는 함수
const decodeHTMLEntities = (text: string) => {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
};

// 뉴스 데이터 타입 정의
type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
};

type CompanyNews = {
  [key: string]: NewsItem[];
};

// 뉴스 API 호출 함수
const fetchCompanyNews = async (company: string): Promise<NewsItem[]> => {
  const response = await fetch(`/api/news?query=${encodeURIComponent(company)}`);
  const data = await response.json();
  return data.items.slice(0, 3).map((item: NewsItem) => ({
    title: decodeHTMLEntities(item.title.replace(/<\/?b>/g, '')),
    link: item.link,
    pubDate: new Date(item.pubDate).toLocaleDateString('ko-KR')
  }));
};

// ChatMessage 타입 정의
type ChatMessage = {
  role: 'user' | 'ai';
  content: string;
};

interface StockInfo {
  rank: number;
  name: string;
  code: string;
  changeRate: number;
}

interface KospiStock {
  code: string;
  name: string;
}

// 회사 이름과 이미지 파일 이름을 매핑하는 객체
const companyImages: { [key: string]: string } = {
  '현대차': 'hyundai',
  '카카오': 'kakao',
  'LG전자': 'lg',
  '네이버': 'naver',
  '삼성전자': 'samsung',
  'SK하이닉스': 'sk'
};

// getImageFileName 함수 수정
const getImageFileName = (company: string) => {
  // 회사 이름에 해당하는 이미지 파일 이름 반환
  return companyImages[company] || 'default';
};

export default function Component() {
  const [kospiIndex, setKospiIndex] = useState<string>('로딩 중...')
  const [kospiChange, setKospiChange] = useState<string>('0.00%')
  const [isPositive, setIsPositive] = useState<boolean>(true)
  const [companyNews, setCompanyNews] = useState<CompanyNews>({})
  const [input, setInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'ai', content: '안녕하세요. KOSPI 관련 질문에 답변 드리겠습니다.' }
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [topStocks, setTopStocks] = useState<StockInfo[]>([]);
  const [isLoadingStocks, setIsLoadingStocks] = useState<boolean>(true);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [kospiStocks, setKospiStocks] = useState<KospiStock[]>([]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchKospiIndex = async () => {
      try {
        const response = await fetch('/api/kospi-index');
        if (!response.ok) {
          throw new Error('KOSPI 데이터를 가져오는데 실패했습니다.');
        }
        const data = await response.json();
        setKospiIndex(data.지수정보);
        const changeRate = data.지수등락율.trim();  // 앞뒤 공백 제거
        setKospiChange(changeRate);
        setIsPositive(changeRate.startsWith('+'));
      } catch (error) {
        console.error('KOSPI 지수를 가져오는 데 실패했습니다:', error)
      }
    };

    const fetchNews = async () => {
      const companies = ['삼성전자', 'SK하이닉스', '카카오', '네이버', 'LG전자', '현대차'];
      const newsData: CompanyNews = {};
      for (const company of companies) {
        newsData[company] = await fetchCompanyNews(company);
      }
      setCompanyNews(newsData);
    };
    
    const fetchTopStocks = async () => {
      setIsLoadingStocks(true);
      try {
        const response = await fetch('http://localhost:8080/api/top-stocks');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched data:', data); // 데이터 로깅
        setTopStocks(data);
      } catch (error) {
        console.error('상위 주식 데이터를 가져오는 데 실패했습니다:', error);
        setTopStocks([]); // 오류 시 빈 배열 설정
      } finally {
        setIsLoadingStocks(false);
      }
    };

    const fetchKospiStocks = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/kospi-stocks');
        if (!response.ok) {
          throw new Error('KOSPI 종목 데이터를 가져오는데 실��했습니다.');
        }
        const data = await response.json();
        setKospiStocks(data);
      } catch (error) {
        console.error('KOSPI 종목 록을 가져오는 데 실패했습니다:', error);
      }
    };

    fetchKospiIndex();
    fetchTopStocks();
    fetchKospiStocks();
    const interval = setInterval(() => {
      fetchKospiIndex();
      fetchTopStocks();
    }, 30000);

    fetchNews();

    // 새 메시지가 추가될 때 채팅 컨테이너를 아래로 스크롤
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }

    return () => clearInterval(interval);
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setChatHistory(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: input }),
      });

      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage: ChatMessage = { role: 'ai', content: data.answer };
      setChatHistory(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('채팅 요청 중 오류 발생:', error);
      setChatHistory(prev => [...prev, { role: 'ai', content: '죄송합니다. 오류가 발생했습니다.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockSelect = (value: string) => {
    const selectedStock = kospiStocks.find(stock => stock.code === value);
    if (selectedStock) {
      setInput(`${selectedStock.name}(${selectedStock.code})에 대해 알려주세요.`);
    }
  };

  const rankEmojis = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-6 flex flex-col">
      <div className="flex-grow">
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
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsPlanModalOpen(true)}>
              프로 플랜
            </Button>
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
              <div ref={chatContainerRef} className="space-y-4 h-96 overflow-y-auto mb-4 px-4">
                {chatHistory.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                    {message.role === 'ai' && (
                      <div className="flex-shrink-0 w-12 h-12 mr-2 overflow-hidden rounded-lg">
                        <Image
                          src="/kdb.png"
                          alt="AI Avatar"
                          width={48}
                          height={48}
                          className="object-cover"
                          layout="fixed"
                        />
                      </div>
                    )}
                    <div className={`flex flex-col max-w-[70%] ${
                      message.role === 'user' ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-white'
                    } rounded-2xl p-3`}>
                      {message.role === 'ai' && (
                        <div className="font-semibold text-sm mb-1">KOSPI AI</div>
                      )}
                      <div className={`${message.role === 'user' ? 'text-black' : 'text-gray-300'} text-sm`}>
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start mb-4">
                    <div className="flex-shrink-0 w-12 h-12 mr-2 overflow-hidden rounded-lg">
                      <Image
                        src="/kdb.png"
                        alt="AI Avatar"
                        width={48}
                        height={48}
                        className="object-cover"
                        layout="fixed"
                      />
                    </div>
                    <div className="bg-gray-700 rounded-2xl p-3 max-w-[70%]">
                      <div className="font-semibold text-sm mb-1">KOSPI AI</div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mb-4">
                <Select onValueChange={handleStockSelect}>
                  <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-gray-100 rounded-lg">
                    <SelectValue placeholder="종목을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600 text-gray-100 max-h-60 overflow-y-auto">
                    {kospiStocks.map((stock) => (
                      <SelectItem key={stock.code} value={stock.code} className="hover:bg-gray-600">
                        {stock.name} ({stock.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <form onSubmit={handleSubmit} className="flex items-center space-x-4">
                <Input
                  className="flex-grow bg-gray-700 border-gray-600 text-gray-100 rounded-lg"
                  placeholder="국내증권에 대해 물어보세요..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                />
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded-lg" disabled={isLoading}>
                  <Send size={18} />
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 shadow-xl">
            <CardHeader className="border-b border-gray-700">
              <CardTitle className="text-xl font-semibold text-blue-300 flex items-center">
                <TrendingUp className="mr-2" /> KOSPI 실시간 지수
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-4xl font-bold text-white mb-4">{kospiIndex}</div>
              <div className={`flex items-center ${isPositive ? 'text-red-500' : 'text-blue-500'} mb-6`}>
                {isPositive ? <TrendingUp size={24} className="mr-2" /> : <TrendingDown size={24} className="mr-2" />}
                <span className="text-2xl font-semibold">{kospiChange}</span>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-300 mb-3">상위 3개 급등주</h3>
                {isLoadingStocks ? (
                  <div className="text-gray-400">데이터를 불러오는 중...</div>
                ) : topStocks.length > 0 ? (
                  topStocks.map((stock, index) => (
                    <div key={stock.code} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between hover:bg-gray-600 transition-colors duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{rankEmojis[index]}</div>
                        <div>
                          <div className="text-white font-semibold text-lg">{stock.name}</div>
                          <div className="text-gray-400 text-sm">{stock.code}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`font-bold text-lg ${stock.changeRate > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          {stock.changeRate > 0 ? '▲' : '▼'} {Math.abs(stock.changeRate).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400">데이터를 불러올 수 없습니다.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-semibold text-blue-300 mt-12 mb-6">주요 기업 실시간 뉴스</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(companyNews).map(([company, news]) => (
            <Card key={company} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl">
              <CardHeader className="pb-2 flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3 overflow-hidden">
                  <Image 
                    src={`/images/${getImageFileName(company)}.png`} 
                    alt={company} 
                    width={32} 
                    height={32}
                    className="object-cover w-full h-full"
                  />
                </div>
                <CardTitle className="text-xl font-semibold text-blue-300">{company}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-300">
                  {news.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className={`w-2 h-2 rounded-full mt-2 mr-2 flex-shrink-0 ${
                        index === 0 ? 'bg-red-500' : 
                        index === 1 ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}></div>
                      <div>
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 transition-colors duration-200">
                          {item.title}
                        </a>
                        <p className="text-xs text-gray-400 mt-0.5">{item.pubDate}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 새로 추가된 푸터 */}
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>Made by KDB</p>
        <p>문의: kim.db@kt.com</p>
      </footer>

      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-blue-300">프로 플랜 선택</h2>
              <button 
                onClick={() => setIsPlanModalOpen(false)} 
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex justify-between space-x-4">
              {[
                { name: '기본', price: '무료', features: ['기본 KOSPI 정보', '제한된 AI 채팅'] },
                { name: '프로', price: '₩9,900/월', features: ['실시간 KOSPI 데이터', '무제한 AI 채팅', '고급 분석 도구'] },
                { name: '엔터프라이즈', price: '맞춤 가격', features: ['모든 프로 기능', '전용 고객 지원', '맞춤형 솔루션'] }
              ].map((plan, index) => (
                <div key={index} className="flex-1 flex flex-col bg-gray-700 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-center mb-1">{plan.name}</h3>
                  <p className="text-2xl font-bold text-center mb-4">{plan.price}</p>
                  <ul className="space-y-2 mb-4 flex-grow">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check size={16} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 transition-colors">
                    선택
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}