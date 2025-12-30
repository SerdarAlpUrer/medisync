
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const CATEGORIES = [
    "AMELİYAT MASASI", "ASPİRATÖR", "BENMARİ", "BIPAP CİHAZI", "CBAP CİHAZI", "DİSPENSER",
    "EFORLU EKG", "EKG CİHAZI", "EKG HOLTER", "EKO CİHAZI", "ELEKTROKOTER", "EMG CİHAZI",
    "ENDOSKOPİ YIKAMA", "HASTABAŞI MONİTÖR", "HEMOTOGRİT SANTRİFÜJ", "HORTUM KAPAMA CİHAZI",
    "İNKÜBATÖR", "JİNEKOLOJİ KOLTUĞU", "KAN ÇALKALAMA CİHAZI", "KAN SAKLAMA DOLABI",
    "KEMİK DANSİTOMETRE", "LENSMETRE", "MAMOGRAFİ", "MİKROPİPET", "MİKROSKOP", "NST CİHAZI",
    "ODYOMETRE CİHAZI", "OTOMATİK ENJEKTÖR", "OTOMATİK TANSİYON ALETİ", "OTOREFKRATOMETRE",
    "PULSOKSİMETRE", "RESPRONICS CİHAZI", "RF KOTER", "RÖNTGEN CİHAZI", "SANTRİFÜJ",
    "SEYYAR LAMBA", "SEYYAR RÖNTGEN", "SFT CİHAZI", "TANSİYON ALETİ", "TANSİYON HOLTER",
    "TERAZİ", "TOMOGRAFİ CİHAZI", "TONOMETRE CİHAZI", "ULTRASON CİHAZI", "ABR CİHAZI",
    "DEFİBRİLATÖR", "PERFÜZÖR", "VENTİLATÖR", "Timpanometri", "ATEŞ ÖLÇER", "HASTA ISITICI",
    "NEBULİZATÖR", "RADYAN ISITICI", "THERMOHYGROMETRE", "AMELİYAT LAMBASI", "ANESTEZİ CİHAZI",
    "BEBEK TERAZİ", "C KOLLU SKOPİ", "FLASH OTOKLAV", "LİGASURE CİHAZI", "PİEZO CİHAZI",
    "LİPOSUCTION", "PCA CİHAZI", "TUR MOTORU", "ÜROLOJİ KOTERİ", "VAPORİZATÖR",
    "BUZDOLABI DERECESİ", "Diyaliz Cihazı", "EL DOPPLER", "KÜVÖZ", "T PARÇA CANLANDIRICI",
    "TRANSPORT VENTİLATÖR", "İNFÜZYON POMPASI", "BİYOLOJİK İNDÜKATÖR", "OTOKLAV",
    "OTOMATİK PAKETLEME", "STERİLİZATÖR", "ULTRASONİK YIKAMA", "DESİBELMETRE", "FOTOTERAPİ",
    "PACE MAKER"
];

export async function GET() {
    try {
        const results = {
            added: 0,
            updated: 0,
            errors: 0
        }

        for (const catName of CATEGORIES) {
            try {
                const trimmedName = catName.trim();
                const code = trimmedName.toLocaleUpperCase('tr-TR').replace(/\s+/g, '_');

                // Only create if not exists, or update name if exists (upsert)
                await prisma.deviceCategory.upsert({
                    where: { code: code },
                    update: { name: trimmedName }, // Update name in case formatting changed
                    create: {
                        name: trimmedName,
                        code: code
                    }
                });
                results.added++;
            } catch (e) {
                console.error(`Status update error for ${catName}`, e);
                results.errors++;
            }
        }

        return NextResponse.json({
            message: 'Categories processed',
            results,
            total: CATEGORIES.length
        })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error', details: error }, { status: 500 })
    }
}
