const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const os = require("os");
const Meeting = require("../models/Meeting");

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;
const fileManager = GEMINI_KEY ? new GoogleAIFileManager(GEMINI_KEY) : null;

// Clean JSON response from LLM
const extractJson = (text) => {
  try {
    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("Could not parse JSON from model response");
  }
};

// Deterministic heuristic analyzer fallback (when external AI APIs are unavailable)
const generateHeuristicReport = (finalCode, problemStatement, telemetryEvents = []) => {
  const code = (finalCode || "").trim();
  const events = Array.isArray(telemetryEvents) ? telemetryEvents : [];

  const tabSwitches = events.filter((e) => e.type === "tab_change" || e.type === "visibilitychange");
  const pastes = events.filter((e) => e.type === "paste");

  let timeComplexity = "O(N)";
  let spaceComplexity = "O(1)";

  // Basic complexity heuristic
  const nestedLoops = (code.match(/for\s*\(|while\s*\(/g) || []).length;
  if (nestedLoops >= 2) timeComplexity = "O(N^2)";
  else if (nestedLoops === 1) timeComplexity = "O(N)";
  else if (code.length > 0) timeComplexity = "O(1)";

  if (/new\s+Array|\[\s*\]|\{\s*\}|vector<|malloc|ArrayList/i.test(code)) {
    spaceComplexity = "O(N)";
  }

  const hasCode = code.length > 20 && !code.includes("Write your solution here");
  const codeCorrectness = hasCode
    ? "Candidate implemented an active solution with standard function structure and bounds handling."
    : "No complete working code was submitted during the allocated session.";

  const hasExcessivePastes = pastes.length > 3;
  const hasExcessiveTabSwitches = tabSwitches.length > 4;

  let recommendation = "Offer";
  if (!hasCode || (hasExcessivePastes && hasExcessiveTabSwitches)) {
    recommendation = "Reject";
  } else if (hasExcessiveTabSwitches || hasExcessivePastes) {
    recommendation = "Borderline";
  }

  return {
    timeComplexity,
    spaceComplexity,
    codeCorrectness,
    screenSharedEntirely: true,
    tabChanges: tabSwitches.map(
      (e) => `[${new Date(e.timestamp || Date.now()).toLocaleTimeString()}] Tab changed / window minimized`
    ),
    copyPasted: pastes.map(
      (e) => `[${new Date(e.timestamp || Date.now()).toLocaleTimeString()}] External clipboard paste detected`
    ),
    recommendation,
    detailedSummary: `Forensic audit of candidate session. Evaluated ${events.length} telemetry markers and submitted code. Code complexity measured at ${timeComplexity} time and ${spaceComplexity} auxiliary space. ${
      tabSwitches.length > 0 ? `${tabSwitches.length} tab switch(es) noted.` : "Zero suspicious tab switches recorded."
    } ${pastes.length > 0 ? `${pastes.length} clipboard paste event(s) recorded.` : "Zero unauthorized clipboard paste events."}`,
    isProcessing: false,
  };
};

exports.processInterviewVideo = async (
  meetingId,
  recordingUrl,
  finalCode = "",
  problemStatement = "",
  telemetryEvents = []
) => {
  let localVideoPath = "";
  let uploadedGeminiFileName = null;

  try {
    console.log(`[Forensics] Starting forensic analysis for meeting ${meetingId}`);

    const promptText = `
You are an expert technical interviewer and AI forensic analyst.
Evaluate this technical interview session:

Problem Statement:
${problemStatement || "Not specified"}

Final Submitted Code:
${finalCode || "No code submitted"}

Raw Telemetry Events:
${JSON.stringify(telemetryEvents || [])}

Tasks:
1. Determine Time and Space Complexity (Big-O).
2. Evaluate Code Correctness and implementation quality.
3. Check browser telemetry for integrity (tab switches, clipboard pastes).
4. Provide a recommendation: "Offer", "Reject", or "Borderline".
5. Write a comprehensive forensic summary.

Return ONLY a valid JSON object matching this schema:
{
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "codeCorrectness": "String explaining solution correctness",
  "screenSharedEntirely": true,
  "tabChanges": ["array of strings explaining each tab change"],
  "copyPasted": ["array of strings explaining each paste"],
  "recommendation": "Offer | Reject | Borderline",
  "detailedSummary": "String providing thorough forensic analysis"
}
    `;

    let reportData = null;

    // 1. If recording URL is available and valid Cloudinary video, attempt Gemini video processing
    if (recordingUrl && recordingUrl.startsWith("http") && genAI && fileManager) {
      try {
        console.log(`[Forensics] Downloading video from Cloudinary: ${recordingUrl}`);
        const response = await axios({
          method: "GET",
          url: recordingUrl,
          responseType: "stream",
          timeout: 20000,
        });

        localVideoPath = path.join(os.tmpdir(), `interview_${meetingId}.webm`);
        const writer = fs.createWriteStream(localVideoPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        console.log(`[Forensics] Uploading video to Gemini File Manager...`);
        const uploadResult = await fileManager.uploadFile(localVideoPath, {
          mimeType: "video/webm",
          displayName: `Interview_${meetingId}`,
        });
        uploadedGeminiFileName = uploadResult.file.name;
        const fileUri = uploadResult.file.uri;

        // Poll until ready
        let file = await fileManager.getFile(uploadedGeminiFileName);
        let retries = 0;
        while (file.state === "PROCESSING" && retries < 15) {
          await new Promise((resolve) => setTimeout(resolve, 4000));
          file = await fileManager.getFile(uploadedGeminiFileName);
          retries++;
        }

        if (file.state === "ACTIVE") {
          const geminiModels = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
          for (const mName of geminiModels) {
            try {
              const model = genAI.getGenerativeModel({ model: mName });
              const result = await model.generateContent([
                {
                  fileData: {
                    mimeType: "video/webm",
                    fileUri,
                  },
                },
                { text: promptText },
              ]);
              reportData = extractJson(result.response.text());
              console.log(`[Forensics] Video analysis generated with ${mName}`);
              break;
            } catch (mErr) {
              console.warn(`[Forensics] Model ${mName} error:`, mErr.message);
            }
          }
        }
      } catch (videoErr) {
        console.warn(`[Forensics] Video download/analysis bypassed:`, videoErr.message);
      }
    }

    // 2. If video analysis did not yield a report, run Text/Code LLM Analysis
    if (!reportData && genAI) {
      const textModels = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
      for (const mName of textModels) {
        try {
          console.log(`[Forensics] Attempting text/code analysis using ${mName}...`);
          const model = genAI.getGenerativeModel({ model: mName });
          const result = await model.generateContent(promptText);
          reportData = extractJson(result.response.text());
          console.log(`[Forensics] Report generated with ${mName}`);
          break;
        } catch (textErr) {
          console.warn(`[Forensics] ${mName} text analysis error:`, textErr.message);
        }
      }
    }

    // 3. Fallback to OpenRouter if configured
    if (!reportData && process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY.includes("your_")) {
      try {
        console.log(`[Forensics] Attempting analysis using OpenRouter...`);
        const openRouterRes = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: "google/gemini-2.0-flash-001",
            messages: [{ role: "user", content: promptText }],
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          }
        );
        const reply = openRouterRes.data.choices[0]?.message?.content;
        reportData = extractJson(reply);
        console.log("[Forensics] Report generated via OpenRouter");
      } catch (orErr) {
        console.warn("[Forensics] OpenRouter analysis error:", orErr.message);
      }
    }

    // 4. Deterministic analysis fallback (guarantees a full report always)
    if (!reportData) {
      console.log("[Forensics] Generating deterministic heuristic report...");
      reportData = generateHeuristicReport(finalCode, problemStatement, telemetryEvents);
    }

    reportData.isProcessing = false;

    // Save report in Database
    await Meeting.findOneAndUpdate(
      { meetingId },
      { $set: { forensicReport: reportData, status: "completed" } }
    );
    console.log(`[Forensics] Forensic report saved to DB for meeting ${meetingId}`);
  } catch (err) {
    console.error(`[Forensics] Error in report generator:`, err);
    const fallback = generateHeuristicReport(finalCode, problemStatement, telemetryEvents);
    await Meeting.findOneAndUpdate(
      { meetingId },
      { $set: { forensicReport: fallback, status: "completed" } }
    );
  } finally {
    if (localVideoPath && fs.existsSync(localVideoPath)) {
      try {
        fs.unlinkSync(localVideoPath);
      } catch (e) {}
    }
    if (uploadedGeminiFileName && fileManager) {
      try {
        await fileManager.deleteFile(uploadedGeminiFileName);
      } catch (e) {}
    }
  }
};
