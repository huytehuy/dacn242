# ai_service.py
# pip install fastapi uvicorn faiss-cpu sentence-transformers pillow torchvision pydantic[dotenv] python-multipart requests

import os
import json
import pickle
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Body
from pydantic import BaseModel
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
from PIL import Image
from torchvision import transforms
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
app = FastAPI(title="E-commerce AI Service (Visual Search + Product Q&A)")
text_model_name = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
text_model = SentenceTransformer(text_model_name)

TEXT_INDEX_PATH = "python/ai_service/product_text.index"
TEXT_META_PATH  = "python/ai_service/product_text_meta.pkl"
app.mount("/products_images", StaticFiles(directory="python/ai_service/products_images"), name="products_images")

# Thêm đoạn này ngay sau khi tạo app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # hoặc chỉ định domain FE, ví dụ ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# app = FastAPI(title="E-commerce AI Service (Visual Search + Product Q&A)")

class ProductItem(BaseModel):
    id: str
    name: str
    category: Optional[str] = None
    specs: Optional[str] = None
    description: Optional[str] = None
    price: Optional[str] = None
    warranty: Optional[str] = None
    url: Optional[str] = None
    image: Optional[str] = None
    # bạn có thể thêm các field khác tùy DB

class IngestPayload(BaseModel):
    products: List[ProductItem]

@app.post("/ingest-mongo")
def ingest_from_mongo():
    """
    Lấy toàn bộ sản phẩm từ MongoDB và nạp vào FAISS index (giống như ingest-products nhưng tự động lấy từ DB).
    """
    ingest_all_products_from_mongo()
    return {"ok": True, "message": "Đã ingest toàn bộ sản phẩm từ MongoDB"}

# =========================
# 1) VISUAL SEARCH (IMAGE)
# =========================

# Load pretrained CLIP for image embeddings
clip_model = SentenceTransformer("clip-ViT-B-32")
# ingest_all_products_from_mongo()
img_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

PRODUCT_IMG_DIR =  "python/ai_service/products_images"

img_embeddings = []
img_ids = []

if os.path.isdir(PRODUCT_IMG_DIR):
    for file in os.listdir(PRODUCT_IMG_DIR):
        if file.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            path = os.path.join(PRODUCT_IMG_DIR, file)
            with Image.open(path) as im:
                emb = clip_model.encode([im], convert_to_tensor=False, normalize_embeddings=True)
                img_embeddings.append(emb[0])
                img_ids.append(file)

if img_embeddings:
    img_embeddings = np.array(img_embeddings).astype("float32")
    img_index = faiss.IndexFlatIP(img_embeddings.shape[1])
    img_index.add(img_embeddings)
else:
    img_embeddings = None
    img_index = None

from fastapi import APIRouter, Request

def find_products_by_labels(predictions):
    try:
        product_ids = list(predictions.keys())  # Lấy id sản phẩm từ label
        products = []
        print(f"Looking for products matching ids: {product_ids}")

        # Kết nối MongoDB
        client = MongoClient("mongodb+srv://huytehuy:huytehuy@cluster0.i6slrnu.mongodb.net")
        db = client["DACN-231"]
        collection = db["product"]

        for pid in product_ids:
            product = collection.find_one({"_id": pid})  # _id là string nếu bạn lưu file đúng
            if not product:
                # Nếu _id là ObjectId, cần chuyển đổi:
                from bson import ObjectId
                try:
                    product = collection.find_one({"_id": ObjectId(pid)})
                except Exception:
                    product = None
            if product:
                product['_id'] = str(product['_id'])
                products.append({
                    "_id": product.get("_id"),
                    "name_product": product.get("name_product", ""),
                    "description": product.get("description", ""),
                    "price_product": product.get("price_product", 0),
                    "image": product.get("image", ""),
                    "describe": product.get("describe", ""),
                    "gender": product.get("gender", ""),
                    "number": product.get("number", 0),
                    "id_category": product.get("id_category", "")
                })
                print(f"Found product: {product.get('name_product', '')}")
        if not products:
            return {"message": "No products found for the given ids"}

        return products

    except Exception as e:
        print(f"Error finding products: {e}")
        return []

