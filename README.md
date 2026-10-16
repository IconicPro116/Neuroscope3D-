# NeuroScope 3D — Frontend

> "See a brain tumour in 3D, measure it, and know how far to trust it."

A research and educational prototype for brain MRI tumour segmentation, volumetric measurement, spatial integrity verification, and interactive 3D / orthogonal slice visualisation.

---

## ⚠️ Scientific & Research Disclaimer

**Research and educational prototype only.** AI-generated segmentation is not a diagnosis and must not be used for treatment decisions, radiotherapy planning, or surgical navigation. This tool is intended solely for computational neuroscience demonstration and methodology audit.

---

## 🌟 Key Features

1. **4-Modality Co-Registered Input Workflow**
   - Individual upload slots for **T1**, **T1Gd (Contrast-Enhanced)**, **T2**, and **FLAIR** sequences (`.nii` and `.nii.gz`).
   - Intelligent filename suggestions and validation state tracking.
   - Optional expert reference ground-truth mask slot supporting BraTS 2021 labels (1: NCR, 2: ED, 4: ET).

2. **Interactive 3D Brain & Tumour Surface Viewer**
   - Built with **Three.js** and **React Three Fiber (R3F)**.
   - Translucent cranial cortex reference envelope.
   - Distinct, color-coded organic meshes for:
     - **Whole Tumour (WT):** Amber/Gold (`#eab308`) — NCR + ED + ET
     - **Tumour Core (TC):** Crimson/Red (`#ef4444`) — NCR + ET
     - **Enhancing Tumour (ET):** Cyan (`#06b6d4`) — Active neovasculature (BraTS Label 4)
   - Real-time 3D spatial crosshair indicator reflecting physical millimeter coordinates.
   - Independent region visibility toggles and opacity sliders.

3. **Synchronized 2D Orthogonal Slice Viewer**
   - Three synchronized views: **Axial (Transverse)**, **Coronal (Frontal)**, and **Sagittal (Median)**.
   - Clear anatomical orientation markers:
     - Axial: Anterior (A), Posterior (P), Left (L), Right (R)
     - Coronal: Superior (S), Inferior (I), Left (L), Right (R)
     - Sagittal: Superior (S), Inferior (I), Anterior (A), Posterior (P)
   - Click-to-navigate crosshair synchronized across all 3 orthogonal planes and the 3D scene.
   - Multi-sequence background view (switch between T1, T1Gd, T2, and FLAIR).
   - Real-time voxel index $[i, j, k]$ and physical world coordinates $[x, y, z]$ in mm via NIfTI affine matrix.

4. **Volumetric Analysis**
   - Precise discrete voxel integration: $V = N_{\text{voxels}} \times (\Delta x \cdot \Delta y \cdot \Delta z) \times 10^{-3}$ in mL.
   - Preserves patient-specific voxel pitch (e.g., isotropic 1.0 mm³).

5. **Verification & Limitations Trust Audit**
   - Separation of:
     - Input and spatial integrity checks (grid compatibility, finite floats, affine orientation).
     - Output file and nesting integrity (ET $\subseteq$ TC $\subseteq$ WT, NIfTI byte read-back).
     - Held-out benchmark evidence (BraTS 2021 validation cohort Dice & sensitivity scores with 95% CI).
     - Full model architecture provenance and explicit known biological limitations.

6. **Export & Session Management**
   - Direct download of original-grid NIfTI segmentation mask (`.nii.gz`).
   - Export of clinical audit report.
   - Clean session reset ("Start New Case") purging temporary client-side object URLs.

---

## 🛠️ Tech Stack

- **Framework:** React 18, Vite, TypeScript
- **Styling:** Tailwind CSS, PostCSS
- **3D Visualization:** Three.js, React Three Fiber, React Three Drei
- **Icons:** Lucide React
- **NIfTI Processing:** NIfTI coordinate affine transformations and spatial geometry

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ or v20+)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/IconicPro116/Neuroscope3D-.git
cd Neuroscope3D-

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## ⚙️ Backend Integration Contract

The frontend is ready to integrate with the Python FastAPI backend.

Configure the backend endpoint in `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_DEMO_SAMPLE=true
```

### Endpoints Supported:
- `POST /api/jobs` — Multi-part form upload (T1, T1Gd, T2, FLAIR, optional reference mask)
- `GET /api/jobs/{job_id}` — Status polling with 7 verification stages
- `GET /api/jobs/{job_id}/result` — Segmentation metadata, volumetric measurements, integrity checks
- `GET /api/jobs/{job_id}/mask` — Original grid NIfTI mask stream
- `GET /api/jobs/{job_id}/report` — Audit report PDF stream
- `DELETE /api/jobs/{job_id}` — Session cleanup

*Note: If the backend is offline, click **"Load Reference BraTS Case"** on the upload page to explore a benchmark case in demo mode.*
