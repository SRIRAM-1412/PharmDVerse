/**
 * PHARMDVERSE — SECTION 4: TRADE NAME -> GENERIC NAME RESOLUTION
 * MULTI-COMPONENT / FIXED-DOSE COMBINATION (FDC) PARSING & RESOLUTION ENGINE
 */

const DOSAGE_FORM_PATTERNS = [
  { form: 'Injection', abbr: 'Inj.', regex: /^(inj\.?|injection)\s+/i },
  { form: 'Tablet', abbr: 'Tab.', regex: /^(tab\.?|tablet)\s+/i },
  { form: 'Capsule', abbr: 'Cap.', regex: /^(cap\.?|capsule)\s+/i },
  { form: 'Syrup', abbr: 'Syp.', regex: /^(syp\.?|syr\.?|syrup)\s+/i },
  { form: 'Nebulization', abbr: 'Neb.', regex: /^(neb\.?|nebulization|nebule)\s+/i },
  { form: 'Inhalation', abbr: 'Inh.', regex: /^(inh\.?|inhaler|inhalation)\s+/i },
  { form: 'Cream', abbr: 'Cream', regex: /^(cream)\s+/i },
  { form: 'Ointment', abbr: 'Oint.', regex: /^(oint\.?|ointment)\s+/i },
  { form: 'Ophthalmic drops', abbr: 'Ophth.', regex: /^(eye\s+drops?|ophth\.?\s+drops?)\s+/i },
  { form: 'Otology drops', abbr: 'Ear drops', regex: /^(ear\s+drops?|otology\s+drops?)\s+/i },
  { form: 'Solution', abbr: 'Sol.', regex: /^(sol\.?|solution)\s+/i },
  { form: 'Suspension', abbr: 'Susp.', regex: /^(susp\.?|suspension)\s+/i }
];

const KNOWN_GENERIC_NAMES = new Set([
  'amikacin', 'aspirin', 'paracetamol', 'acetaminophen', 'pantoprazole', 'metformin',
  'clopidogrel', 'atorvastatin', 'diltiazem', 'furosemide', 'digoxin', 'glimepiride',
  'voglibose', 'rifampicin', 'isoniazid', 'pyrazinamide', 'ethambutol', 'amoxicillin',
  'clavulanic acid', 'ibuprofen', 'telmisartan', 'hydrochlorothiazide', 'amlodipine',
  'levosalbutamol', 'ipratropium bromide', 'sulfamethoxazole', 'trimethoprim',
  'azelastine', 'fluticasone', 'sitagliptin', 'vildagliptin', 'norfloxacin', 'tinidazole',
  'ciprofloxacin', 'ornidazole', 'ofloxacin', 'etofylline', 'theophylline', 'cefixime',
  'domperidone', 'rabeprazole', 'levodopa', 'carbidopa', 'entacapone', 'bismuth subcitrate',
  'metronidazole', 'tetracycline', 'cefotaxime', 'cefuroxime', 'ceftriaxone', 'azithromycin',
  'ranitidine', 'ondansetron', 'spironolactone', 'ramipril'
]);

