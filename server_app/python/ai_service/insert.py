from pymongo import MongoClient
import os
import requests
from PIL import Image
from io import BytesIO
# Kết nối MongoDB
client = MongoClient("mongodb+srv://huytehuy:huytehuy@cluster0.i6slrnu.mongodb.net")
db = client["DACN-231"]
collection = db["product"]

# Lấy tất cả URL ảnh
urls = []
for doc in collection.find({}, {"image": 1}):
    if "image" in doc:
        urls.append(doc["image"])

print(f"Tổng số URL lấy được: {len(urls)}")
SAVE_DIR = "products_images"
os.makedirs(SAVE_DIR, exist_ok=True)

for doc in collection.find({}, {"image": 1}):
    if "image" in doc:
        url = doc["image"]
        product_id = str(doc["_id"])
        try:
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()
            img = Image.open(BytesIO(resp.content)).convert("RGB")
            filename = f"{product_id}.jpg"  # Đặt tên file là id sản phẩm
            img.save(os.path.join(SAVE_DIR, filename))
            print(f"Lưu xong: {filename}")
        except Exception as e:
            print(f"Lỗi tải {url}: {e}")