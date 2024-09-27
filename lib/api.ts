import axios from 'axios';

const BASE_URL = 'https://openapi.koreainvestment.com:9443';
const APP_KEY = process.env.NEXT_PUBLIC_APP_KEY;
const APP_SECRET = process.env.NEXT_PUBLIC_APP_SECRET;
const ACCESS_TOKEN = process.env.NEXT_PUBLIC_ACCESS_TOKEN;

interface KospiIndexData {
  stck_prpr: string;  // 주식 현재가
  prdy_ctrt: string;  // 전일 대비율
  prdy_vrss_sign: string;  // 전일 대비 부호
}

export async function fetchKospiIndex(): Promise<KospiIndexData> {
  try {
    const response = await axios.get(`${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price`, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'authorization': `Bearer ${ACCESS_TOKEN}`,
        'appkey': APP_KEY,
        'appsecret': APP_SECRET,
        'tr_id': 'FHKST01010100'
      },
      params: {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: '005930'  // 삼성전자의 종목 코드
      }
    });

    const data = response.data.output;
    return {
      stck_prpr: data.stck_prpr,
      prdy_ctrt: data.prdy_ctrt,
      prdy_vrss_sign: data.prdy_vrss_sign
    };
  } catch (error) {
    console.error('KOSPI 지수를 가져오는 데 실패했습니다:', error);
    throw error;
  }
}
