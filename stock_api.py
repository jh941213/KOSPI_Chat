from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
import pandas as pd
from pykrx import stock
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js 앱의 URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StockInfo(BaseModel):
    rank: int
    name: str
    code: str
    changeRate: float

@app.get("/api/top-stocks", response_model=list[StockInfo])
async def get_top_stocks():
    today = datetime.now().strftime("%Y%m%d")
    df = stock.get_market_ohlcv(today, market="KOSPI")
    top_3 = df['등락률'].nlargest(3)

    result = []
    for rank, (ticker, change_rate) in enumerate(top_3.items(), start=1):
        company_name = stock.get_market_ticker_name(ticker)
        result.append(StockInfo(
            rank=rank,
            name=company_name,
            code=ticker,
            changeRate=change_rate
        ))
    
    return result

@app.get("/api/kospi-stocks")
async def get_kospi_stocks():
    today = datetime.now().strftime("%Y%m%d")
    tickers = stock.get_market_ticker_list(today, market="KOSPI")
    stocks = [{"code": ticker, "name": stock.get_market_ticker_name(ticker)} for ticker in tickers]
    return stocks

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)