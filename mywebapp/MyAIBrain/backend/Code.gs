/**
 * My AI Brain 3.0 Backend - Google Apps Script
 *
 * 必須スクリプトプロパティ:
 * - GEMINI_API_KEY: Google AI Studio API Key
 * - FOLDER_ID: Google Drive Folder ID for storage
 * - SHEET_ID: Google Spreadsheet ID for database
 * - APP_ICON_ID: Google Drive File ID for the app icon (optional)
 * - APP_ICON_URL: Direct URL for app icon (optional, alternative to ID)
 */

// --- Configuration ---
const SCRIPT_PROPERTIES = PropertiesService.getScriptProperties();
const API_KEY = SCRIPT_PROPERTIES.getProperty('GEMINI_API_KEY');
const FOLDER_ID = SCRIPT_PROPERTIES.getProperty('FOLDER_ID');
const SHEET_ID = SCRIPT_PROPERTIES.getProperty('SHEET_ID');
const APP_ICON_ID = SCRIPT_PROPERTIES.getProperty('APP_ICON_ID');

const MODEL_FLASH = 'gemini-2.0-flash-exp';
const MODEL_PRO = 'gemini-1.5-pro';

// --- Main API Entry Points ---

function doPost(e) {
  try {
    if (!e || !e.postData) {
      throw new Error("No post data received");
    }
    
    const params = JSON.parse(e.postData.contents);
    const type = params.type || 'text'; // text, image, page, generate
    
    let result = { status: 'success' };
    let aiAnalysis = {};
    let fileInfo = {};

    // 1. Save File to Drive if exists
    if (params.fileData && params.fileName) {
      fileInfo = saveToDrive(params.fileData, params.fileName, params.mimeType);
    } else if (params.imageUrl) {
        // Option to download URL if needed, or just save the link
        fileInfo = { fileUrl: params.imageUrl, fileId: '' };
    }

    // 2. Process with Gemini
    if (type !== 'keep_ping') { // Skip heavy AI for simple pings
        aiAnalysis = processWithGemini(params, type);
    }

    // 3. Save to Spreadsheet
    const dbEntry = {
        timestamp: new Date(),
        title: params.title || aiAnalysis.title || 'Untitled',
        body: params.text || params.description || '',
        translation: aiAnalysis.translation || '',
        summary: aiAnalysis.summary || '',
        tags: (aiAnalysis.tags || []).join(','),
        color: aiAnalysis.color || '#FFFFFF',
        url: params.url || '',
        fileUrl: fileInfo.fileUrl || '',
        fileId: fileInfo.fileId || '',
        type: type
    };
    
    saveToSheet(dbEntry);
    
    return ContentService.createTextOutput(JSON.stringify({ ...result, ...aiAnalysis, ...fileInfo }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'icon') {
    if (APP_ICON_ID) {
        const file = DriveApp.getFileById(APP_ICON_ID);
        return ContentService.createTextOutput(JSON.stringify({ url: file.getDownloadUrl() })).setMimeType(ContentService.MimeType.JSON);
    } else {
         return ContentService.createTextOutput(JSON.stringify({ url: 'https://via.placeholder.com/150' })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (action === 'getData') {
    const data = getFromSheet();
    return ContentService.createTextOutput(JSON.stringify({ items: data }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'running', message: 'My AI Brain API is active.' }))
    .setMimeType(ContentService.MimeType.JSON);
}


// --- Core Logic ---

function saveToDrive(base64Data, fileName, mimeType) {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const decoded = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decoded, mimeType, fileName);
    const file = folder.createFile(blob);
    
    // file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return {
      fileUrl: file.getUrl(),
      fileId: file.getId()
    };
  } catch (e) {
    console.error('Drive Save Error:', e);
    return { fileUrl: '', fileId: '' };
  }
}

function saveToSheet(entry) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
  
  // Headers if empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Title', 'Body', 'Translation', 'Summary', 'Tags', 'Color', 'URL', 'File URL', 'File ID', 'Type']);
  }
  
  sheet.appendRow([
    entry.timestamp,
    entry.title,
    entry.body,
    entry.translation,
    entry.summary,
    entry.tags,
    entry.color,
    entry.url,
    entry.fileUrl,
    entry.fileId,
    entry.type
  ]);
}

function getFromSheet() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0]; // Assuming row 1 is headers
  const data = [];
  
  // Start from row 2 (index 1)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Map based on fixed index or header name logic. Using fixed index for simplicity aligning with saveToSheet
    // Columns: Timestamp(0), Title(1), Body(2), Translation(3), Summary(4), Tags(5), Color(6), URL(7), FileURL(8), FileID(9), Type(10)
    data.push({
      timestamp: row[0],
      title: row[1],
      body: row[2],
      translation: row[3],
      summary: row[4],
      tags: row[5] ? row[5].toString().split(',') : [],
      color: row[6],
      url: row[7],
      fileUrl: row[8],
      fileId: row[9],
      type: row[10]
    });
  }
  // Return newest first
  return data.reverse(); 
}

function processWithGemini(params, type) {
    // Use fast model for quick processing
    const model = MODEL_FLASH;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
    
    const prompt = constructPrompt(params, type);
    
    const payload = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            responseMimeType: "application/json"
        }
    };
    
    const options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
    };
    
    try {
        const response = UrlFetchApp.fetch(apiUrl, options);
        const responseCode = response.getResponseCode();
        const responseText = response.getContentText();
        const json = JSON.parse(responseText);
        
        // Handle API Errors (e.g., 400, 403)
        if (responseCode !== 200) {
             console.error('Gemini API Error Status:', responseCode, responseText);
             return {
                 title: params.title || "AI Error: " + responseCode,
                 summary: "API Error: " + (json.error ? json.error.message : responseText),
                 tags: ["error", "api-fail"],
                 color: "#FF0000",
                 translation: ""
             };
        }

        // Handle Safety Blocks or Empty Candidates
        if (!json.candidates || json.candidates.length === 0) {
             console.error('Gemini No Candidates:', responseText);
             return {
                 title: params.title || "AI Blocked/Empty",
                 summary: "Content blocked by safety settings or returned no text.",
                 tags: ["error", "safety"],
                 color: "#FFA500",
                 translation: ""
             };
        }

        if (json.candidates[0].content && json.candidates[0].content.parts) {
            const rawText = json.candidates[0].content.parts[0].text;
            const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        }
        
    } catch (e) {
        console.error('Gemini Processing Exception:', e);
        return {
            title: params.title || "Processing Error",
            summary: "Script Error: " + e.toString(),
            tags: ["error", "script-exception"],
            color: "#FF0000",
            translation: ""
        };
    }
    
    return {
        title: params.title || "Untitled",
        summary: "Analysis failed unexpectedly.",
        tags: ["error"],
        color: "#CCCCCC",
        translation: ""
    };
}

function constructPrompt(params, type) {
    const text = params.text || params.selection || "";
    const context = params.pageTitle ? `Source Page: ${params.pageTitle} (${params.url})` : "";
    const contentPreview = text.length > 5000 ? text.substring(0, 5000) + "..." : text;

    return `Analyze the following content and extract/generate metadata in JSON format.

Input Type: ${type}
Content: ${contentPreview}
Context: ${context}

Output JSON Schema:
{
    "title": "A short, descriptive title",
    "summary": "Concise summary of the content (max 200 chars)",
    "translation": "Japanese translation if content is not Japanese, else empty string",
    "tags": ["tag1", "tag2", "tag3"],
    "color": "Hex color code to represent the mood/topic (e.g. #FF5733)"
}

Respond ONLY with the JSON.`;
}
