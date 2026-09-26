import { GoogleGenAI, Type } from '@google/genai';
import { ENV } from '../config/env.js';

// Allowed normalized quantity units
export const ALLOWED_UNITS = [
  'meals',
  'lbs',
  'kg',
  'grams',
  'liters',
  'units',
  'boxes',
  'trays',
  'portions'
];

/**
 * Normalizes common unit variations into standard allowed units.
 */
export function normalizeUnit(rawUnit) {
  if (!rawUnit || typeof rawUnit !== 'string') return null;
  const unit = rawUnit.trim().toLowerCase();

  switch (unit) {
    case 'meal':
    case 'meals':
      return 'meals';
    case 'lb':
    case 'lbs':
    case 'pound':
    case 'pounds':
      return 'lbs';
    case 'kg':
    case 'kgs':
    case 'kilogram':
    case 'kilograms':
      return 'kg';
    case 'g':
    case 'gram':
    case 'grams':
      return 'grams';
    case 'l':
    case 'liter':
    case 'liters':
    case 'litre':
    case 'litres':
      return 'liters';
    case 'box':
    case 'boxes':
      return 'boxes';
    case 'tray':
    case 'trays':
      return 'trays';
    case 'portion':
    case 'portions':
      return 'portions';
    case 'unit':
    case 'units':
    case 'item':
    case 'items':
      return 'units';
    default:
      return ALLOWED_UNITS.includes(unit) ? unit : null;
  }
}

/**
 * Validates and sanitizes Gemini parser output according to strict system rules.
 */
export function validateAndSanitizeOutput(rawOutput, inputReferenceText, referenceDate = new Date()) {
  if (!rawOutput || typeof rawOutput !== 'object') {
    throw new Error('Gemini output must be a valid JSON object.');
  }

  // 1. Food Type / Title
  let foodType = typeof rawOutput.foodType === 'string' ? rawOutput.foodType.trim() : '';
  if (!foodType && rawOutput.foodName && typeof rawOutput.foodName === 'string') {
    foodType = rawOutput.foodName.trim();
  }
  if (!foodType) {
    foodType = 'Surplus Food';
  }

  // 2. Quantity
  let quantity = null;
  if (rawOutput.quantity !== null && rawOutput.quantity !== undefined && rawOutput.quantity !== '') {
    const num = Number(rawOutput.quantity);
    if (!isNaN(num) && num > 0) {
      quantity = Math.round(num * 100) / 100; // Round to max 2 decimals
    }
  }

  // 3. Quantity Unit
  const rawUnit = rawOutput.quantityUnit || rawOutput.unit || null;
  const quantityUnit = normalizeUnit(rawUnit);

  // 4. Available Until (Relative/Absolute Expiration)
  let availableUntil = null;
  if (rawOutput.availableUntil && typeof rawOutput.availableUntil === 'string' && rawOutput.availableUntil.trim() !== '') {
    const parsedDate = new Date(rawOutput.availableUntil.trim());
    if (!isNaN(parsedDate.getTime())) {
      // Must not be in the past (allow a 5-minute buffer for clocks)
      const bufferMs = 5 * 60 * 1000;
      if (parsedDate.getTime() + bufferMs >= referenceDate.getTime()) {
        availableUntil = parsedDate.toISOString();
      }
    }
  }

  // 5. Description
  let description = typeof rawOutput.description === 'string' ? rawOutput.description.trim() : '';
  if (!description) {
    description = inputReferenceText ? inputReferenceText.trim() : foodType;
  }

  // 6. Optional confidence
  let confidence = 0.9;
  if (typeof rawOutput.confidence === 'number' && rawOutput.confidence >= 0 && rawOutput.confidence <= 1) {
    confidence = rawOutput.confidence;
  }

  return {
    foodType,
    quantity,
    quantityUnit,
    availableUntil,
    description,
    confidence
  };
}

/**
 * Extracts JSON content from raw Gemini text response, stripping markdown codeblocks if necessary.
 */