const KNOWN_BRAND_FDC_MAP = {
  // Single-Drug Products
  'dolo': ['Paracetamol'],
  'calpol': ['Paracetamol'],
  'crocin': ['Paracetamol'],
  'pacimol': ['Paracetamol'],
  'sumo': ['Paracetamol'],
  'pantop': ['Pantoprazole'],
  'pan': ['Pantoprazole'],
  'pantocid': ['Pantoprazole'],
  'pantodac': ['Pantoprazole'],
  'amikacin': ['Amikacin'],
  'amicin': ['Amikacin'],
  'ecosprin': ['Aspirin'],
  'ecospirin': ['Aspirin'],
  'aspirin': ['Aspirin'],
  'bayer': ['Aspirin'],
  'ciplox': ['Ciprofloxacin'],
  'cifran': ['Ciprofloxacin'],
  'taxim': ['Cefotaxime'],
  'ceftum': ['Cefuroxime'],
  'cefakind': ['Cefuroxime'],
  'monocef': ['Ceftriaxone'],
  'azithral': ['Azithromycin'],
  'zady': ['Azithromycin'],
  'metrogyl': ['Metronidazole'],
  'flagyl': ['Metronidazole'],
  'zinetac': ['Ranitidine'],
  'aciloc': ['Ranitidine'],
  'rantac': ['Ranitidine'],
  'emset': ['Ondansetron'],
  'ondem': ['Ondansetron'],
  'telma': ['Telmisartan'],
  'telmikind': ['Telmisartan'],
  'aldactone': ['Spironolactone'],
  'lasix': ['Furosemide'],
  'lanoxin': ['Digoxin'],

  // Two-Drug Fixed-Dose Combinations
  'augmentin': ['Amoxicillin', 'Clavulanic acid'],
  'moxclav': ['Amoxicillin', 'Clavulanic acid'],
  'clavam': ['Amoxicillin', 'Clavulanic acid'],
  'amoxyclav': ['Amoxicillin', 'Clavulanic acid'],
  'moxikind-cv': ['Amoxicillin', 'Clavulanic acid'],
  'combiflam': ['Ibuprofen', 'Paracetamol'],
  'telma-h': ['Telmisartan', 'Hydrochlorothiazide'],
  'telmikind-h': ['Telmisartan', 'Hydrochlorothiazide'],
  'telpres-h': ['Telmisartan', 'Hydrochlorothiazide'],
  'telma-am': ['Telmisartan', 'Amlodipine'],
  'telmikind-am': ['Telmisartan', 'Amlodipine'],
  'duolin': ['Levosalbutamol', 'Ipratropium bromide'],
  'septran': ['Sulfamethoxazole', 'Trimethoprim'],
  'bactrim': ['Sulfamethoxazole', 'Trimethoprim'],
  'duonase': ['Azelastine', 'Fluticasone'],
  'glycomet-gp': ['Metformin', 'Glimepiride'],
  'janumet': ['Metformin', 'Sitagliptin'],
  'vildagliptin-m': ['Vildagliptin', 'Metformin'],
  'galvus met': ['Vildagliptin', 'Metformin'],
  'norflox-tz': ['Norfloxacin', 'Tinidazole'],
  'ciplox-tz': ['Ciprofloxacin', 'Tinidazole'],
  'oflomac-oz': ['Ofloxacin', 'Ornidazole'],
  'oflox-oz': ['Ofloxacin', 'Ornidazole'],
  'deriphyllin': ['Etofylline', 'Theophylline'],
  'zifi-cv': ['Cefixime', 'Clavulanic acid'],
  'taxim-o-cv': ['Cefixime', 'Clavulanic acid'],
  'pantop-d': ['Pantoprazole', 'Domperidone'],
  'pan-d': ['Pantoprazole', 'Domperidone'],
  'rabekind-dsr': ['Rabeprazole', 'Domperidone'],
  'razo-d': ['Rabeprazole', 'Domperidone'],

  // Three-Drug Fixed-Dose Combinations
  'triple-t': ['Glimepiride', 'Metformin', 'Voglibose'],
  'tripride': ['Glimepiride', 'Metformin', 'Voglibose'],
  'glimisave mv': ['Glimepiride', 'Metformin', 'Voglibose'],
  'glimestar pm3': ['Glimepiride', 'Metformin', 'Voglibose'],
  'volibo m3': ['Glimepiride', 'Metformin', 'Voglibose'],
  'stalevo': ['Levodopa', 'Carbidopa', 'Entacapone'],
  'pylera': ['Bismuth subcitrate', 'Metronidazole', 'Tetracycline'],
  'rifagut-triple': ['Rifampicin', 'Isoniazid', 'Pyrazinamide'],
  'trio-tb': ['Rifampicin', 'Isoniazid', 'Pyrazinamide'],
  '3-dex': ['Rifampicin', 'Isoniazid', 'Pyrazinamide'],
  'telma-3d': ['Telmisartan', 'Amlodipine', 'Hydrochlorothiazide'],
  'telmikind-trio': ['Telmisartan', 'Amlodipine', 'Hydrochlorothiazide'],
  'trio-cardio': ['Telmisartan', 'Amlodipine', 'Hydrochlorothiazide'],

  // Four-or-More Drug Fixed-Dose Combinations
  'quadruple-tb': ['Rifampicin', 'Isoniazid', 'Pyrazinamide', 'Ethambutol'],
  'forecox': ['Rifampicin', 'Isoniazid', 'Pyrazinamide', 'Ethambutol'],
  'ak-4': ['Rifampicin', 'Isoniazid', 'Pyrazinamide', 'Ethambutol'],
  '4-dex': ['Rifampicin', 'Isoniazid', 'Pyrazinamide', 'Ethambutol'],
  'rimactazid-fdc': ['Rifampicin', 'Isoniazid', 'Pyrazinamide', 'Ethambutol'],
  'polypill-5': ['Aspirin', 'Atorvastatin', 'Ramipril', 'Amlodipine', 'Hydrochlorothiazide'],
  'penta-cardio': ['Aspirin', 'Atorvastatin', 'Ramipril', 'Amlodipine', 'Hydrochlorothiazide']
};

