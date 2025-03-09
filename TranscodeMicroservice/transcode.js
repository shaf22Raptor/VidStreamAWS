import ffmpeg from 'fluent-ffmpeg';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
ffmpeg.setFfmpegPath(ffmpegPath);
console.log("FFmpeg Path:", ffmpegPath);

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

import { spawn } from 'child_process';

// Use envrionment variables
import dotenv from 'dotenv';
dotenv.config();

const s3 = new S3Client({ region: process.env.REGION });

export async function transcodeVideo(bucket, key) {
  const s3Params = {
    Bucket: bucket,
    Key: key
  };
  try {
    // Fetch the video as a stream from S3
    console.log(`Streaming video from S3... ${bucket}`);
    const { Body: videoStream } = await s3.send(new GetObjectCommand(s3Params));

    // Set up FFmpeg for real-time transcoding into s3
    console.log(`Launching FFmpeg...`);
    const ffmpegProcess = spawn(ffmpegPath, [
      '-i', 'pipe:0',        // Read input from stdin (stream from S3)
      '-c:v', 'libx264',     // Convert video codec to H.264 (for compatibility)
      '-preset', 'fast',     // Faster encoding
      '-b:v', '1000k',       // Limit bitrate to 1000kbps for faster streaming
      '-c:a', 'aac',         // Convert audio codec to AAC
      '-b:a', '128k',        // Set audio bitrate
      '-r', '30',            // Force constant frame rate (CFR) to prevent VFR issues
      '-movflags', 'frag_keyframe+empty_moov', // Makes MP4 streamable
      '-f', 'mp4',           // Output format
      'pipe:1'               // Write output to stdout (stream to S3)
    ], {
      stdio: ['pipe', 'pipe', 'inherit'] // Pipe input & output
    });


    // Pipe the S3 stream into FFmpeg for transcoding
    videoStream.pipe(ffmpegProcess.stdin);

    // Upload the transcoded stream back to S3
    const outputKey = `processed/${key.split("uploads/")[1]}`;
    console.log(`Uploading transcoded video to S3: s3://${bucket}/${outputKey}`);

    // upload transcoded video to the same S3 bucket it collected the video from, as per specifications
    const upload= new Upload({
      client: s3,
      params: {
        Bucket: bucket,
        Key: outputKey,
        Body: ffmpegProcess.stdout, // Stream FFmpeg output to S3
        ContentType: 'video/mp4'
      }
    });

    await upload.done();  

    console.log(`Transcoding & Upload Complete: s3://${bucket}/${outputKey}`);
  } catch (error) {
    console.error(` Transcoding Failed:`, error);
  }
}