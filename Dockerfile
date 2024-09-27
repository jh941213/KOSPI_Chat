FROM python:3.9

WORKDIR /app

COPY requirements_2.txt .
RUN pip install --no-cache-dir -r requirements_2.txt

COPY . .

CMD ["python", "stock_api.py"]