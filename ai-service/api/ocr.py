"""
OCR Prescription Processing Module

Handles GPT-4 Vision OCR for prescription data extraction.
Includes image processing, text extraction, and prescription parsing.
"""

from fastapi import HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
import base64
import io
from PIL import Image
import requests
import json
import logging
import os
from datetime import datetime

logger = logging.getLogger(__name__)

# ============================================================================
# Models
# ============================================================================

class PrescriptionData(BaseModel):
    """Extracted prescription data."""
    rightEye: Optional[Dict[str, Any]] = None
    leftEye: Optional[Dict[str, Any]] = None
    pd: Optional[float] = None
    doctor: Optional[str] = None
    patient: Optional[str] = None
    date: Optional[str] = None
    notes: Optional[str] = None
    confidence: Optional[float] = None

class OCRRequest(BaseModel):
    """OCR processing request."""
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    extract_text: bool = True
    parse_prescription: bool = True
    validate_data: bool = True
    include_confidence: bool = True

class OCRResponse(BaseModel):
    """OCR processing response."""
    success: bool
    extracted_text: Optional[str] = None
    prescription_data: Optional[PrescriptionData] = None
    confidence_score: Optional[float] = None
    processing_time: Optional[float] = None
    errors: Optional[List[str]] = None

class BatchOCRRequest(BaseModel):
    """Batch OCR processing request."""
    images: List[str] = Field(..., min_items=1, max_items=10)
    extract_text: bool = True
    parse_prescription: bool = True
    validate_data: bool = True

# ============================================================================
# OCR Processing Service
# ============================================================================

