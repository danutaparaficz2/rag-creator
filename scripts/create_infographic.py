#!/usr/bin/env python3
"""
Create a comprehensive visual summary combining improvements, OCR pipeline, and benchmark results.
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np
from pathlib import Path

# Create large figure with multiple sections
fig = plt.figure(figsize=(16, 20))
fig.suptitle('NOT Telescope RAG System: Improvements Summary\nHybrid Retrieval + Context Trimming + Strict Grounding', 
             fontsize=18, fontweight='bold', y=0.995)

# ============================================================================
# SECTION 1: Performance Metrics (Top)
# ============================================================================
ax1 = plt.subplot(4, 1, 1)
ax1.set_xlim(0, 10)
ax1.set_ylim(0, 10)
ax1.axis('off')

# Title
ax1.text(5, 9.5, '📊 PERFORMANCE IMPROVEMENTS', fontsize=14, fontweight='bold', 
         ha='center', bbox=dict(boxstyle='round,pad=0.5', facecolor='#34495E', edgecolor='black', linewidth=2, alpha=0.8), 
         color='white')

# Metrics table
metrics_data = [
    ('Answer Relevance', '0.7000 → 0.7105', '+1.5%', '✓'),
    ('Context Relevance', '0.9333 → 0.9833', '+5.4%', '✓'),
    ('Groundedness', '0.7500 → 0.9333', '+24.4%', '⭐'),
    ('Answer Correctness', '0.6455 → 0.7909', '+22.5%', '⭐'),
]

y_pos = 8.0
for metric, values, gain, star in metrics_data:
    # Metric name
    ax1.text(0.5, y_pos, metric, fontsize=11, fontweight='bold', va='center')
    # Values
    ax1.text(3.0, y_pos, values, fontsize=10, va='center', family='monospace')
    # Gain with color
    color = '#27AE60' if '+' in gain else '#E74C3C'
    ax1.text(5.5, y_pos, gain, fontsize=11, fontweight='bold', va='center', color=color)
    # Star
    ax1.text(6.5, y_pos, star, fontsize=12, va='center')
    # Line
    ax1.plot([0.3, 7], [y_pos - 0.3, y_pos - 0.3], 'k-', linewidth=0.5, alpha=0.3)
    y_pos -= 1.0

# Key insight box
ax1.add_patch(FancyBboxPatch((7.5, 4.5), 2, 3, boxstyle='round,pad=0.1', 
                             facecolor='#E8F8F5', edgecolor='#16A085', linewidth=2))
ax1.text(8.5, 7.0, 'Key Gain Areas:', fontsize=10, fontweight='bold', ha='center')
ax1.text(8.5, 6.3, 'Groundedness\n(+24.4%)', fontsize=9, ha='center', va='center', color='#E74C3C', fontweight='bold')
ax1.text(8.5, 5.2, 'Correctness\n(+22.5%)', fontsize=9, ha='center', va='center', color='#E74C3C', fontweight='bold')

# ============================================================================
# SECTION 2: Three Key Improvements (Middle-Top)
# ============================================================================
ax2 = plt.subplot(4, 1, 2)
ax2.set_xlim(0, 12)
ax2.set_ylim(0, 10)
ax2.axis('off')

ax2.text(6, 9.5, '🔧 THREE KEY TECHNICAL IMPROVEMENTS', fontsize=14, fontweight='bold', 
         ha='center', bbox=dict(boxstyle='round,pad=0.5', facecolor='#34495E', edgecolor='black', linewidth=2, alpha=0.8),
         color='white')

# Improvement 1: Reranking
box1 = FancyBboxPatch((0.2, 3), 3.8, 6, boxstyle='round,pad=0.1', 
                      facecolor='#FEF5E7', edgecolor='#F39C12', linewidth=2)
ax2.add_patch(box1)
ax2.text(2.1, 8.5, '1. Hybrid Reranking', fontsize=11, fontweight='bold', ha='center', color='#F39C12')
ax2.text(2.1, 7.8, 'Blend 3 signals:', fontsize=9, ha='center', style='italic')
ax2.text(2.1, 7.2, '65% Vector Sim\n25% Lexical\n10% Numeric', fontsize=8, ha='center', 
         family='monospace', bbox=dict(boxstyle='round', facecolor='white', alpha=0.9))
ax2.text(2.1, 4.8, '→ Better fact matching\n→ Retrieves exact values', fontsize=8, ha='center', 
         bbox=dict(boxstyle='round', facecolor='#E8F8F5', alpha=0.8))
ax2.text(2.1, 3.4, 'Impact: +22.5% Correctness', fontsize=9, ha='center', fontweight='bold', color='#E74C3C')

# Improvement 2: Context Trimming
box2 = FancyBboxPatch((4.2, 3), 3.8, 6, boxstyle='round,pad=0.1', 
                      facecolor='#FCF3CF', edgecolor='#F1C40F', linewidth=2)
ax2.add_patch(box2)
ax2.text(6.1, 8.5, '2. Context Trimming', fontsize=11, fontweight='bold', ha='center', color='#F1C40F')
ax2.text(6.1, 7.8, 'Reduce noise:', fontsize=9, ha='center', style='italic')
ax2.text(6.1, 7.2, 'Max 1,200 chars\nper chunk\n(was 4+ KB)', fontsize=8, ha='center', 
         family='monospace', bbox=dict(boxstyle='round', facecolor='white', alpha=0.9))
ax2.text(6.1, 4.8, '→ Less distraction\n→ Focus on signal', fontsize=8, ha='center',
         bbox=dict(boxstyle='round', facecolor='#E8F8F5', alpha=0.8))
ax2.text(6.1, 3.4, 'Impact: +24.4% Groundedness', fontsize=9, ha='center', fontweight='bold', color='#E74C3C')

# Improvement 3: Strict Prompt
box3 = FancyBboxPatch((8.2, 3), 3.8, 6, boxstyle='round,pad=0.1', 
                      facecolor='#FADBD8', edgecolor='#E74C3C', linewidth=2)
ax2.add_patch(box3)
ax2.text(10.1, 8.5, '3. Strict System Prompt', fontsize=11, fontweight='bold', ha='center', color='#E74C3C')
ax2.text(10.1, 7.8, 'Force grounding:', fontsize=9, ha='center', style='italic')
ax2.text(10.1, 7.2, '"Use ONLY context"\n"Cite sources"\n"No guessing"', fontsize=8, ha='center', 
         family='monospace', bbox=dict(boxstyle='round', facecolor='white', alpha=0.9))
ax2.text(10.1, 4.8, '→ No hallucination\n→ Explicit citations', fontsize=8, ha='center',
         bbox=dict(boxstyle='round', facecolor='#E8F8F5', alpha=0.8))
ax2.text(10.1, 3.4, 'Impact: +24.4% Groundedness', fontsize=9, ha='center', fontweight='bold', color='#E74C3C')

# ============================================================================
# SECTION 3: Document Processing Pipeline (Middle-Bottom)
# ============================================================================
ax3 = plt.subplot(4, 1, 3)
ax3.set_xlim(0, 12)
ax3.set_ylim(0, 10)
ax3.axis('off')

ax3.text(6, 9.5, '📄 DOCUMENT PROCESSING PIPELINE (PostScript → RAG)', fontsize=14, fontweight='bold',
         ha='center', bbox=dict(boxstyle='round,pad=0.5', facecolor='#34495E', edgecolor='black', linewidth=2, alpha=0.8),
         color='white')

# Pipeline stages
stages = [
    ('📑\n.ps Files\n(PostScript)', 1, 'Input:\n3,291 files'),
    ('🖼️\nRasterize\n(Marker)', 3, 'Convert to\nPDF images'),
    ('🔍\nOCR\n(ocrmypdf)', 5, 'Extract text\n(4 parallel)'),
    ('📝\nChunk\n& Embed', 7, '2,475 chunks\nin SQLite'),
    ('🎯\nRetrieval\n& Rerank', 9, 'Hybrid search\n+ scoring'),
    ('💬\nLLM\nResponse', 11, 'Ollama\nqwen2.5'),
]

y_line = 6.5
for label, x_pos, detail in stages:
    # Circle node
    circle = plt.Circle((x_pos, y_line), 0.35, color='#3498DB', ec='black', linewidth=2, zorder=3)
    ax3.add_patch(circle)
    ax3.text(x_pos, y_line, label, fontsize=7.5, ha='center', va='center', fontweight='bold', color='white')
    
    # Detail below
    ax3.text(x_pos, y_line - 1.2, detail, fontsize=8, ha='center', va='top', style='italic',
             bbox=dict(boxstyle='round,pad=0.3', facecolor='#ECF0F1', alpha=0.8))
    
    # Arrow between stages (except last)
    if x_pos < 11:
        arrow = FancyArrowPatch((x_pos + 0.4, y_line), (x_pos + 1.6, y_line),
                               arrowstyle='->', mutation_scale=20, linewidth=2, color='#34495E')
        ax3.add_patch(arrow)

# Timeline info
ax3.text(1, 7.8, '~5 sec', fontsize=8, ha='center', color='gray', style='italic')
ax3.text(3, 7.8, '~2 min/file', fontsize=8, ha='center', color='gray', style='italic')
ax3.text(5, 7.8, '~1 min/file\n(parallel)', fontsize=8, ha='center', color='gray', style='italic')
ax3.text(7, 7.8, 'one-time', fontsize=8, ha='center', color='gray', style='italic')
ax3.text(9, 7.8, '~100ms', fontsize=8, ha='center', color='gray', style='italic')
ax3.text(11, 7.8, '<5 sec', fontsize=8, ha='center', color='gray', style='italic')

# Corpus info box
corpus_box = FancyBboxPatch((0.2, 0.2), 5.6, 3, boxstyle='round,pad=0.1',
                            facecolor='#E8F8F5', edgecolor='#16A085', linewidth=2)
ax3.add_patch(corpus_box)
ax3.text(2.8, 2.8, 'INDEXED CORPUS', fontsize=10, fontweight='bold', ha='center', color='#16A085')
ax3.text(2.8, 2.2, '📊 303 documents\n🗂️  2,475 chunks\n📁 299 from NOT_Knowledge_Base\n📁 4 from /data/', 
         fontsize=8, ha='center', family='monospace')

# OCR batch info
ocr_box = FancyBboxPatch((6.2, 0.2), 5.6, 3, boxstyle='round,pad=0.1',
                         facecolor='#FEF5E7', edgecolor='#F39C12', linewidth=2)
ax3.add_patch(ocr_box)
ax3.text(8.8, 2.8, 'OCR BATCH DETAILS', fontsize=10, fontweight='bold', ha='center', color='#F39C12')
ax3.text(8.8, 2.2, '⚙️  4 parallel workers\n⏱️  30-60 min runtime\n✅ 3,291 PDFs processed\n🎯 Force OCR mode', 
         fontsize=8, ha='center', family='monospace')

# ============================================================================
# SECTION 4: Before vs After Comparison (Bottom)
# ============================================================================
ax4 = plt.subplot(4, 1, 4)
ax4.set_xlim(0, 12)
ax4.set_ylim(0, 10)
ax4.axis('off')

ax4.text(6, 9.5, '🚀 RETRIEVAL & GENERATION COMPARISON', fontsize=14, fontweight='bold',
         ha='center', bbox=dict(boxstyle='round,pad=0.5', facecolor='#34495E', edgecolor='black', linewidth=2, alpha=0.8),
         color='white')

# Before column
before_box = FancyBboxPatch((0.2, 1), 5.6, 7.5, boxstyle='round,pad=0.1',
                            facecolor='#FADBD8', edgecolor='#E74C3C', linewidth=2.5)
ax4.add_patch(before_box)
ax4.text(2.8, 8.0, '❌ BEFORE TUNING', fontsize=12, fontweight='bold', ha='center', color='#E74C3C')
ax4.text(2.8, 7.3, 'Query: "What is scale factor?"', fontsize=9, ha='center', style='italic', family='monospace')
ax4.text(2.8, 6.6, '1. Vector search (top-5)\n2. No reranking\n3. Full chunks (4+ KB)\n4. Permissive prompt',
         fontsize=8, ha='center', bbox=dict(boxstyle='round', facecolor='white', alpha=0.9))
ax4.text(2.8, 4.5, '❌ Results:\n• Wrong chunks ranked high\n• Lost in context noise\n• Hallucinated answers',
         fontsize=8, ha='center', bbox=dict(boxstyle='round', facecolor='#E74C3C', alpha=0.2))
ax4.text(2.8, 2.0, 'Score: 64.6% Correct\n         75% Grounded', fontsize=9, ha='center',
         fontweight='bold', color='#E74C3C')

# After column
after_box = FancyBboxPatch((6.2, 1), 5.6, 7.5, boxstyle='round,pad=0.1',
                           facecolor='#D5F4E6', edgecolor='#27AE60', linewidth=2.5)
ax4.add_patch(after_box)
ax4.text(8.8, 8.0, '✅ AFTER TUNING', fontsize=12, fontweight='bold', ha='center', color='#27AE60')
ax4.text(8.8, 7.3, 'Query: "What is scale factor?"', fontsize=9, ha='center', style='italic', family='monospace')
ax4.text(8.8, 6.6, '1. Vector search (top-30)\n2. Hybrid reranking\n3. Trimmed (1.2 KB max)\n4. Strict grounding',
         fontsize=8, ha='center', bbox=dict(boxstyle='round', facecolor='white', alpha=0.9))
ax4.text(8.8, 4.5, '✅ Results:\n• Relevant chunks ranked first\n• Clean signal extracted\n• Grounded answers w/ citations',
         fontsize=8, ha='center', bbox=dict(boxstyle='round', facecolor='#27AE60', alpha=0.2))
ax4.text(8.8, 2.0, 'Score: 79.1% Correct\n        93.3% Grounded', fontsize=9, ha='center',
         fontweight='bold', color='#27AE60')

# Arrow between
arrow = FancyArrowPatch((6.0, 4.5), (6.4, 4.5), arrowstyle='<->', mutation_scale=30, 
                       linewidth=3, color='#F39C12', zorder=5)
ax4.add_patch(arrow)
ax4.text(6.2, 5.2, '+22.5%\nCorrectness', fontsize=9, ha='center', fontweight='bold',
         bbox=dict(boxstyle='round', facecolor='#F39C12', alpha=0.7))

plt.tight_layout(rect=[0, 0, 1, 0.992])

# Save figure
output_path = Path('outputs/RAG_improvements_infographic.png')
plt.savefig(output_path, dpi=150, bbox_inches='tight', facecolor='white')
print(f'✓ Comprehensive infographic saved: {output_path}')

plt.close()

print('\n' + '='*70)
print('SUMMARY DOCUMENT CREATED')
print('='*70)
print('\n📄 Detailed markdown summary: RAG_IMPROVEMENTS_SUMMARY.md')
print('   → Complete technical breakdown')
print('   → Architecture & configuration')
print('   → Key learnings & next steps')
print('\n📊 Visual infographic: outputs/RAG_improvements_infographic.png')
print('   → Performance metrics comparison')
print('   → Three key improvements explained')
print('   → Document pipeline visualized')
print('   → Before/after analysis')
print('\n' + '='*70)
