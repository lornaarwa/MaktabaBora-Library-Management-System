import os
import sys
import re
import json
import zlib
import base64
import time
import urllib.request
import io
from PIL import Image, ImageDraw, ImageFont

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(ROOT_DIR, "diagrams")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Standard Horizontal A4 Resolution: 2970 x 2100 (Ratio 1.414, 10 px/mm, high-res 250+ DPI)
CANVAS_W = 2970
CANVAS_H = 2100

DIAGRAM_SPECS = [
    # 1. Use Case Diagram
    {
        "source_file": os.path.join(ROOT_DIR, "use_case_diagram.md"),
        "index": 0,
        "output_filename": "use_case_diagram.png",
        "title": "Use Case Diagram: System Actors & Functional Scope",
        "subtitle": "Architecture Specification · SysML / UML Use Case Model · MaktabaBora v1.0"
    },
    # 2. Sequence Diagrams
    {
        "source_file": os.path.join(ROOT_DIR, "sequence_diagrams.md"),
        "index": 0,
        "output_filename": "sequence_01_auth_jwt_lifecycle.png",
        "title": "Sequence 1: Authentication & JWT Token Lifecycle",
        "subtitle": "Architecture Specification · Sequence Workflow · MaktabaBora v1.0"
    },
    {
        "source_file": os.path.join(ROOT_DIR, "sequence_diagrams.md"),
        "index": 1,
        "output_filename": "sequence_02_physical_circulation_fines.png",
        "title": "Sequence 2: Physical Circulation, Checkout & Overdue Fines",
        "subtitle": "Architecture Specification · Sequence Workflow · MaktabaBora v1.0"
    },
    {
        "source_file": os.path.join(ROOT_DIR, "sequence_diagrams.md"),
        "index": 2,
        "output_filename": "sequence_03_hold_reservation_queue.png",
        "title": "Sequence 3: Hold Reservation Queue & Staff Fulfillment",
        "subtitle": "Architecture Specification · Sequence Workflow · MaktabaBora v1.0"
    },
    {
        "source_file": os.path.join(ROOT_DIR, "sequence_diagrams.md"),
        "index": 3,
        "output_filename": "sequence_04_digital_purchase_mpesa_reader.png",
        "title": "Sequence 4: Digital Purchase via M-Pesa STK Push & Lifetime Reader",
        "subtitle": "Architecture Specification · Sequence Workflow · MaktabaBora v1.0"
    },
    {
        "source_file": os.path.join(ROOT_DIR, "sequence_diagrams.md"),
        "index": 4,
        "output_filename": "sequence_05_membership_perks_refund.png",
        "title": "Sequence 5: Membership Pass Subscription & Refund Flow",
        "subtitle": "Architecture Specification · Sequence Workflow · MaktabaBora v1.0"
    },
    {
        "source_file": os.path.join(ROOT_DIR, "sequence_diagrams.md"),
        "index": 5,
        "output_filename": "sequence_06_ai_librarian_rag_assistant.png",
        "title": "Sequence 6: Smart AI Librarian Assistant (RAG & Rate Limiting)",
        "subtitle": "Architecture Specification · Sequence Workflow · MaktabaBora v1.0"
    },
    # 3. Class Diagrams
    {
        "source_file": os.path.join(ROOT_DIR, "class_diagrams.md"),
        "index": 0,
        "output_filename": "class_diagram_01_models.png",
        "title": "Class Diagram 1: Domain Eloquent Models Architecture (14 Models)",
        "subtitle": "Architecture Specification · UML Class Model · MaktabaBora v1.0"
    },
    {
        "source_file": os.path.join(ROOT_DIR, "class_diagrams.md"),
        "index": 1,
        "output_filename": "class_diagram_02_controllers.png",
        "title": "Class Diagram 2: REST Controllers Layer (15 Controllers in 4 Subsystems)",
        "subtitle": "Architecture Specification · UML Class Model · MaktabaBora v1.0"
    },
    {
        "source_file": os.path.join(ROOT_DIR, "class_diagrams.md"),
        "index": 2,
        "output_filename": "class_diagram_03_services.png",
        "title": "Class Diagram 3: Domain Services & Interface Contracts Layer",
        "subtitle": "Architecture Specification · UML Class Model · MaktabaBora v1.0"
    },
    # 4. Database Schema
    {
        "source_file": os.path.join(ROOT_DIR, "database_schema.md"),
        "index": 0,
        "output_filename": "database_schema_er_diagram.png",
        "title": "Relational Database Schema & Entity Relationships (ER Diagram)",
        "subtitle": "Architecture Specification · PostgreSQL Relational Model · MaktabaBora v1.0"
    },
]

def get_system_fonts():
    try:
        font_brand = ImageFont.truetype("segoeuib.ttf", 32)
        font_title = ImageFont.truetype("segoeuib.ttf", 52)
        font_subtitle = ImageFont.truetype("segoeui.ttf", 26)
        font_footer = ImageFont.truetype("segoeui.ttf", 24)
        return font_brand, font_title, font_subtitle, font_footer
    except Exception:
        pass
    try:
        font_brand = ImageFont.truetype("arialbd.ttf", 32)
        font_title = ImageFont.truetype("arialbd.ttf", 52)
        font_subtitle = ImageFont.truetype("arial.ttf", 26)
        font_footer = ImageFont.truetype("arial.ttf", 24)
        return font_brand, font_title, font_subtitle, font_footer
    except Exception:
        f = ImageFont.load_default()
        return f, f, f, f

