# AI Agent Server

## 概要

- FastAPI で作成された AI Agent Server

- Python 系の AI Agent などは、こちらの Server で管理する。

## 注意事項

1. DB の読み取りは、OK

2. DB の更新処理は、System Server (Hono) Server に寄せる。

3. 処理フローは、System 担当者と要相談 📝

   - FE -> System Server(DB 読み取り/更新) -> AI Agent Server みたいな処理フローも検討