export function extractJsonFromText(responseText) {
  if (!responseText || typeof responseText !== 'string') {
    throw new Error('Empty or invalid response received from Gemini.');
  }

  let cleaned = responseText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse structured JSON from Gemini response: ${err.message}`);
  }
}

/**
 * Calls Gemini to extract structured food donation details from free-text description.
 *
 * @param {string} text - Natural language donation description from donor.
 * @param {Object} [options] - Optional overrides for testing or model configuration.
 * @returns {Promise<Object>} - Validated and sanitized structured donation fields.
 */
export async function parseDonationText(text, options = {}) {
  const apiKey = options.apiKey || ENV.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('AI parsing service is currently not configured. Please enter donation details manually.');
    err.code = 'GEMINI_KEY_MISSING';
    err.statusCode = 503;
    throw err;
  }

  const modelName = options.model || ENV.GEMINI_MODEL || 'gemini-2.5-flash';
  const now = options.referenceDate || new Date();
  const serverTimeIso = now.toISOString();
  const serverDateStr = serverTimeIso.split('T')[0];
  const serverTimeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const systemInstruction = `You are a specialized AI assistant for RescueRoute, a real-time food rescue platform.
Your ONLY role is to extract and structure surplus food donation details from natural language text provided by a food donor.

CRITICAL CONSTRAINTS:
1. Extract ONLY information explicitly present or safely derivable from the user's text.
2. Return strictly valid JSON adhering to the specified schema.
3. NEVER invent or hallucinate missing information:
   - If quantity is not mentioned, return null.
   - If unit is not mentioned, return null.
   - If expiry or availability time is not mentioned, return null.
4. Normalize units to one of: "meals", "lbs", "kg", "grams", "liters", "units", "boxes", "trays", "portions".
5. For relative times (e.g. "until 9 PM today", "in 3 hours", "tomorrow at 10 AM"):
   - Reference server context: Current date is ${serverDateStr}, current time is ${serverTimeStr} (${serverTimeIso}).
   - Calculate and output the ISO 8601 timestamp string (e.g. "${serverDateStr}T21:00:00.000Z") for "availableUntil".
   - If the time cannot be reliably interpreted, set "availableUntil" to null.
6. Set "description" to a concise summary preserving the donor's original meaning and handling notes.
7. Set "foodType" to the specific food item or dish name (e.g. "Vegetable Biryani", "Sourdough Bread").
8. Do NOT select a shelter, calculate match scores, choose a driver, infer food safety, or make routing decisions.`;

  // Allow custom AI client injection for testing/mocking
  let responseText;
  if (options.aiClient) {
    const mockRes = await options.aiClient.generateContent({
      model: modelName,
      contents: text,
      systemInstruction
    });
    responseText = typeof mockRes === 'string' ? mockRes : mockRes?.text || JSON.stringify(mockRes);
  } else {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: text,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              foodType: { type: Type.STRING },
              quantity: { type: Type.NUMBER, nullable: true },
              quantityUnit: { type: Type.STRING, nullable: true },
              availableUntil: { type: Type.STRING, nullable: true },
              description: { type: Type.STRING },
              confidence: { type: Type.NUMBER, nullable: true }
            },
            required: ['foodType', 'description']
          }
        }
      });

      responseText = response.text;
    } catch (apiError) {
      // Never leak API key, stack, or internal headers
      console.error('[Gemini Service Error]:', apiError.message || 'API request failed');

      const err = new Error('AI parsing unavailable. You can enter the donation details manually.');
      err.code = 'GEMINI_PROVIDER_ERROR';
      err.statusCode = 503;
      throw err;
    }
  }

  // Parse JSON
  let rawJson;
  try {
    rawJson = extractJsonFromText(responseText);
  } catch (parseError) {
    console.error('[Gemini Parse Error]:', parseError.message);
    const err = new Error('Unable to parse donation details. Please enter the information manually.');
    err.code = 'GEMINI_MALFORMED_OUTPUT';
    err.statusCode = 422;
    throw err;
  }

  // Validate, sanitize, and return structured result
  return validateAndSanitizeOutput(rawJson, text, now);
}

/**
 * Creates a deterministic fallback explanation derived from existing match engine parameters.
 * Used when Gemini is not configured, rate-limited, or encounters provider issues.
 *
 * @param {Object} matchData - Authoritative deterministic match details.
 * @returns {Object} - Formatted summary and reasons.
 */
export function generateDeterministicFallbackExplanation(matchData) {
  const shelterName = matchData?.shelter?.name || matchData?.shelterName || 'The recipient shelter';
  const food = matchData?.donation?.foodName || matchData?.donation?.foodType || matchData?.foodName || 'the surplus donation';
  const score = matchData?.match?.matchScore ?? matchData?.matchScore ?? 0;
  const distanceStr = matchData?.match?.distanceKm
    ? `${matchData.match.distanceKm} km`
    : (matchData?.distance || 'nearby');

  const summary = `${shelterName} was selected with a compatibility score of ${score}/100 because it is ${distanceStr} away, has available capacity for ${food}, and aligns with the shelter's dietary requirements.`;

  const fallbackReasons = (matchData?.match?.reasons && matchData.match.reasons.length > 0)
    ? matchData.match.reasons.slice(0, 5)
    : [
        `Shelter is within preferred distance (${distanceStr})`,
        'Shelter has sufficient available capacity',
        'Food category is dietary compatible',
        'Time-sensitive delivery prior to expiration deadline'
      ];

  return {
    summary,
    reasons: fallbackReasons,
    isFallback: true
  };
}

