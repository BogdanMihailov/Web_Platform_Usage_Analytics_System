FROM python:3.11-slim
WORKDIR /site
COPY . /site
EXPOSE 8000
CMD ["python", "-m", "http.server", "8000", "--bind", "0.0.0.0"]
