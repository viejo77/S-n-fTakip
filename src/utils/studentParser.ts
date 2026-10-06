import * as XLSX from 'xlsx';

export interface ParsedStudentItem {
  id: string;
  number: string;
  name: string;
  gender: 'M' | 'F';
  isValid: boolean;
  error?: string;
}

// Common Turkish Female Names for auto-gender detection
const COMMON_FEMALE_NAMES = new Set([
  'ayşe', 'fatma', 'emine', 'hatice', 'zeynep', 'elif', 'meryem', 'merve', 'zehra',
  'ebru', 'esra', 'kübra', 'büşra', 'gamze', 'tuğba', 'özlem', 'sevgi', 'yasemin',
  'derya', 'hulya', 'hülya', 'pınar', 'hande', 'aslı', 'damla', 'ecem', 'ece',
  'ceren', 'irem', 'dilara', 'gülşah', 'ezgi', 'cansu', 'buse', 'beyza', 'betül',
  'sena', 'melike', 'eda', 'duygu', 'şule', 'ipek', 'sinem', 'defne', 'azra',
  'hira', 'belinay', 'ecrin', 'miray', 'alara', 'derin', 'duru', 'ada', 'neva',
  'bade', 'asya', 'kumsal', 'gökçe', 'nehir', 'yaren', 'rüya', 'öykü', 'eylül',
  'ceylin', 'esila', 'beril', 'nisa', 'rabia', 'şeyma', 'nur', 'hilal', 'beste',
  'aylin', 'selin', 'bengü', 'burcu', 'didem', 'feride', 'hale', 'ilknur', 'jale',
  'leyla', 'meltem', 'nazlı', 'oya', 'pelim', 'pelin', 'roza', 'sedef', 'sibel',
  'tülay', 'ülkü', 'vildan', 'yağmur', 'zehranur', 'aleyna', 'berfin', 'bensu'
]);

// Common Turkish Male Names
const COMMON_MALE_NAMES = new Set([
  'ahmet', 'mehmet', 'mustafa', 'ali', 'hüseyin', 'hasan', 'ibrahim', 'ismail',
  'osman', 'halil', 'süleyman', 'ömer', 'ramazan', 'murat', 'mahmut', 'yusuf',
  'fatih', 'salih', 'kemal', 'hakan', 'serkan', 'burak', 'furkan', 'enes',
  'emre', 'onur', 'can', 'berk', 'cem', 'mert', 'efe', 'kağan', 'arda', 'emir',
  'kerem', 'yavuz', 'oğuz', 'barış', 'tolga', 'batuhan', 'doruk', 'alp', 'rüzgar',
  'çağan', 'poyraz', 'ayaz', 'yağız', 'çınar', 'alperen', 'baran', 'umut', 'bora',
  'eren', 'koray', 'volkan', 'yiğit', 'deniz', 'semih', 'tarık', 'sinan', 'bilal',
  'kaan', 'berke', 'berkay', 'buğra', 'cihan', 'çağlar', 'devrim', 'doğukan', 'emircan',
  'ferhat', 'göktuğ', 'harun', 'kutay', 'levent', 'metin', 'nihat', 'orhan', 'polat',
  'rıza', 'sabri', 'taner', 'ufuk', 'vedat', 'yasin', 'zafer'
]);

export function guessGenderFromName(fullName: string): 'M' | 'F' {
  if (!fullName) return 'M';
  const firstName = fullName.trim().split(/\s+/)[0]?.toLocaleLowerCase('tr-TR') || '';
  if (COMMON_FEMALE_NAMES.has(firstName)) return 'F';
  if (COMMON_MALE_NAMES.has(firstName)) return 'M';
  return 'M'; // default fallback
}

export function toTurkishTitleCase(str: string): string {
  if (!str) return '';
  return str
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (word.length === 0) return '';
      // First character uppercase with Turkish locale
      const first = word.charAt(0).toLocaleUpperCase('tr-TR');
      const rest = word.slice(1).toLocaleLowerCase('tr-TR');
      return first + rest;
    })
    .join(' ');
}

export function parseGenderString(val: unknown): 'M' | 'F' | undefined {
  if (!val) return undefined;
  const s = String(val).trim().toUpperCase();
  if (s === 'K' || s === 'KIZ' || s === 'F' || s === 'FEMALE' || s === 'BAYAN') return 'F';
  if (s === 'E' || s === 'ERKEK' || s === 'M' || s === 'MALE' || s === 'BAY') return 'M';
  return undefined;
}

/**
 * Checks if a string looks like an official header, banner, or column title
 */