class OCRService:
    """Service for processing prescription images with GPT-4 Vision."""
    
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.openai_model = os.getenv("OPENAI_MODEL", "gpt-4-vision-preview")
        self.max_tokens = int(os.getenv("OPENAI_MAX_TOKENS", "1000"))
        self.temperature = float(os.getenv("OPENAI_TEMPERATURE", "0.1"))
        
        if not self.openai_api_key:
            logger.warning("OPENAI_API_KEY not configured")
    
    async def process_prescription_image(self, request: OCRRequest) -> OCRResponse:
        """Process a prescription image with OCR."""
        start_time = datetime.now()
        
        try:
            # Get image data
            image_data = await self._get_image_data(request)
            if not image_data:
                return OCRResponse(
                    success=False,
                    errors=["No valid image data provided"]
                )
            
            # Extract text using GPT-4 Vision
            extracted_text = await self._extract_text_with_vision(image_data)
            
            prescription_data = None
            confidence_score = None
            
            if request.parse_prescription and extracted_text:
                # Parse prescription data
                prescription_data = await self._parse_prescription_text(extracted_text)
                
                if request.validate_data and prescription_data:
                    # Validate prescription data
                    validation_result = await self._validate_prescription_data(prescription_data)
                    prescription_data.confidence = validation_result.get("confidence", 0.0)
                    confidence_score = validation_result.get("confidence", 0.0)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return OCRResponse(
                success=True,
                extracted_text=extracted_text if request.extract_text else None,
                prescription_data=prescription_data,
                confidence_score=confidence_score,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"OCR processing failed: {str(e)}")
            return OCRResponse(
                success=False,
                errors=[str(e)],
                processing_time=(datetime.now() - start_time).total_seconds()
            )
    
    async def process_batch_images(self, request: BatchOCRRequest) -> List[OCRResponse]:
        """Process multiple prescription images."""
        results = []
        
        for image_url in request.images:
            ocr_request = OCRRequest(
                image_url=image_url,
                extract_text=request.extract_text,
                parse_prescription=request.parse_prescription,
                validate_data=request.validate_data
            )
            
            result = await self.process_prescription_image(ocr_request)
            results.append(result)
        
        return results
    
    async def _get_image_data(self, request: OCRRequest) -> Optional[str]:
        """Get image data from URL or base64."""
        if request.image_base64:
            # Decode base64 image
            try:
                image_data = base64.b64decode(request.image_base64.split(',')[1])
                return base64.b64encode(image_data).decode()
            except Exception as e:
                logger.error(f"Failed to decode base64 image: {str(e)}")
                return None
        
        elif request.image_url:
            # Download image from URL
            try:
                response = requests.get(request.image_url, timeout=30)
                response.raise_for_status()
                
                # Validate image
                image = Image.open(io.BytesIO(response.content))
                image.verify()  # Verify image integrity
                
                # Re-open after verify
                image = Image.open(io.BytesIO(response.content))
                
                # Convert to RGB if necessary
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                
                # Resize if too large
                max_size = 1024
                if max(image.size) > max_size:
                    image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                
                # Convert to base64
                buffer = io.BytesIO()
                image.save(buffer, format='JPEG', quality=85)
                image_data = base64.b64encode(buffer.getvalue()).decode()
                
                return image_data
                
            except Exception as e:
                logger.error(f"Failed to process image from URL: {str(e)}")
                return None
        
        return None
    
    async def _extract_text_with_vision(self, image_data: str) -> Optional[str]:
        """Extract text from image using GPT-4 Vision."""
        if not self.openai_api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.openai_api_key}"
            }
            
            payload = {
                "model": self.openai_model,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": """Please extract all text from this prescription image. 
                                Be very careful to capture all numbers, measurements, and medical terms exactly as written.
                                Include patient name, doctor name, date, and all prescription measurements.
                                Format the output clearly with line breaks to preserve the layout."""
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}"
                                }
                            }
                        ]
                    }
                ],
                "max_tokens": self.max_tokens,
                "temperature": self.temperature
            }
            
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            return result["choices"][0]["message"]["content"].strip()
            
        except Exception as e:
            logger.error(f"GPT-4 Vision API call failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")
    
    async def _parse_prescription_text(self, text: str) -> Optional[PrescriptionData]:
        """Parse extracted text into prescription data structure."""
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.openai_api_key}"
            }
            
            payload = {
                "model": self.openai_model,
                "messages": [
                    {
                        "role": "user",
                        "content": f"""Parse this prescription text and extract the prescription data in JSON format:
                        
                        {text}
                        
                        Return a JSON object with the following structure:
                        {{
                            "rightEye": {{
                                "sphere": number,
                                "cylinder": number,
                                "axis": number,
                                "add": number
                            }},
                            "leftEye": {{
                                "sphere": number,
                                "cylinder": number,
                                "axis": number,
                                "add": number
                            }},
                            "pd": number,
                            "doctor": "string",
                            "patient": "string",
                            "date": "string",
                            "notes": "string"
                        }}
                        
                        Use null for any missing values. Pay close attention to:
                        - Sphere values (positive or negative, usually 2 decimal places)
                        - Cylinder values (negative or 0, usually 2 decimal places)
                        - Axis values (0-180, integers)
                        - Add power for bifocal/progressive (positive, usually 2 decimal places)
                        - Pupillary distance (PD) in millimeters
                        - Doctor and patient names
                        - Prescription date
                        
                        Return ONLY the JSON object, no other text."""
                    }
                ],
                "max_tokens": self.max_tokens,
                "temperature": 0.1
            }
            
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            json_text = result["choices"][0]["message"]["content"].strip()
            
            # Extract JSON from response
            if "```json" in json_text:
                json_text = json_text.split("```json")[1].split("```")[0].strip()
            elif "```" in json_text:
                json_text = json_text.split("```")[1].strip()
            
            prescription_dict = json.loads(json_text)
            
            return PrescriptionData(**prescription_dict)
            
        except Exception as e:
            logger.error(f"Failed to parse prescription text: {str(e)}")
            return None
    
    async def _validate_prescription_data(self, data: PrescriptionData) -> Dict[str, Any]:
        """Validate prescription data and calculate confidence score."""
        confidence = 0.0
        validation_errors = []
        
        # Validate right eye
        if data.rightEye:
            if data.rightEye.get("sphere") is not None:
                sphere = data.rightEye["sphere"]
                if -20.00 <= sphere <= 20.00:
                    confidence += 0.15
                else:
                    validation_errors.append("Right eye sphere out of range")
            
            if data.rightEye.get("cylinder") is not None:
                cylinder = data.rightEye["cylinder"]
                if -6.00 <= cylinder <= 0:
                    confidence += 0.15
                else:
                    validation_errors.append("Right eye cylinder out of range")
            
            if data.rightEye.get("axis") is not None:
                axis = data.rightEye["axis"]
                if 0 <= axis <= 180:
                    confidence += 0.1
                else:
                    validation_errors.append("Right eye axis out of range")
        
        # Validate left eye
        if data.leftEye:
            if data.leftEye.get("sphere") is not None:
                sphere = data.leftEye["sphere"]
                if -20.00 <= sphere <= 20.00:
                    confidence += 0.15
                else:
                    validation_errors.append("Left eye sphere out of range")
            
            if data.leftEye.get("cylinder") is not None:
                cylinder = data.leftEye["cylinder"]
                if -6.00 <= cylinder <= 0:
                    confidence += 0.15
                else:
                    validation_errors.append("Left eye cylinder out of range")
            
            if data.leftEye.get("axis") is not None:
                axis = data.leftEye["axis"]
                if 0 <= axis <= 180:
                    confidence += 0.1
                else:
                    validation_errors.append("Left eye axis out of range")
        
        # Validate PD
        if data.pd is not None:
            if 50 <= data.pd <= 80:
                confidence += 0.1
            else:
                validation_errors.append("PD out of range")
        
        # Validate presence of required fields
        if data.doctor:
            confidence += 0.05
        if data.patient:
            confidence += 0.05
        if data.date:
            confidence += 0.05
        
        return {
            "confidence": min(confidence, 1.0),
            "errors": validation_errors
        }

# Initialize OCR service
ocr_service = OCRService()