def render_diagram_to_horizontal_a4(mermaid_code: str, output_path: str, title: str, subtitle: str):
    print(f"Rendering: {title} -> {os.path.basename(output_path)}...")
    
    obj = {
        "code": mermaid_code,
        "mermaid": {
            "theme": "default",
            "themeVariables": {
                "fontFamily": "Segoe UI, sans-serif",
                "fontSize": "14px"
            }
        }
    }
    
    compressed = zlib.compress(json.dumps(obj).encode("utf-8"), level=9)
    b64 = base64.urlsafe_b64encode(compressed).decode("ascii")
    url = f"https://mermaid.ink/img/pako:{b64}?bgColor=white"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    raw_img_data = None
    for attempt in range(1, 4):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=60) as resp:
                if resp.status == 200:
                    raw_img_data = resp.read()
                    break
        except Exception as e:
            print(f"  [Attempt {attempt}/3] Download failed: {e}")
            time.sleep(2)
            
    if not raw_img_data:
        print(f"  [ERROR] Could not render diagram from mermaid.ink")
        return False

    try:
        diag = Image.open(io.BytesIO(raw_img_data)).convert("RGBA")
        
        # Build Horizontal A4 Canvas (2970 x 2100)
        canvas = Image.new("RGB", (CANVAS_W, CANVAS_H), "#FFFFFF")
        draw = ImageDraw.Draw(canvas)
        
        font_brand, font_title, font_subtitle, font_footer = get_system_fonts()
        
        # Top Accent Banner (MaktabaBora Royal Blue)
        draw.rectangle([(0, 0), (CANVAS_W, 14)], fill="#1e40af")
        
        # Header Information
        draw.text((70, 45), "MAKTABABORA LIBRARY MANAGEMENT SYSTEM", fill="#2563eb", font=font_brand)
        draw.text((70, 95), title.upper(), fill="#0f172a", font=font_title)
        draw.text((70, 165), subtitle, fill="#64748b", font=font_subtitle)
        
        # Header Divider
        draw.line([(70, 215), (CANVAS_W - 70, 215)], fill="#e2e8f0", width=2)
        
        # Body Drawing Boundaries
        BODY_X = 70
        BODY_Y = 235
        BODY_W = CANVAS_W - 140  # 2830 px
        BODY_H = 1765            # 2000 - 235 = 1765 px
        
        # Scale diagram to fit inside body area while strictly preserving aspect ratio
        scale = min(BODY_W / diag.width, BODY_H / diag.height)
        new_w = max(1, int(diag.width * scale))
        new_h = max(1, int(diag.height * scale))
        
        resized_diag = diag.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Center in body area
        offset_x = BODY_X + (BODY_W - new_w) // 2
        offset_y = BODY_Y + (BODY_H - new_h) // 2
        
        # Paste diagram onto A4 canvas with alpha channel support
        canvas.paste(resized_diag, (offset_x, offset_y), resized_diag)
        
        # Footer Divider
        draw.line([(70, 2025), (CANVAS_W - 70, 2025)], fill="#e2e8f0", width=2)
        
        # Footer Content
        draw.text((70, 2045), "MaktabaBora Core Architecture Documentation", fill="#94a3b8", font=font_footer)
        draw.text((CANVAS_W // 2 - 250, 2045), title, fill="#64748b", font=font_footer)
        draw.text((CANVAS_W - 550, 2045), "Format: Horizontal A4 (297 x 210 mm)", fill="#94a3b8", font=font_footer)
        
        # Save as high-resolution PNG
        canvas.save(output_path, "PNG", quality=95)
        print(f"  [OK] Saved Horizontal A4 ({CANVAS_W}x{CANVAS_H}) -> {os.path.basename(output_path)} ({os.path.getsize(output_path):,} bytes)")
        return True
        
    except Exception as e:
        print(f"  [ERROR] Failed to composite A4 canvas: {e}")
        return False

def main():
    print(f"=== MaktabaBora Architectural Diagrams Export (Horizontal A4) ===")
    print(f"Output Directory: {OUTPUT_DIR}\n")
    results = []
    
    for spec in DIAGRAM_SPECS:
        if not os.path.exists(spec["source_file"]):
            print(f"Missing source file: {spec['source_file']}")
            continue
            
        with open(spec["source_file"], "r", encoding="utf-8") as fp:
            content = fp.read()
            
        blocks = re.findall(r"```mermaid\n(.*?)\n```", content, re.DOTALL)
        if spec["index"] >= len(blocks):
            print(f"Index {spec['index']} out of bounds in {spec['source_file']}")
            continue
            
        code = blocks[spec["index"]]
        out_path = os.path.join(OUTPUT_DIR, spec["output_filename"])
        
        ok = render_diagram_to_horizontal_a4(code, out_path, spec["title"], spec["subtitle"])
        results.append((spec, ok))
        time.sleep(1) # respectful pacing between renders
        
    print("\n=== Generation Complete Summary ===")
    for spec, ok in results:
        status = "OK" if ok else "FAILED"
        print(f" - [{status}] {spec['output_filename']} ({spec['title']})")

if __name__ == "__main__":
    main()
