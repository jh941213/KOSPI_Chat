import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { query } = req.query

  if (!query) {
    return res.status(400).json({ error: '쿼리 매개변수가 필요합니다' })
  }

  try {
    const response = await axios.get('https://openapi.naver.com/v1/search/news.json', {
      params: {
        query,
        display: 3,
        sort: 'date'
      },
      headers: {
        'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET
      }
    })

    const items = response.data.items || []; // items가 없을 경우 빈 배열 사용
    res.status(200).json({ items });
  } catch (error) {
    console.error('뉴스 API 오류:', error);
    res.status(500).json({ error: '뉴스를 가져오는 중 오류가 발생했습니다.', items: [] });
  }
}
