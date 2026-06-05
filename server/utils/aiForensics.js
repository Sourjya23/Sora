const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const os = require("os");
const Meeting = require("../models/Meeting");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

exports.processInterviewVideo = async (meetingId, recordingUrl, finalCode, problemStatement, telemetryEvents) => {
  let localVideoPath = "";
  try {
    console.log(`[Forensics] Starting analysis for meeting ${meetingId}`);
    
    // 1. Download the video from Cloudinary
    console.log(`[Forensics] Downloading video from ${recordingUrl}`);
    const response = await axios({
      method: "GET",
      url: recordingUrl,
      responseType: "stream"
    });
    
    localVideoPath = path.join(os.tmpdir(), `interview_${meetingId}.webm`);
    const writer = fs.createWriteStream(localVideoPath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
    
    console.log(`[Forensics] Uploading video to Gemini API...`);
    // 2. Upload to Gemini File Manager
    const uploadResult = await fileManager.uploadFile(localVideoPath, {
      mimeType: "video/webm",
      displayName: `Interview_${meetingId}`
    });
    const fileUri = uploadResult.file.uri;
    const fileName = uploadResult.file.name;
    
    console.log(`[Forensics] Waiting for video processing...`);
    // 3. Wait for the video to be active
    let file = await fileManager.getFile(fileName);
    while (file.state === "PROCESSING") {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      file = await fileManager.getFile(fileName);
    }
    
    if (file.state === "FAILED") {
      throw new Error("Video processing failed in Gemini API.");
    }
    
    console.log(`[Forensics] Generating forensic report...`);
    // 4. Generate Content with Fallback Models
    const models = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-3.5-flash", "gemini-flash-latest"];
    let result = null;
    let lastError = null;
    
    const prompt = `
You are an expert technical interviewer and forensic analyst.
You have been provided with the video recording of a candidate's interview, their final submitted code, the problem statement, and raw browser telemetry events.

Problem Statement:
${problemStatement}

Final Submitted Code:
${finalCode}

Raw Telemetry Events (JSON string, times are approximate):
${JSON.stringify(telemetryEvents)}

Instructions:
1. Analyze the time and space complexity (Big O) of the submitted code. Determine if it is optimal.
2. Check the video carefully to see if the screen was shared the entire time.
3. Cross-reference the "visibilitychange" (tab change) telemetry events with the video to verify if the candidate looked up answers.
4. Cross-reference the "paste" telemetry events with the video to verify if they pasted large chunks of code.
5. Provide a final recommendation: "Offer", "Reject", or "Borderline".

Provide your response ONLY as a valid JSON object matching this schema:
{
  "timeComplexity": "String (e.g. O(N))",
  "spaceComplexity": "String (e.g. O(1))",
  "codeCorrectness": "String (explain if it works)",
  "screenSharedEntirely": Boolean,
  "tabChanges": ["Array of strings (timestamps/explanations)"],
  "copyPasted": ["Array of strings (timestamps/explanations)"],
  "recommendation": "Offer | Reject | Borderline",
  "detailedSummary": "String (detailed analysis of their performance)"
}
    `;

    for (const modelName of models) {
      try {
        console.log(`[Forensics] Attempting analysis using model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent([
          {
            fileData: {
              mimeType: "video/webm",
              fileUri: fileUri
            }
          },
          { text: prompt }
        ]);
        console.log(`[Forensics] Successfully generated report using ${modelName}`);
        break; // Break the loop on success
      } catch (err) {
        console.error(`[Forensics] Failed to generate with ${modelName}:`, err.message);
        lastError = err;
      }
    }

    if (!result) {
      throw lastError || new Error("All fallback models failed to generate content.");
    }

    const responseText = result.response.text();
    // 5. Parse JSON
    // Clean up markdown formatting if any
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const reportData = JSON.parse(cleanJson);
    reportData.isProcessing = false;

    console.log(`[Forensics] Report generated successfully! Saving to DB.`);
    // 6. Update Database
    await Meeting.findOneAndUpdate(
      { meetingId },
      { $set: { forensicReport: reportData } }
    );
    
    // Delete file from Gemini API to save quota
    await fileManager.deleteFile(fileName);
    
  } catch (err) {
    console.error(`[Forensics] Error processing video for ${meetingId}:`, err);
    await Meeting.findOneAndUpdate(
      { meetingId },
      { $set: { "forensicReport.isProcessing": false, "forensicReport.detailedSummary": "Error generating report: " + err.message } }
    );
  } finally {
    // 7. Cleanup local file
    if (localVideoPath && fs.existsSync(localVideoPath)) {
      fs.unlinkSync(localVideoPath);
    }
  }
};
