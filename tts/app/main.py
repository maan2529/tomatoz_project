import os
import uuid
import asyncio
import random
import time
from typing import List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from a4f_local import A4F
from pydub import AudioSegment
from pydub.utils import which
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

client = A4F()

# FastAPI app
app = FastAPI(title="TTS Audio Server")

# Directory to store temporary audio files
TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)

# Check if ffmpeg is available
ffmpeg_path = which("ffmpeg")
if ffmpeg_path:
    AudioSegment.converter = ffmpeg_path
    print(f"FFmpeg found at: {ffmpeg_path}")
else:
    print("WARNING: FFmpeg not found! MP3 export may fail.")


class AudioSegmentRequest(BaseModel):
    role: str
    para: str

class ParallelAudioRequest(BaseModel):
    segments: List[AudioSegmentRequest]


def upload_to_cloudinary(file_path: str, max_retries: int = 3) -> str:
    """
    Upload audio file to Cloudinary with retry logic.
    """
    file_size = os.path.getsize(file_path)
    print(f"Attempting to upload {file_path} ({file_size} bytes / {file_size / 1024:.2f} KB)")
    
    for attempt in range(max_retries):
        try:
            print(f"Upload attempt {attempt + 1}/{max_retries}")
            
            result = cloudinary.uploader.upload(
                file_path,
                resource_type="video",
                folder="tts_audio",
                overwrite=True,
                invalidate=True
            )
            
            url = result['secure_url']
            print(f"Upload successful: {url}")
            return url
            
        except Exception as e:
            print(f"Upload attempt {attempt + 1} failed: {str(e)}")
            
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt
                print(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                raise Exception(f"Cloudinary upload failed after {max_retries} attempts: {str(e)}")


def generate_single_audio(segment: AudioSegmentRequest) -> str:
    """
    Generate a single WAV audio file from text with a specified voice.
    """
    try:
        audio_bytes = client.audio.speech.create(
            model="tts-1",
            input=segment.para,
            voice=segment.role,
            format="wav"
        )
        filename = f"{segment.role}_{uuid.uuid4().hex[:8]}.wav"
        file_path = os.path.join(TEMP_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(audio_bytes)
        return file_path
    except Exception as e:
        raise Exception(f"TTS generation failed for voice '{segment.role}': {str(e)}")


async def generate_audio_parallel(segments: List[AudioSegmentRequest]) -> List[str]:
    """
    Generate multiple audio segments in parallel and return file paths in order.
    """
    loop = asyncio.get_event_loop()
    tasks = [loop.run_in_executor(None, generate_single_audio, segment) for segment in segments]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for res in results:
        if isinstance(res, Exception):
            raise res

    return results


def cleanup_temp_files(file_paths: List[str]):
    """
    Delete all temporary audio segment files safely after merging.
    """
    for path in file_paths:
        try:
            if os.path.exists(path):
                os.remove(path)
                print(f"Deleted: {path}")
        except Exception as e:
            print(f"Warning: Could not delete {path} — {e}")


@app.get("/")
async def root():
    """
    Health check endpoint - no authentication required.
    """
    return {"status": "ok", "message": "TTS Audio Server is running"}

@app.post("/generate-audio")
async def generate_audio(segment: AudioSegmentRequest):
    """
    Generate a single audio file from one voice.
    """
    try:
        file_path = generate_single_audio(segment)
        return {"file_path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-parallel-audio")
async def generate_parallel_audio(request: ParallelAudioRequest):
    segment_paths = []
    merged_file = None
    
    try:
        segment_paths = await generate_audio_parallel(request.segments)

        combined = AudioSegment.empty()
        timeline_data = []
        current_time_ms = 0

        for idx, path in enumerate(segment_paths):
            audio = AudioSegment.from_file(path, format="wav")
            duration_ms = len(audio)
            start_time = current_time_ms
            end_time = current_time_ms + duration_ms

            timeline_data.append({
                "role": request.segments[idx].role,
                "text": request.segments[idx].para,
                "start": start_time / 1000,
                "end": end_time / 1000
            })

            combined += audio
            pause_duration = random.randint(500, 1500)
            combined += AudioSegment.silent(duration=pause_duration)
            current_time_ms = end_time + pause_duration

        print(f"Original audio duration: {len(combined)}ms")
        combined = combined.set_channels(1) 
        combined = combined.set_frame_rate(22050)  
        
        merged_file = os.path.join(TEMP_DIR, f"merged_{uuid.uuid4().hex[:8]}.mp3")
        combined.export(
            merged_file, 
            format="mp3",
            bitrate="128k", 
            parameters=["-ac", "1"]
        )
        
        file_size = os.path.getsize(merged_file)
        print(f"Merged MP3 created: {file_size} bytes ({file_size / 1024:.2f} KB)")
        
        if file_size < 1000:
            raise Exception("Merged audio file is too small, likely corrupt")

        merged_url = upload_to_cloudinary(merged_file)

        cleanup_temp_files(segment_paths)

        return {
            "merged_audio_url": merged_url,
            "timeline": timeline_data,
            "total_duration_sec": round(current_time_ms / 1000, 2)
        }

    except Exception as e:
        print(f"Error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        if segment_paths:
            cleanup_temp_files(segment_paths)
        if merged_file and os.path.exists(merged_file):
            cleanup_temp_files([merged_file])