/**
 * Validates, trims, and bounds Gemini match explanation output to strict schema limits.
 *
 * @param {Object} rawOutput - Output received from Gemini.
 * @param {Object} fallbackMatchData - Context data for fallback if rawOutput is invalid.
 * @returns {Object} - Sanitized explanation object.
 */
export function validateMatchExplanationOutput(rawOutput, fallbackMatchData) {
  if (!rawOutput || typeof rawOutput !== 'object') {
    return generateDeterministicFallbackExplanation(fallbackMatchData);
  }

  let summary = typeof rawOutput.summary === 'string' ? rawOutput.summary.trim() : '';
  if (!summary) {
    summary = generateDeterministicFallbackExplanation(fallbackMatchData).summary;
  } else if (summary.length > 500) {
    summary = summary.slice(0, 497) + '...';
  }

  let reasons = Array.isArray(rawOutput.reasons) ? rawOutput.reasons : [];
  reasons = reasons
    .filter(r => typeof r === 'string' && r.trim().length > 0)
    .map(r => (r.trim().length > 200 ? r.trim().slice(0, 197) + '...' : r.trim()))
    .slice(0, 6);

  if (reasons.length === 0) {
    reasons = generateDeterministicFallbackExplanation(fallbackMatchData).reasons;
  }

  return {
    summary,
    reasons,
    isFallback: false
  };
}

/**
 * Generates an informational, natural-language explanation of why a deterministic shelter match was selected.
 * The underlying score and decision remain 100% deterministic and server-side.
 *
 * @param {Object} matchData - Authoritative match data from MongoDB.
 * @param {Object} [options] - Optional overrides for testing or model configuration.
 * @returns {Promise<Object>} - Validated structured explanation: { summary, reasons, isFallback }.
 */
export async function generateMatchExplanation(matchData, options = {}) {
  const apiKey = options.apiKey || ENV.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[Gemini Service]: GEMINI_API_KEY not configured. Returning deterministic fallback explanation.');
    return generateDeterministicFallbackExplanation(matchData);
  }

  const modelName = options.model || ENV.GEMINI_MODEL || 'gemini-2.5-flash';

  const systemInstruction = `You are a specialized AI assistant for RescueRoute, a real-time food rescue platform.
Your ONLY role is to explain WHY an algorithmic shelter match recommendation makes sense to the user.

CRITICAL ARCHITECTURE CONSTRAINTS:
1. You are explaining a deterministic food-rescue shelter match. You are NOT making the matching decision.
2. The provided match score, score breakdown, eligibility, distance, and reasons were calculated by the application's deterministic matching engine.
3. Explain the provided result clearly, factually, and concisely.
4. Do NOT recalculate, contest, or modify the match score.
5. Do NOT recommend an alternative shelter.
6. Do NOT introduce facts that are not present in the supplied data.
7. Do NOT claim food is safe or certified.
8. Do NOT claim a shelter has accepted the donation unless the supplied status says so.
9. Do NOT make operational or routing decisions.
10. Return strictly JSON adhering to the specified schema:
    {
      "summary": string (concise explanation paragraph, max 500 chars),
      "reasons": array of strings (top 3 to 5 key bullet points, each max 200 chars)
    }`;

  let responseText;

  try {
    if (options.aiClient) {
      const mockRes = await options.aiClient.generateContent({
        model: modelName,
        contents: JSON.stringify(matchData),
        systemInstruction
      });
      responseText = typeof mockRes === 'string' ? mockRes : mockRes?.text || JSON.stringify(mockRes);
    } else {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: JSON.stringify(matchData, null, 2),
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              reasons: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['summary', 'reasons']
          }
        }
      });

      responseText = response.text;
    }
  } catch (apiError) {
    console.warn('[Gemini Service Warning]: Provider error during match explanation, using fallback:', apiError.message);
    return generateDeterministicFallbackExplanation(matchData);
  }


  // Parse JSON with fallback on malformed response
  let rawJson;
  try {
    rawJson = extractJsonFromText(responseText);
  } catch (parseError) {
    console.warn('[Gemini Parse Warning]: Malformed JSON in match explanation, using fallback:', parseError.message);
    return generateDeterministicFallbackExplanation(matchData);
  }

  return validateMatchExplanationOutput(rawJson, matchData);
}

