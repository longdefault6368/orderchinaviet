/**
 * Vietnam Administrative Divisions API Service
 * Fetches 63 Provinces and 705+ Districts from official open API: https://provinces.open-api.vn/
 * Features automatic localStorage caching and offline fallback.
 */

export interface ApiDistrict {
  code: number;
  name: string;
  division_type: string;
  codename: string;
  province_code: number;
}

export interface ApiProvince {
  code: number;
  name: string;
  division_type: string;
  codename: string;
  phone_code: number;
  districts: ApiDistrict[];
}

const CACHE_KEY = 'ocv_vietnam_locations_v1';

// Standard 63 Provinces official names fallback list
export const FALLBACK_PROVINCES = [
  'Thành phố Hà Nội',
  'Tỉnh Hà Giang',
  'Tỉnh Cao Bằng',
  'Tỉnh Bắc Kạn',
  'Tỉnh Tuyên Quang',
  'Tỉnh Lào Cai',
  'Tỉnh Điện Biên',
  'Tỉnh Lai Châu',
  'Tỉnh Sơn La',
  'Tỉnh Yên Bái',
  'Tỉnh Hoà Bình',
  'Tỉnh Thái Nguyên',
  'Tỉnh Lạng Sơn',
  'Tỉnh Quảng Ninh',
  'Tỉnh Bắc Giang',
  'Tỉnh Phú Thọ',
  'Tỉnh Vĩnh Phúc',
  'Tỉnh Bắc Ninh',
  'Tỉnh Hải Dương',
  'Thành phố Hải Phòng',
  'Tỉnh Hưng Yên',
  'Tỉnh Thái Bình',
  'Tỉnh Hà Nam',
  'Tỉnh Nam Định',
  'Tỉnh Ninh Bình',
  'Tỉnh Thanh Hóa',
  'Tỉnh Nghệ An',
  'Tỉnh Hà Tĩnh',
  'Tỉnh Quảng Bình',
  'Tỉnh Quảng Trị',
  'Tỉnh Thừa Thiên Huế',
  'Thành phố Đà Nẵng',
  'Tỉnh Quảng Nam',
  'Tỉnh Quảng Ngãi',
  'Tỉnh Bình Định',
  'Tỉnh Phú Yên',
  'Tỉnh Khánh Hòa',
  'Tỉnh Ninh Thuận',
  'Tỉnh Bình Thuận',
  'Tỉnh Kon Tum',
  'Tỉnh Gia Lai',
  'Tỉnh Đắk Lắk',
  'Tỉnh Đắk Nông',
  'Tỉnh Lâm Đồng',
  'Tỉnh Bình Phước',
  'Tỉnh Tây Ninh',
  'Tỉnh Bình Dương',
  'Tỉnh Đồng Nai',
  'Tỉnh Bà Rịa - Vũng Tàu',
  'Thành phố Hồ Chí Minh',
  'Tỉnh Long An',
  'Tỉnh Tiền Giang',
  'Tỉnh Bến Tre',
  'Tỉnh Trà Vinh',
  'Tỉnh Vĩnh Long',
  'Tỉnh Đồng Tháp',
  'Tỉnh An Giang',
  'Tỉnh Kiên Giang',
  'Thành phố Cần Thơ',
  'Tỉnh Hậu Giang',
  'Tỉnh Sóc Trăng',
  'Tỉnh Bạc Liêu',
  'Tỉnh Cà Mau',
];

export async function fetchVietnamLocations(): Promise<ApiProvince[]> {
  // 1. Try reading from localStorage cache
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length >= 60) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  // 2. Fetch live from provinces.open-api.vn
  try {
    const res = await fetch('https://provinces.open-api.vn/api/?depth=2', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data: ApiProvince[] = await res.json();
      if (Array.isArray(data) && data.length >= 60) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
          } catch {
            // ignore
          }
        }
        return data;
      }
    }
  } catch (err) {
    console.warn('Cannot fetch from provinces.open-api.vn, using offline fallback', err);
  }

  // 3. Fallback dummy structure if offline
  return FALLBACK_PROVINCES.map((p, idx) => ({
    code: idx + 1,
    name: p,
    division_type: 'tỉnh',
    codename: p.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    phone_code: 0,
    districts: [
      {
        code: 1,
        name: 'Quận / Huyện trung tâm',
        division_type: 'huyện',
        codename: 'quan_trung_tam',
        province_code: idx + 1,
      },
      {
        code: 2,
        name: 'Thành phố / Thị xã trực thuộc',
        division_type: 'thành phố',
        codename: 'thanh_pho_truc_thuoc',
        province_code: idx + 1,
      },
    ],
  }));
}

/**
 * Normalizes province / district names for easy fuzzy matching
 * (e.g. "Thành phố Hà Nội" <-> "Hà Nội", "Tỉnh Quảng Ninh" <-> "Quảng Ninh")
 */
export function normalizeLocationName(name: string): string {
  if (!name) return '';
  return name
    .replace(/^(Thành phố|Tỉnh|Quận|Huyện|Thị xã|TP\.)\s+/i, '')
    .trim();
}

/**
 * Robustly find matching province from API list or fallback
 */
export function findMatchingProvince(
  provinces: ApiProvince[],
  inputName: string
): ApiProvince | undefined {
  if (!inputName) return undefined;
  const cleanInput = normalizeLocationName(inputName).toLowerCase();
  return provinces.find(
    (p) =>
      p.name.toLowerCase() === inputName.toLowerCase() ||
      normalizeLocationName(p.name).toLowerCase() === cleanInput
  );
}

/**
 * Robustly find matching district from district list
 */
export function findMatchingDistrict(
  districts: ApiDistrict[],
  inputName: string
): ApiDistrict | undefined {
  if (!inputName) return undefined;
  const cleanInput = normalizeLocationName(inputName).toLowerCase();
  return districts.find(
    (d) =>
      d.name.toLowerCase() === inputName.toLowerCase() ||
      normalizeLocationName(d.name).toLowerCase() === cleanInput
  );
}