# Ví dụ sử dụng trong endpoint upload-image:
@app.post("/upload-image")
async def search_image(file: UploadFile = File(...), top_k: int = 4):
    if img_index is None:
        return {"results": [], "warning": "No product images indexed."}
    img = Image.open(file.file)
    emb = clip_model.encode([img], convert_to_tensor=False, normalize_embeddings=True)
    D, I = img_index.search(np.array(emb).astype("float32"), top_k)
    results = []
    predictions = {}
    for j, i in enumerate(I[0]):
        file_name = img_ids[i]
        product_id = os.path.splitext(file_name)[0]
        predictions[product_id] = float(D[0][j])
        results.append({
            "file": file_name,
            "score": float(D[0][j]),
            "id": product_id
        })
    # Tìm sản phẩm theo nhãn (id hoặc tên)
    products = find_products_by_labels(predictions)
    return {"predictions": predictions, "products": products}
# =========================
# 2) PRODUCT Q&A (TEXT RAG)
# =========================

# Multilingual text embedding model (hỗ trợ tiếng Việt tốt)

text_index: Optional[faiss.IndexFlatIP] = None
text_meta: List[dict] = []

def normalize(v: np.ndarray) -> np.ndarray:
    if v.ndim == 1:
        norm = np.linalg.norm(v) + 1e-10
        return v / norm
    else:
        norm = np.linalg.norm(v, axis=1, keepdims=True) + 1e-10
        return v / norm

def save_text_index(index: faiss.IndexFlatIP, meta: List[dict]):
    faiss.write_index(index, TEXT_INDEX_PATH)
    with open(TEXT_META_PATH, "wb") as f:
        pickle.dump(meta, f)

def load_text_index():
    global text_index, text_meta
    if os.path.exists(TEXT_INDEX_PATH) and os.path.exists(TEXT_META_PATH):
        text_index = faiss.read_index(TEXT_INDEX_PATH)
        with open(TEXT_META_PATH, "rb") as f:
            text_meta = pickle.load(f)

# Load nếu đã có
load_text_index()

@app.post("/ingest-products")
def ingest_products(payload: IngestPayload):
    global text_index, text_meta
    docs = []
    meta = []
    
    # Tạo docs và meta từ payload
    for p in payload.products:
        text = "\n".join([
            f"Tên: {p.name}",
            f"Ngành hàng: {p.category or ''}",
            f"Giá: {p.price or ''}",
            f"Bảo hành: {p.warranty or ''}",
            f"Thông số: {p.specs or ''}",
            f"Mô tả: {p.description or ''}",
            f"URL: {p.url or ''}",
            f"ID: {p.id}"])
        docs.append(text)
        meta.append({
            "id": p.id,
            "name": p.name,
            "category": p.category,
            "price": p.price,
            "warranty": p.warranty,
            "specs": p.specs,
            "description": p.description,
            "url": p.url,
            "raw": text,
            "image": p.image
        })
    
    print(f"Docs tạo được: {len(docs)}")
    if not docs:
        return {"ok": False, "indexed": 0, "total": 0, "message": "Không có dữ liệu để ingest"}
    
    # embeddings
    embs = text_model.encode(docs, convert_to_numpy=True)
    embs = embs.astype("float32")
    if embs.ndim == 1:
        embs = embs.reshape(1, -1)
    
    # build or extend index
    dim = embs.shape[1]
    if text_index is None:
        text_index = faiss.IndexFlatIP(dim)
        text_meta = []
    elif dim != text_index.d:  # <-- Thêm kiểm tra này
        print(f"Chiều không khớp ({dim} vs {text_index.d}). Tạo lại index...")
        text_index = faiss.IndexFlatIP(dim)
        text_meta = []  # Reset metadata
    
    text_index.add(embs)
    text_meta.extend(meta)
    
    save_text_index(text_index, text_meta)
    return {"ok": True, "indexed": len(docs), "total": len(text_meta)}  
    # Phần còn lại giữ nguyên...
def ingest_all_products_from_mongo():
    # Kết nối MongoDB
    client = MongoClient("mongodb+srv://huytehuy:huytehuy@cluster0.i6slrnu.mongodb.net")
    db = client["DACN-231"]
    collection = db["product"]
    
    # Lấy toàn bộ sản phẩm
    products = list(collection.find({}))
    print(f"Tìm thấy {len(products)} sản phẩm từ MongoDB")

    # Chuyển đổi sang dạng ProductItem
    items = []
    for p in products:
        desc = p.get("describe", "")
        if isinstance(desc, list):
            desc = " ".join(str(x) for x in desc)
            
        # Thêm vào items
        items.append({
            "id": str(p.get("_id")),
            "name": p.get("name_product", ""),
            "category": p.get("id_category", ""),
            "specs": "",  # Thêm nếu bạn có specs
            "description": desc,
            "price": str(p.get("price_product", "")),
            "warranty": "",  # Thêm nếu bạn có warranty
            "url": f"http://shop.huytehuy.id.vn/detail/{p.get('_id')}",
            "image": p.get("image", "")
        })
    
    print(f"Đã chuyển đổi {len(items)} sản phẩm để ingest")
    
    # Gọi hàm ingest_products
    if items:
        result = ingest_products(IngestPayload(products=[ProductItem(**item) for item in items]))
        print(f"Kết quả ingest: {result}")
    else:
        print("Không có sản phẩm nào để ingest!")