function isHeaderOrBannerLine(line: string): boolean {
  const lower = line.toLocaleLowerCase('tr-TR').trim();
  if (!lower) return true;

  // Title banners
  if (
    lower.includes('millî eğitim') ||
    lower.includes('milli egitim') ||
    lower.includes('t.c.') ||
    lower.includes('bakanlığı') ||
    lower.includes('müdürlüğü') ||
    lower.includes('öğretim yılı') ||
    lower.includes('şube öğrenci listesi') ||
    lower.includes('öğrenci listesi') ||
    lower.includes('sınıf listesi')
  ) {
    return true;
  }

  // Column header row detection
  const hasNameKeyword =
    lower.includes('adı') ||
    lower.includes('ad soyad') ||
    lower.includes('öğrenci adı') ||
    lower.includes('ad-soyad');
  const hasNumKeyword =
    lower.includes('no') ||
    lower.includes('okul no') ||
    lower.includes('öğrenci no') ||
    lower.includes('numara') ||
    lower.includes('sıra');

  if (hasNameKeyword && hasNumKeyword) return true;

  return false;
}

/**
 * Parses raw text from e-Okul, Excel clipboard, Word, WhatsApp, PDF, or manual entry.
 * Highly tolerant of varying delimiters (tabs, multiple spaces, semicolons, dashes).
 */
export function parseRawStudentText(
  rawText: string,
  startingNumber = 1,
  formatTitleCase = true
): ParsedStudentItem[] {
  if (!rawText || !rawText.trim()) return [];

  const rawLines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (rawLines.length === 0) return [];

  // Filter out headers and banners
  const filteredLines = rawLines.filter((line) => !isHeaderOrBannerLine(line));
  if (filteredLines.length === 0) return [];

  // Check if text was pasted as newline-separated cells
  // (e.g. [101, Ahmet Yilmaz, 102, Ayse Kaya] or [1, 101, Ahmet, 2, 102, Ayse])
  const isInterleaved = checkIsInterleavedList(filteredLines);
  if (isInterleaved) {
    return parseInterleavedLines(filteredLines, startingNumber, formatTitleCase);
  }

  let nextAutoNumber = startingNumber;
  const results: ParsedStudentItem[] = [];

  filteredLines.forEach((line, index) => {
    // 1. Delimiter-separated row (Tab, Semicolon, Comma, or 2+ consecutive spaces)
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t').map((p) => p.trim()).filter(Boolean);
    } else if (line.includes(';')) {
      parts = line.split(';').map((p) => p.trim()).filter(Boolean);
    } else if (/\s{2,}/.test(line)) {
      // 2 or more spaces acting as column separators
      parts = line.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean);
    }

    let number = '';
    let name = '';
    let gender: 'M' | 'F' | undefined = undefined;

    if (parts.length >= 2) {
      // Process multi-column row
      const nonNumericParts: string[] = [];
      const numericParts: string[] = [];

      parts.forEach((p) => {
        // Check for gender column
        const g = parseGenderString(p);
        if (g && (p.length <= 5 || p.toLowerCase() === 'erkek' || p.toLowerCase() === 'kız')) {
          gender = g;
          return;
        }

        // Check if 11 digits (TC Kimlik No) -> ignore
        if (/^\d{11}$/.test(p)) {
          return;
        }

        // Check numeric (e.g. sequence number or school number)
        if (/^\d+$/.test(p)) {
          numericParts.push(p);
        } else {
          nonNumericParts.push(p);
        }
      });

      // Assign numbers:
      // In Turkish school lists (e-Okul, Excel, Word), multi-number rows almost universally have:
      // Column 1: Sıra No (sequence/row index: 1, 2, 3, 4...)
      // Column 2: Okul No (student school number: 12, 104, 256, etc.)
      // Therefore, if there are 2 numbers, numericParts[1] is the student's school number (Okul No)!
      if (numericParts.length >= 2) {
        number = numericParts[1];
      } else if (numericParts.length === 1) {
        number = numericParts[0];
      }

      // Assign name from remaining non-numeric parts
      name = nonNumericParts.join(' ').trim();
    } else {
      // Single freeform line (e.g. "104 Ahmet Yılmaz" or "1. Ahmet Yılmaz" or "1- 104 Ahmet Yılmaz (K)")
      let cleanLine = line;

      // Extract gender tag if present e.g. (K) or (E) or [Kız] or trailing " Kız" / " Erkek"
      const bracketGenderMatch = cleanLine.match(/[\(\[\/]([KEkeFf]|Kız|Erkek)[\)\]\/]/);
      if (bracketGenderMatch) {
        gender = parseGenderString(bracketGenderMatch[1]);
        cleanLine = cleanLine.replace(bracketGenderMatch[0], '').trim();
      } else {
        const trailingGenderMatch = cleanLine.match(/\s+(kız|erkek|bayan|bay|[kefm])$/i);
        if (trailingGenderMatch) {
          gender = parseGenderString(trailingGenderMatch[1]);
          cleanLine = cleanLine.slice(0, -trailingGenderMatch[0].length).trim();
        }
      }

      // Check double-number prefix e.g. "1. 104 - Ahmet Yılmaz" or "1 - 104 Ahmet Yılmaz"
      const doubleNumMatch = cleanLine.match(/^(\d+)[\.\)\-\:\s]+(\d+)[\.\)\-\:\s]+(.*)$/);
      if (doubleNumMatch) {
        number = doubleNumMatch[2];
        name = doubleNumMatch[3].trim();
      } else {
        // Standard single number prefix e.g. "104. Ahmet Yılmaz" or "104 - Ahmet Yılmaz" or "104 Ahmet Yılmaz"
        const singleNumMatch = cleanLine.match(/^(\d+)[\.\)\-\:\s]+(.*)$/);
        if (singleNumMatch) {
          number = singleNumMatch[1];
          name = singleNumMatch[2].trim();
        } else {
          // Trailing number e.g. "Ahmet Yılmaz 104"
          const trailingNumMatch = cleanLine.match(/^(.*?)\s+[\-\:]?\s*(\d+)$/);
          if (trailingNumMatch) {
            name = trailingNumMatch[1].trim();
            number = trailingNumMatch[2];
          } else {
            // Only name e.g. "Ahmet Yılmaz"
            name = cleanLine.trim();
            number = String(nextAutoNumber++);
          }
        }
      }
    }

    // Clean stray punctuation from name
    name = name.replace(/^[\.\-\:\,]+/, '').replace(/[\.\-\:\,]+$/, '').trim();

    if (!name) return;

    if (formatTitleCase) {
      name = toTurkishTitleCase(name);
    }

    if (!gender) {
      gender = guessGenderFromName(name);
    }

    results.push({
      id: `p-${Date.now()}-${index}`,
      number: number || String(nextAutoNumber++),
      name,
      gender: gender || 'M',
      isValid: true,
    });
  });

  return results;
}

