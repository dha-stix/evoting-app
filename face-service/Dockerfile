FROM python:3.11-slim

RUN apt-get update \
	&& apt-get install -y --no-install-recommends build-essential curl libgl1 libglib2.0-0 \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

ENV MODEL_DIR=/models
COPY download_models.sh .
RUN sh download_models.sh

COPY main.py .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