class ChatPayload(BaseModel):
    question: str
    top_k: Optional[int] = 5

def call_llm(prompt: str) -> str:
    """
    Gọi LLM:
      - OPENAI: set env LLM_PROVIDER=openai, OPENAI_API_KEY, OPENAI_MODEL
      - OLLAMA: set env LLM_PROVIDER=ollama, OLLAMA_MODEL
      - GEMINI: set env LLM_PROVIDER=gemini, GEMINI_API_KEY, GEMINI_MODEL
    """
    provider = "google".lower()

    if provider == "ollama":
        # ... (giữ nguyên như cũ)
        ...

    elif provider == "google":
        import requests
        GEMINI_MODEL = "gemini-2.5-flash"
        GEMINI_API_KEY = "AIzaSyCiDitui0RlHWHVtEzEsKmzBIq7QmvRMzU"
        if not GEMINI_API_KEY:
            return "Thiếu GEMINI_API_KEY"
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
        headers = {"Content-Type": "application/json"}
        body = {
            "contents": [
                {"parts": [{"text": prompt}]}
            ]
        }
        r = requests.post(url, headers=headers, json=body, timeout=120)
        r.raise_for_status()
        data = r.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception:
            return f"Lỗi parse response Gemini: {json.dumps(data)}"

    else:
        # OpenAI (giữ nguyên như cũ)
        ...

@app.post("/chat")
def chat(payload: ChatPayload):
    if text_index is None or len(text_meta) == 0:
        return {"answer": "Chưa có dữ liệu sản phẩm nào được nạp. Hãy gọi /ingest-products trước.", "sources": []}

    q_emb = text_model.encode([payload.question], convert_to_numpy=True).astype("float32")
    q_emb = normalize(q_emb)
    top_k = payload.top_k or 5
    D, I = text_index.search(q_emb, top_k)

    retrieved = []
    for rank, i in enumerate(I[0]):
        if i < 0 or i >= len(text_meta):
            continue
        m = text_meta[i]
        retrieved.append({
            "rank": rank + 1,
            "score": float(D[0][rank]),
            "id": m["id"],
            "image": m.get("image", ""),
            "name": m["name"],
            "url": m.get("url"),
            "price": m.get("price"),
            "snippet": (m.get("description") or m.get("specs") or "")[:300],
        })

    # Build prompt cho LLM
    context = "\n\n".join([
        f"[{idx+1}] {text_meta[I[0][idx]]['raw']}"
        for idx in range(len(I[0]))
        if I[0][idx] >= 0
    ])

    prompt = f"""
Câu hỏi của khách: "{payload.question}"

Chỉ sử dụng thông tin trong ngữ cảnh dưới đây để trả lời ngắn gọn, có cấu trúc, kèm mã sản phẩm/URL nếu có. Nếu thiếu thông tin, nói rõ "chưa có dữ liệu".
Ngữ cảnh:
{context}
"""
    answer = call_llm(prompt)
    return {"answer": answer, "sources": retrieved}
@app.post("/refresh-image-index")
def refresh_image_index():
    global img_embeddings, img_ids, img_index
    img_embeddings = []
    img_ids = []
    
    if os.path.isdir(PRODUCT_IMG_DIR):
        for file in os.listdir(PRODUCT_IMG_DIR):
            if file.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                path = os.path.join(PRODUCT_IMG_DIR, file)
                with Image.open(path) as im:
                    emb = clip_model.encode([im], convert_to_tensor=False, normalize_embeddings=True)
                    img_embeddings.append(emb[0])
                    img_ids.append(file)
    
    if img_embeddings:
        img_embeddings = np.array(img_embeddings).astype("float32")
        img_index = faiss.IndexFlatIP(img_embeddings.shape[1])
        img_index.add(img_embeddings)
        return {"ok": True, "images_indexed": len(img_ids), "images": img_ids}
    else:
        img_embeddings = None
        img_index = None
        return {"ok": False, "message": "No images found in products_images directory"}