/**
 * Detects if the pasted text has each field on a new line (e.g. copy from HTML table cell-by-cell)
 */
function checkIsInterleavedList(lines: string[]): boolean {
  if (lines.length < 4) return false;
  let numericLines = 0;
  lines.forEach((l) => {
    if (/^\d+$/.test(l.trim())) numericLines++;
  });
  // If around 30% to 60% of lines are purely numbers, it's likely interleaved
  const ratio = numericLines / lines.length;
  return ratio >= 0.28 && ratio <= 0.65;
}

/**
 * Handles interleaved lines (e.g. Number on one line, Name on the next line)
 */
function parseInterleavedLines(
  lines: string[],
  startingNumber = 1,
  formatTitleCase = true
): ParsedStudentItem[] {
  const results: ParsedStudentItem[] = [];
  let currentNumber = '';
  let currentName = '';
  let currentGender: 'M' | 'F' | undefined = undefined;
  let autoNum = startingNumber;

  const pushCurrent = () => {
    if (currentName) {
      const formattedName = formatTitleCase ? toTurkishTitleCase(currentName) : currentName;
      results.push({
        id: `p-int-${Date.now()}-${results.length}`,
        number: currentNumber || String(autoNum++),
        name: formattedName,
        gender: currentGender || guessGenderFromName(formattedName),
        isValid: true,
      });
    }
    currentNumber = '';
    currentName = '';
    currentGender = undefined;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check gender
    const g = parseGenderString(line);
    if (g && (line.length <= 5 || line.toLowerCase() === 'erkek' || line.toLowerCase() === 'kız')) {
      currentGender = g;
      continue;
    }

    // Ignore 11 digit TC No
    if (/^\d{11}$/.test(line)) continue;

    // Number check
    if (/^\d+$/.test(line)) {
      if (currentName) {
        // We already have a name, so this number belongs to the next student
        pushCurrent();
        currentNumber = line;
      } else {
        // If we already have a number and this is a second number,
        // the first is Sıra No and the second is Okul No
        currentNumber = line;
      }
    } else {
      // Text line -> Name
      if (currentName) {
        // Concat surname if already has first name and no surname
        currentName = `${currentName} ${line}`;
      } else {
        currentName = line;
      }
    }
  }

  // Push last student
  pushCurrent();

  return results;
}

/**
 * Parses an Excel (.xlsx / .xls) or CSV FileBuffer with deep table header recognition.
 */
