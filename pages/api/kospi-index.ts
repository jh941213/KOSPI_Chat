import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const apiUrl = "https://api.goodapi.co.kr/api/StockIndex/KOSPI";
    const params = new URLSearchParams({
      sessionID: process.env.KOSPI_API_SESSION_ID || 'test'  // 환경 변수에서 세션 ID를 가져옵니다
    });

    const response = await fetch(`${apiUrl}?${params}`);
    
    if (!response.ok) {
      throw new Error('KOSPI API 요청 실패');
    }

    const data = await response.json();

    if (data.R_CODE !== "0000") {
      throw new Error(data.R_MSG || 'KOSPI API 오류');
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('KOSPI 데이터 가져오기 실패:', error);
    res.status(500).json({ error: '서버 오류' });
  }
}
