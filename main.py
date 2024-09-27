from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama.llms import OllamaLLM
import os

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션 환경에서는 구체적인 오리진을 지정하세요
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ollama 모델 설정
ollama_host = os.getenv("OLLAMA_HOST", "http://host.docker.internal:11434")
model = OllamaLLM(model="llama3.2:latest", base_url=ollama_host,temperature=0.1)

# 프롬프트 템플릿 정의
template = """질문: {question}

단계별로 생각해 봅시다
답변:"""

prompt = ChatPromptTemplate.from_template(template)

# 체인 생성
chain = prompt | model

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        response = chain.invoke({"question": request.question})
        return ChatResponse(answer=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "KOSPI Chat API가 실행 중입니다."}

# 서버 실행을 위한 코드는 제거합니다. Docker에서는 uvicorn 명령어로 직접 실행합니다.