/**
 * Extract dosage form, clean trade name, strength, and frequency instructions from free-text input.
 */
export const parsePrescriptionInput = (rawInput) => {
  if (!rawInput || typeof rawInput !== 'string') {
    return {
      dosageForm: 'Oral',
      dosageFormAbbr: 'Tab.',
      extractedTradeName: '',
      extractedStrength: '',
      extractedFrequency: '',
      cleanInput: ''
    };
  }

  let text = rawInput.trim();
  let dosageForm = 'Oral';
  let dosageFormAbbr = 'Tab.';

  // 1. Extract Dosage Form Prefix with FULL STOP '.' guarantee
  for (const item of DOSAGE_FORM_PATTERNS) {
    if (item.regex.test(text)) {
      dosageForm = item.form;
      dosageFormAbbr = item.abbr;
      text = text.replace(item.regex, '').trim();
      break;
    }
  }

  // 2. Extract Frequency Instructions (1-0-1, OD, BD, TDS, etc.)
  let extractedFrequency = '';
  const freqRegex = /\b(1-0-1|1-1-1|1-0-0|0-0-1|0-1-0|OD|BD|TDS|QID|Q4H|Q6H|Q8H|STAT|PRN|HS)\b/gi;
  const freqMatch = text.match(freqRegex);
  if (freqMatch) {
    extractedFrequency = freqMatch[0].toUpperCase();
    text = text.replace(freqRegex, '').trim();
  }

  // 3. Extract Strength (e.g. 650 mg, 500 mg, 625 mg, 40 mg, 500)
  let extractedStrength = '';
  const strengthWithUnitRegex = /\b(\d+(?:\.\d+)?\s*(?:mg|g|mcg|microgram|iu|ml|%|mmol|meq)(?:\/\d+(?:\.\d+)?\s*(?:mg|g|ml)?)?)\b/gi;
  const strengthMatch = text.match(strengthWithUnitRegex);
  if (strengthMatch) {
    extractedStrength = strengthMatch[0];
    text = text.replace(strengthWithUnitRegex, '').trim();
  } else {
    // Check for trailing strength numbers like 650, 625, 500, 40 at end of trade name (e.g. "Augmentin 625", "Dolo 650", "Pantop 40")
    const trailingNumMatch = text.match(/\s+(\d{2,4})$/);
    if (trailingNumMatch) {
      extractedStrength = `${trailingNumMatch[1]} mg`;
      text = text.replace(/\s+(\d{2,4})$/, '').trim();
    }
  }

  // Clean remaining trade name
  const extractedTradeName = text.trim();

  // Formatted Trade Name with full stop '.' between dosage form abbreviation and brand name
  const capTrade = extractedTradeName ? extractedTradeName.charAt(0).toUpperCase() + extractedTradeName.slice(1) : '';
  const formattedTradeName = capTrade ? `${dosageFormAbbr} ${capTrade}${extractedStrength ? ' ' + extractedStrength : ''}` : rawInput;

  return {
    dosageForm,
    dosageFormAbbr,
    extractedTradeName,
    extractedStrength,
    extractedFrequency,
    formattedTradeName,
    cleanInput: rawInput.trim()
  };
};

/**
 * Resolve clean trade name into active generic ingredient(s).
 * Enforces FULL STOP '.' between Dosage Abbreviation & Brand Name for Trade Name,
 * and '+' symbol with spaces between active ingredients for Generic Name Display.
 */
