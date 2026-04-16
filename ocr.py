import os
import subprocess
from pathlib import Path

def process_ps_files(root_folder):
    base_path = Path(root_folder)
    
    # Recursively find all .ps files
    for ps_file in base_path.rglob('*.ps'):
        # Define file paths
        # temp_pdf: the non-searchable PDF from ps2pdf
        # final_pdf: the searchable OCR version
        temp_pdf = ps_file.with_suffix('.temp.pdf')
        final_pdf = ps_file.with_suffix('.pdf')
        
        print(f"--- Processing: {ps_file.name} ---")
        
        try:
            # 1. Convert PS to PDF (ps2pdf)
            print(f"Step 1: Converting {ps_file.name} to PDF...")
            subprocess.run(['ps2pdf', str(ps_file), str(temp_pdf)], check=True)
            
            # 2. Run OCR (ocrmypdf)
            # --skip-text: skip OCR if text is already found
            # --clean: clean up temporary files created by the OCR engine
            print(f"Step 2: Applying OCR to {temp_pdf.name}...")
            subprocess.run(['ocrmypdf', '--skip-text', str(temp_pdf), str(final_pdf)], check=True)
            
            # 3. Cleanup: Remove original PS and intermediate PDF
            print(f"Step 3: Cleaning up intermediate files...")
            os.remove(ps_file)
            os.remove(temp_pdf)
            
            print(f"Success: Created {final_pdf.name}")
            
        except subprocess.CalledProcessError as e:
            print(f"Error during command execution for {ps_file.name}: {e}")
        except Exception as e:
            print(f"Unexpected error for {ps_file.name}: {e}")

if __name__ == "__main__":
    # Update this to your target directory
    target_dir = "/Users/danuta.paraficz/Documents/Projects/NOT/NOT_Knowledge_Base"
    process_ps_files(target_dir)