export async function parseExcelOrCsvFile(
  file: File,
  formatTitleCase = true
): Promise<ParsedStudentItem[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  // Convert sheet to array of rows
  const rawRows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1, // array of arrays
    defval: '',
  }) as unknown as unknown[][];

  if (!rawRows || rawRows.length === 0) return [];

  let headerRowIndex = -1;
  let numberCol = -1;
  let seqCol = -1;
  let nameCol = -1;
  let surnameCol = -1;
  let genderCol = -1;

  // Scan up to the first 25 rows to detect header row
  for (let i = 0; i < Math.min(25, rawRows.length); i++) {
    const row = rawRows[i] || [];
    row.forEach((cell, colIndex) => {
      const cellStr = String(cell).toLocaleLowerCase('tr-TR').trim();
      if (!cellStr) return;

      // Okul / Öğrenci Numarası
      if (
        cellStr === 'okul no' ||
        cellStr === 'öğrenci no' ||
        cellStr === 'numara' ||
        cellStr === 'numarası' ||
        cellStr === 'öğr no' ||
        cellStr === 'öğr. no' ||
        cellStr === 'okul numarası'
      ) {
        numberCol = colIndex;
        headerRowIndex = i;
      } else if (cellStr === 'no' && numberCol === -1) {
        numberCol = colIndex;
        headerRowIndex = i;
      }

      // Sıra No
      if (
        cellStr === 'sıra' ||
        cellStr === 'sıra no' ||
        cellStr === 's.no' ||
        cellStr === 's. no' ||
        cellStr === 'sn'
      ) {
        seqCol = colIndex;
      }

      // İsim / Adı
      if (
        cellStr === 'adı soyadı' ||
        cellStr === 'ad soyad' ||
        cellStr === 'adı ve soyadı' ||
        cellStr === 'öğrenci adı soyadı'
      ) {
        nameCol = colIndex;
        headerRowIndex = i;
      } else if (
        (cellStr === 'adı' || cellStr === 'ad' || cellStr === 'öğrenci adı') &&
        nameCol === -1
      ) {
        nameCol = colIndex;
        headerRowIndex = i;
      }

      // Soyadı
      if (
        cellStr === 'soyadı' ||
        cellStr === 'soyad' ||
        cellStr === 'öğrenci soyadı'
      ) {
        surnameCol = colIndex;
      }

      // Cinsiyet
      if (
        cellStr === 'cinsiyet' ||
        cellStr === 'cinsiyeti' ||
        cellStr === 'cins'
      ) {
        genderCol = colIndex;
      }
    });

    if (nameCol !== -1 && (numberCol !== -1 || seqCol !== -1)) {
      break;
    }
  }

  // If numberCol not found but seqCol was found
  if (numberCol === -1 && seqCol !== -1) {
    numberCol = seqCol;
  }

  const results: ParsedStudentItem[] = [];
  const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;
  let autoNum = 1;

  for (let r = startRow; r < rawRows.length; r++) {
    const row = rawRows[r] || [];
    if (row.length === 0) continue;

    let number = '';
    let name = '';
    let gender: 'M' | 'F' | undefined = undefined;

    if (nameCol !== -1) {
      name = String(row[nameCol] || '').trim();
      if (surnameCol !== -1 && row[surnameCol]) {
        name = `${name} ${String(row[surnameCol]).trim()}`.trim();
      }
      if (numberCol !== -1 && row[numberCol] !== undefined) {
        number = String(row[numberCol]).trim();
      }
      if (genderCol !== -1 && row[genderCol] !== undefined) {
        gender = parseGenderString(row[genderCol]);
      }
    } else {
      // Heuristic fallback: inspect row cells
      row.forEach((cell) => {
        const str = String(cell).trim();
        if (!str) return;
        // Ignore 11 digit TC
        if (/^\d{11}$/.test(str)) return;

        if (/^\d+$/.test(str) && !number) {
          number = str;
        } else if (!name && str.length > 2 && !/^\d+$/.test(str)) {
          name = str;
        } else if (!gender) {
          gender = parseGenderString(str);
        }
      });
    }

    // Skip banner or header remnants in data rows
    if (!name || isHeaderOrBannerLine(name)) continue;

    if (formatTitleCase) {
      name = toTurkishTitleCase(name);
    }

    if (!number) {
      number = String(autoNum++);
    }

    if (!gender) {
      gender = guessGenderFromName(name);
    }

    results.push({
      id: `p-xls-${Date.now()}-${r}`,
      number,
      name,
      gender: gender || 'M',
      isValid: true,
    });
  }

  return results;
}