export const resolveTradeNameToGeneric = (rawInput) => {
  const parsed = parsePrescriptionInput(rawInput);
  const tradeClean = parsed.extractedTradeName.toLowerCase();

  // Helper to format generic display string with ' + ' symbol between drugs
  const formatGenericDisplay = (ingredients) => {
    return ingredients.join(' + ');
  };

  // Case A: Explicit Plus ("+") or Slash ("/") notation (e.g. "Amoxicillin + Clavulanic acid")
  if (rawInput.includes('+') || (rawInput.includes('/') && !rawInput.match(/\d+\/\d+/))) {
    const parts = rawInput
      .replace(/^(inj\.?|tab\.?|cap\.?|syp\.?|neb\.?|inh\.?)\s+/i, '')
      .split(/\s*[\+\/]\s*/)
      .map(p => p.replace(/\d+\s*(mg|g|mcg)?/gi, '').trim())
      .filter(Boolean);

    if (parts.length > 0) {
      const activeIngredients = Array.from(new Set(parts.map(p => p.charAt(0).toUpperCase() + p.slice(1))));
      return {
        status: 'RESOLVED',
        dosageForm: parsed.dosageForm,
        dosageFormAbbr: parsed.dosageFormAbbr,
        extractedTradeName: parsed.extractedTradeName || rawInput,
        formattedTradeName: parsed.formattedTradeName,
        extractedStrength: parsed.extractedStrength,
        extractedFrequency: parsed.extractedFrequency,
        genericNameDisplay: formatGenericDisplay(activeIngredients),
        activeIngredients,
        ingredientCount: activeIngredients.length
      };
    }
  }

  // Case B: Known Brand / FDC Map Lookup
  if (tradeClean && KNOWN_BRAND_FDC_MAP[tradeClean]) {
    const activeIngredients = KNOWN_BRAND_FDC_MAP[tradeClean];
    return {
      status: 'RESOLVED',
      dosageForm: parsed.dosageForm,
      dosageFormAbbr: parsed.dosageFormAbbr,
      extractedTradeName: parsed.extractedTradeName,
      formattedTradeName: parsed.formattedTradeName,
      extractedStrength: parsed.extractedStrength,
      extractedFrequency: parsed.extractedFrequency,
      genericNameDisplay: formatGenericDisplay(activeIngredients),
      activeIngredients,
      ingredientCount: activeIngredients.length
    };
  }

  // Case C: Check prefix substring matches in KNOWN_BRAND_FDC_MAP
  if (tradeClean) {
    const brandKeys = Object.keys(KNOWN_BRAND_FDC_MAP);
    const matchedKey = brandKeys.find(k => tradeClean === k || tradeClean.startsWith(`${k}-`) || tradeClean.startsWith(`${k} `));
    if (matchedKey) {
      const activeIngredients = KNOWN_BRAND_FDC_MAP[matchedKey];
      return {
        status: 'RESOLVED',
        dosageForm: parsed.dosageForm,
        dosageFormAbbr: parsed.dosageFormAbbr,
        extractedTradeName: parsed.extractedTradeName,
        formattedTradeName: parsed.formattedTradeName,
        extractedStrength: parsed.extractedStrength,
        extractedFrequency: parsed.extractedFrequency,
        genericNameDisplay: formatGenericDisplay(activeIngredients),
        activeIngredients,
        ingredientCount: activeIngredients.length
      };
    }
  }

  // Case D: Direct Known Generic Name entry (e.g., student typed generic name directly like "Amikacin" or "Aspirin")
  if (tradeClean && KNOWN_GENERIC_NAMES.has(tradeClean)) {
    const capName = parsed.extractedTradeName.charAt(0).toUpperCase() + parsed.extractedTradeName.slice(1);
    return {
      status: 'GENERIC_DIRECT',
      dosageForm: parsed.dosageForm,
      dosageFormAbbr: parsed.dosageFormAbbr,
      extractedTradeName: parsed.extractedTradeName,
      formattedTradeName: parsed.formattedTradeName,
      extractedStrength: parsed.extractedStrength,
      extractedFrequency: parsed.extractedFrequency,
      genericNameDisplay: capName,
      activeIngredients: [capName],
      ingredientCount: 1
    };
  }

  // Case E: Unresolved / Unknown Trade Name
  return {
    status: 'UNRESOLVED_TRADE_NAME',
    dosageForm: parsed.dosageForm,
    dosageFormAbbr: parsed.dosageFormAbbr,
    extractedTradeName: rawInput,
    formattedTradeName: parsed.formattedTradeName,
    extractedStrength: parsed.extractedStrength,
    extractedFrequency: parsed.extractedFrequency,
    genericNameDisplay: 'Trade name could not be confidently resolved.',
    activeIngredients: [],
    ingredientCount: 0,
    message: 'Trade name could not be confidently resolved.'
  };
};
