FROM python:3.12.7-slim-bookworm

WORKDIR /app

RUN groupadd --system app && useradd --system --gid app --no-create-home app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY frontend/ /frontend

ENV FRONTEND_DIR=/frontend

RUN chown -R app:app /app /frontend
USER app

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "wsgi:app"]
