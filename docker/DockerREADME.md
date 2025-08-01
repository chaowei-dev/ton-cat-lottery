# 實用指令
## 查看服務狀態
```bash
docker-compose ps
```

## 查看日誌
```bash
docker-compose logs -f backend    # 後端日誌
docker-compose logs -f contracts  # 合約日誌
```

## 進入容器
```bash
docker-compose exec backend sh   # 進入後端容器
docker-compose exec contracts sh # 進入合約容器
```

## 重啟服務
```bash
docker-compose restart backend   # 重啟後端
docker-compose restart contracts # 重啟合約服務
```

## 停止所有服務
```bash
docker-compose down
```

## 重新構建並啟動
```bash
docker-compose up --build -d
```