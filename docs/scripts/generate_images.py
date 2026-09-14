import os
import sys
import re
import json
import zlib
import base64
import time
import urllib.request

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

DIAGRAM_SPECS = [
    # Use Case
    {
        "source_file": os.path.join(ROOT_DIR, "use_case_diagram.md"),
        "index": 0,
        "output_filename": "use_case_diagram.png",
        "title": "Use Case Diagram - Actors and Functional Operations"
    },
    # Sequence Diagrams
    {
        "source_file": os.path.join(ROOT_DIR, "sequence_diagrams.md"),
        "index": 0,
        "output_filename": "sequence_01_auth_jwt_lifecycle.png",
        "title": "Sequence Diagram 1: Authentication & JWT Token Lifecycle"
    },
    {
        "source_file": os.path.join(ROOT_DIR, "sequence_diagrams.md"),
        "index": 1,
        "output_filename": "sequence_02_physical_circulation_fines.png",
        "title": "Sequence Diagram 2: Physical Circulation, Checkout, Returns & Overdue Fines"
    },
    {
        "source_file": os.path.join(ROOT_DIR, "sequence_diagrams.md"),
        "index": 2,
        "output_filename": "sequence_03_hold_reservation_queue.png",
        "title": "Sequence Diagram 3: Hold Reservation Queue & Staff Fulfillment"
    },
    {
        "source_file": os.path.join(ROOT_DIR, "sequence_diagrams.md"),
        "index": 3,
        "output_filename": "sequence_04_digital_purchase_mpesa_reader.png",
        "title": "Sequence Diagram 4: Digital Book Purchase via M-Pesa STK Push & Lifetime Access Reader"
    },
    {
        "source_file": os.path.join(ROOT_DIR, "sequence_diagrams.md"),
        "index": 4,
        "output_filename": "sequence_05_membership_perks_refund.png",
        "title": "Sequence Diagram 5: Membership Perk Pass Subscription & Refund Flow"
    },
    {
        "source_file": os.path.join(ROOT_DIR, "sequence_diagrams.md"),
        "index": 5,
        "output_filename": "sequence_06_ai_librarian_rag_assistant.png",
        "title": "Sequence Diagram 6: Smart AI Librarian Assistant (Rate-Limited RAG Flow)"
    },
    # Class Diagrams
    {
        "source_file": os.path.join(ROOT_DIR, "class_diagrams.md"),
        "index": 0,
        "output_filename": "class_diagram_01_models.png",
        "title": "Class Diagram 1: Eloquent Models Architecture (14 Models)"
    },
    {
        "source_file": os.path.join(ROOT_DIR, "class_diagrams.md"),
        "index": 1,
        "output_filename": "class_diagram_02_controllers.png",
        "title": "Class Diagram 2: REST Controllers Layer (15 Controllers)"
    },
    {
        "source_file": os.path.join(ROOT_DIR, "class_diagrams.md"),
        "index": 2,
        "output_filename": "class_diagram_03_services.png",
        "title": "Class Diagram 3: Domain Services & Contracts Layer"
    },
    # Database Schema
    {
        "source_file": os.path.join(ROOT_DIR, "database_schema.md"),
        "index": 0,
        "output_filename": "database_schema_er_diagram.png",
        "title": "Relational Database Entity-Relationship (ER) Diagram"
    },
]

def render_mermaid_to_png(mermaid_code: str, output_path: str, title: str):
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
    
    for attempt in range(1, 4):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=60) as resp:
                if resp.status == 200:
                    data = resp.read()
                    with open(output_path, "wb") as out_fp:
                        out_fp.write(data)
                    print(f"  [OK] Successfully saved {os.path.basename(output_path)} ({len(data):,} bytes)")
                    return True
        except Exception as e:
            print(f"  [Attempt {attempt}/3] Failed: {e}")
            time.sleep(2)
            
    print(f"  [ERROR] Could not render {os.path.basename(output_path)}")
    return False

def main():
    print(f"Starting diagram generation into: {OUTPUT_DIR}\n")
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
        
        ok = render_mermaid_to_png(code, out_path, spec["title"])
        results.append((spec, ok))
        time.sleep(1) # respectful pacing
        
    print("\nGeneration complete! Summary:")
    for spec, ok in results:
        status = "OK" if ok else "FAILED"
        print(f" - [{status}] {spec['output_filename']} ({spec['title']})")

if __name__ == "__main__":
    main()
