from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from paddleocr import PaddleOCR
import tempfile
import os

app = FastAPI(title="Verifeye OCR Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize PaddleOCR once (reused across requests)
ocr = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """Accept an image upload and return all extracted text lines."""
    # Save uploaded file to temp location
    suffix = os.path.splitext(file.filename or "image.png")[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Run PaddleOCR
        result = ocr.ocr(tmp_path, cls=True)

        # Extract text lines with confidence scores
        lines = []
        full_text = ""

        if result and result[0]:
            for line in result[0]:
                text = line[1][0]       # extracted text
                confidence = line[1][1]  # confidence score
                lines.append({
                    "text": text,
                    "confidence": round(confidence, 4),
                })
                full_text += text + "\n"

        return {
            "success": True,
            "full_text": full_text.strip(),
            "lines": lines,
            "line_count": len(lines),
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "full_text": "",
            "lines": [],
            "line_count": 0,
        }
    finally:
        os.unlink(tmp_path)
